// Turunan data untuk halaman detail insiden (board I15, I23, I32, V14, S12). Semua dari store, bukan teks statis.
import type { Incident, IncidentDetail, TimelineEntry } from '@/services/types';
import { DEMO_USERS, canCreateReport, isSkk, type Role } from '@/lib/rbac';
import { isHighOrCritical } from '@/lib/severity';
import { formatRupiah, formatWibFull } from '@/lib/format';
import { ORG } from '@/services/mock/seed';
import { emptyDraft, type ReportDraft } from '../../logic/draft';
import { KB, OPS, TIMS } from '../step2Data';

export const EMPTY_DETAIL: IncidentDetail = {
  story: '', securityImpact: '', axes: [], ops: null, opsHours: null, ongoing: false, lossIdr: null, casualties: {},
  handledBy: [], patokan: '', lat: null, lng: null, attachments: [], reporterSeverity: null, severityReason: '',
  suggestedSeverity: null, jenis: null,
};
export const detailOf = (i: Incident): IncidentDetail => i.detail ?? EMPTY_DETAIL;

/** Sumber WhatsApp contoh (board I23). ASSUMPTION: belum ada field sumber di Incident; dipakai untuk semua insiden source 'wa'. */
export const WA_SOURCE = {
  group: 'Pam ADR Area 2',
  sender: 'Joko (Danru BUJP)',
  text: 'Lapor, jam 1 malam kabel listrik pompa ADR-07 dipotong org tdk dikenal. Pompa mati. Sdh lapor polsek. Foto terlampir.',
  at: '2026-10-28T01:32:00',
  photos: 2,
};

export type Access = 'ok' | 'terbatas';

/** Terbatas: tidak ditemukan, ditandai terbatas, organisasi lain (peran KKKS), atau draf milik orang lain. */
export function accessOf(i: Incident | undefined, role: Role): Access {
  if (!i || i.restricted) return 'terbatas';
  if (!isSkk(role) && i.org !== ORG) return 'terbatas';
  // ADJ-18: draf terlihat semua pengguna KKKS organisasi yang sama; SKK tidak melihat draf
  if (i.status === 'draf' && isSkk(role)) return 'terbatas';
  return 'ok';
}

/** Pelapor laporan ini. ASSUMPTION: insiden dari WhatsApp (pelapor 'Pesan WhatsApp') dianggap diajukan Pelapor demo (board I23). */
export function isOwner(i: Incident, role: Role): boolean {
  return (
    canCreateReport(role) && (i.reporter === DEMO_USERS[role].name || (i.source === 'wa' && role === 'pelapor'))
  );
}

const MS = (iso: string) => new Date(iso + 'Z').getTime();
export const addMinutes = (iso: string, n: number) => new Date(MS(iso) + n * 60_000).toISOString().slice(0, 19);

/** "6 jam", "6 jam 20 menit", "1 hari 2 jam" */
export function formatDuration(fromIso: string, toIso: string): string {
  const mins = Math.max(0, Math.round((MS(toIso) - MS(fromIso)) / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const parts = [d ? `${d} hari` : '', h ? `${h} jam` : '', m && !d ? `${m} menit` : ''].filter(Boolean);
  return parts.join(' ') || '0 menit';
}

export const submittedEntry = (i: Incident): TimelineEntry | undefined =>
  i.timeline?.find((t) => t.text.startsWith('Mengajukan laporan'));
export const registeredAt = (i: Incident): string => submittedEntry(i)?.at ?? i.occurredAt;
export const verifiedEntry = (i: Incident): TimelineEntry | undefined =>
  i.timeline?.find((t) => t.text.startsWith('Menyetujui insiden'));

/** Insiden lain yang kemungkinan sama: lokasi dan kategori sama, salah satunya ditandai kemungkinan ganda. */
export function similarTo(i: Incident, all: Incident[]): Incident[] {
  return all.filter(
    (o) =>
      o.no !== i.no &&
      o.status !== 'draf' &&
      o.location === i.location &&
      o.category === i.category &&
      (o.possibleDuplicate || i.possibleDuplicate),
  );
}

export const wkShort = (wk: string) => wk.replace(/^WK\s+/, '');
const KAB = ['Musi Banyuasin', 'Banyuasin'];
/** "Kab. Musi Banyuasin · WK Andalas Darat" dari area + wk */
export function areaLine(i: Incident): string {
  const head = i.area.split(' · ')[0];
  return `${KAB.includes(head) ? 'Kab. ' : ''}${head} · WK ${wkShort(i.wk)}`;
}

export function opsText(d: IncidentDetail): string {
  const label = OPS.find(([k]) => k === d.ops)?.[1] ?? 'Tidak terganggu';
  return d.ops && d.ops !== 'tidak' && d.opsHours ? `${label} · ${d.opsHours} jam` : label;
}
export function casualtyText(d: IncidentDetail): string {
  const parts = KB.filter(([k]) => d.casualties[k] !== undefined && (k === 'belum' || (d.casualties[k] ?? 0) > 0)).map(([k, label]) =>
    k === 'belum' ? label : `${d.casualties[k]} ${label.toLowerCase()}`,
  );
  return parts.length ? parts.join(', ') : 'Tidak terdampak';
}
export const lossText = (d: IncidentDetail) => (d.lossIdr ? formatRupiah(d.lossIdr) : 'Belum diisi');
export const handledText = (d: IncidentDetail) =>
  d.handledBy.length ? d.handledBy.map((h) => TIMS.find(([k]) => k === h)?.[1] ?? h).join(', ') : 'Belum diisi';

export interface TlItem {
  cls: '' | 'now' | 'next';
  icon: 'send' | 'plus' | 'clock' | 'check' | 'undo';
  bold: string;
  rest?: string;
  dt?: string;
  tm?: string;
}

const wib = (at: string) => formatWibFull(at);

function entryItem(e: TimelineEntry, i: Incident, dup?: Incident): TlItem {
  if (e.text.startsWith('Mengajukan laporan'))
    return {
      cls: '', icon: 'send', bold: 'Diajukan', rest: ` oleh ${e.by}`, tm: wib(e.at),
      dt: i.possibleDuplicate && dup ? 'Tetap diajukan meski ada kemungkinan ganda' : undefined,
    };
  if (e.text.startsWith('Draf dibuat')) return { cls: '', icon: 'plus', bold: e.text, rest: ` oleh ${e.by}`, tm: wib(e.at) };
  if (e.text.startsWith('Menarik kembali'))
    return { cls: '', icon: 'undo', bold: 'Menarik kembali laporan', rest: ` oleh ${e.by}`, tm: wib(e.at) };
  if (e.text.startsWith('SKK Migas diberi tahu'))
    return { cls: '', icon: 'send', bold: 'SKK Migas diberi tahu', rest: ' · jalur cepat', tm: wib(e.at) };
  return { cls: '', icon: 'check', bold: e.text, rest: ` · ${e.by}`, tm: wib(e.at) };
}

/** Riwayat terbaru di atas. Jalur cepat SKK dan "Menunggu pemeriksaan" diturunkan dari status bila belum tercatat di timeline. */
export function buildTimeline(i: Incident, dup?: Incident): TlItem[] {
  const entries = i.timeline ?? [];
  const items: TlItem[] = [];
  for (const e of entries) {
    items.push(entryItem(e, i, dup));
    if (
      e.text.startsWith('Mengajukan laporan') &&
      isHighOrCritical(i.severity) &&
      !entries.some((x) => x.text.startsWith('SKK Migas diberi tahu'))
    ) {
      items.push({
        cls: '', icon: 'send', bold: 'SKK Migas diberi tahu', rest: ' · jalur cepat', tm: wib(addMinutes(e.at, 1)),
        dt:
          i.possibleDuplicate && dup
            ? `Dengan keterangan kemungkinan sama dengan ${dup.no}`
            : 'Hendra Wijaya, Pengawas SKK · Rudi Hartono, Pimpinan SKK',
      });
    }
  }
  const out = items.reverse();
  if (out.length) out[0] = { ...out[0], cls: 'now' };
  if (i.status === 'review-internal') {
    out.unshift({
      cls: 'next', icon: 'clock', bold: 'Menunggu pemeriksaan', rest: ' · Pejabat Berwenang KKKS',
      tm: i.verifyDueAt ? `Batas ${wib(i.verifyDueAt)}` : undefined,
    });
  }
  return out;
}

/** Isi draf Pelapor dari insiden (Perbaiki laporan / Lanjutkan draf setelah Tarik kembali). */
export function draftFromIncident(i: Incident): ReportDraft {
  const d = detailOf(i);
  return {
    ...emptyDraft(),
    no: i.no, createdBy: i.reporter, savedAt: i.timeline?.[i.timeline.length - 1]?.at ?? i.occurredAt,
    hasImpact: 'ya', kind: 'insiden', date: i.occurredAt.slice(0, 10), time: i.occurredAt.slice(11, 16), title: i.title,
    locationName: i.location, lat: d.lat, lng: d.lng, wk: i.wk, patokan: d.patokan, story: d.story, category: i.category,
    jenis: d.jenis, securityImpact: d.securityImpact, axes: d.axes, lossIdr: d.lossIdr, ops: d.ops, opsHours: d.opsHours,
    ongoing: d.ongoing, casualties: d.casualties, severity: d.reporterSeverity ?? i.severity,
    severityManual: !!d.reporterSeverity && d.reporterSeverity !== d.suggestedSeverity, severityReason: d.severityReason,
    handledBy: d.handledBy,
    attachments: d.attachments.map((a, n) => ({ id: `att-${i.no}-${n}`, name: a.name, sizeKb: a.sizeKb, caption: a.caption })),
  };
}

