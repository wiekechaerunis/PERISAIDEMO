// Turunan data murni untuk halaman kerja PIC (board P12, P12g, P12h, P14, P16, P17, PS1..PS11).
import { demoNow } from '@/services/mock/clock';
import type { Incident, TimelineEntry } from '@/services/types';
import { DEMO_USERS, type Role } from '@/lib/rbac';
import { SEV_LABEL, isHighOrCritical } from '@/lib/severity';
import { formatDateShort, formatWibFull } from '@/lib/format';

import { GROUP_MEMBERS, GROUP_NAME, handlingOf } from '@/services/mock/workflow.handling';
import { addMinutes, registeredAt } from '../components/detail/detailLogic';
import { dueIndicator } from './list';
import type { HandledBy } from '@/services/ai/types';

export type HandlingState =
  | 'lewat-tenggat' | 'kronologi-kosong' | 'kronologi-gagal' | 'catatan-gagal' | 'belum-lengkap' | 'memuat' | 'dikembalikan';
const STATES: HandlingState[] = ['lewat-tenggat', 'kronologi-kosong', 'kronologi-gagal', 'catatan-gagal', 'belum-lengkap', 'memuat', 'dikembalikan'];
export const parseState = (v: string | null): HandlingState | null => (STATES as string[]).includes(v ?? '') ? (v as HandlingState) : null;

/** Pengguna menjadi PIC: nama sama dengan `pic`, atau anggota grup bila PIC berupa grup. */
export function isPicOf(i: Incident, role: Role): boolean {
  const me = DEMO_USERS[role].name;
  if (i.pic && i.pic === me) return true;
  return i.picKind === 'grup' && GROUP_MEMBERS.includes(me);
}

export type PicMode = 'solo' | 'grup-belum' | 'grup-saya' | 'grup-lain';
export function picMode(i: Incident, me: string): PicMode {
  if (i.picKind !== 'grup') return 'solo';
  const t = handlingOf(i).takenBy;
  if (!t) return 'grup-belum';
  return t === me ? 'grup-saya' : 'grup-lain';
}
export const initialsOf = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export { GROUP_NAME, GROUP_MEMBERS };

const DAY = 86_400_000;
const MS = (iso: string) => new Date(iso).getTime();
export const addDaysIso = (iso: string, d: number) => new Date(MS(iso + 'Z') + d * DAY).toISOString().slice(0, 19);

/** Tenggat efektif: state lewat-tenggat memajukan tenggat ke 2 hari lalu bila belum lewat. */
export function effectiveDue(i: Incident, st: HandlingState | null): string | undefined {
  if (st === 'lewat-tenggat' && (!i.handleDueAt || MS(i.handleDueAt) >= MS(demoNow()))) return addDaysIso(demoNow(), -2);
  return i.handleDueAt;
}
export const isOverdue = (due?: string) => !!due && MS(due) < MS(demoNow());
export const dueBadge = (due: string) => dueIndicator(due);

export interface HEntry {
  key: string;
  kind: 'note' | 'wa' | 'sys' | 'esc';
  nd: '' | 'now' | 'ok' | 'err' | 'warn';
  icon: 'note' | 'check' | 'clock' | 'esc' | 'merge';
  bold: string;
  rest?: string;
  tm: string;
  body?: string;
  src?: 'esc';
  at: string;
}

const PEJABAT = DEMO_USERS.pejabat.name;

/** Riwayat gabungan catatan + timeline, terbaru di atas. */
export function historyEntries(i: Incident, due: string | undefined, hideNotes = false): HEntry[] {
  const h = handlingOf(i);
  const tl: TimelineEntry[] = i.timeline ?? [];
  const list: HEntry[] = [];
  const wib = formatWibFull;
  tl.forEach((e, n) => {
    const key = `t${n}`;
    if (e.text.startsWith('Menambah catatan')) return;
    if (e.text.startsWith('Mengajukan laporan')) {
      list.push({ key, kind: 'sys', nd: 'ok', icon: 'check', bold: 'Diajukan', rest: ` · ${e.by}`, tm: wib(e.at), at: e.at });
      if (isHighOrCritical(i.severity) && !tl.some((x) => x.text.startsWith('SKK Migas diberi tahu'))) {
        const at = addMinutes(e.at, 1);
        list.push({ key: key + 'k', kind: 'sys', nd: 'ok', icon: 'check', bold: 'SKK Migas diberi tahu', rest: ' · jalur cepat', tm: wib(at), at });
      }
    } else if (e.text.startsWith('SKK Migas diberi tahu')) {
      list.push({ key, kind: 'sys', nd: 'ok', icon: 'check', bold: 'SKK Migas diberi tahu', rest: ' · jalur cepat', tm: wib(e.at), at: e.at });
    } else if (e.text.startsWith('Menyetujui insiden')) {
      list.push({ key, kind: 'sys', nd: 'ok', icon: 'check', bold: 'Disetujui', rest: ` · ${e.by}`, tm: wib(e.at), at: e.at,
        body: `PIC ${i.pic ?? '-'}${i.handleDueAt ? ` · tenggat ${wib(i.handleDueAt)}` : ''}` });
    } else if (e.text.startsWith('Eskalasi ke')) {
      list.push({ key, kind: 'esc', nd: 'warn', icon: 'esc', bold: e.text.split('. ')[0], rest: ` · ${e.by}`, src: 'esc', tm: wib(e.at), at: e.at, body: h.escalationReason });
    } else if (e.text.startsWith('Mengambil alih')) {
      list.push({ key, kind: 'sys', nd: '', icon: 'check', bold: 'Diambil alih', rest: ` · ${e.by}`, tm: wib(e.at), at: e.at, body: e.text });
    } else {
      list.push({ key, kind: 'sys', nd: '', icon: 'check', bold: e.text.replace(/\.$/, ''), rest: ` · ${e.by}`, tm: wib(e.at), at: e.at });
    }
  });
  if (!hideNotes) {
    h.notes.forEach((n, k) => {
      const fresh = n.at === demoNow();
      list.push({ key: `n${k}`, kind: 'note', nd: fresh ? 'now' : '', icon: 'note', bold: 'Catatan', rest: ` · ${n.by}`, tm: fresh ? 'Baru saja' : wib(n.at), at: n.at, body: n.text });
    });
  }
  if (isOverdue(due) && !i.handling?.escalatedTo && !tl.some((x) => x.text.startsWith('Eskalasi'))) {
    list.push({ key: 'auto', kind: 'esc', nd: 'err', icon: 'clock', bold: `Eskalasi otomatis ke ${PEJABAT}`, rest: ' · Sistem', src: 'esc', tm: wib(due!), at: due!, body: `Tenggat ${wib(due!)} terlewat.` });
  }
  return list
    .map((e, n) => ({ e, n }))
    .sort((a, b) => (a.e.at < b.e.at ? 1 : a.e.at > b.e.at ? -1 : b.n - a.n))
    .map((x) => x.e);
}

/** Entri tampil: >3 entri → hanya yang bukan sistem; sisanya di balik "Tampilkan N entri sebelumnya". */
export function collapseHistory(all: HEntry[], expanded: boolean): { shown: HEntry[]; hidden: number } {
  if (expanded || all.length <= 3) return { shown: all, hidden: 0 };
  let shown = all.filter((e) => e.kind !== 'sys');
  if (!shown.length) shown = all.slice(0, 3);
  return { shown, hidden: all.length - shown.length };
}

export interface AuditEntry { cat: 'Status' | 'Klasifikasi' | 'PIC dan eskalasi' | 'Tenggat' | 'Akses'; icon: 'check' | 'tag' | 'person' | 'clock' | 'send'; text: string; meta: string; note?: string }

/** Jejak audit (panel samping), terbaru di atas, diturunkan dari data insiden. */
export function auditEntries(i: Incident, due: string | undefined): AuditEntry[] {
  const h = handlingOf(i);
  const out: AuditEntry[] = [];
  const reg = registeredAt(i);
  const d = (iso: string) => `${formatDateShort(iso)}, ${iso.slice(11, 16)}`;
  const reporter = (i.timeline ?? []).find((t) => t.text.startsWith('Mengajukan laporan'))?.by ?? i.reporter;
  out.push({ cat: 'Status', icon: 'send', text: 'Status: Draft → Menunggu pemeriksaan', meta: `${reporter} · ${d(reg)}` });
  const ap = (i.timeline ?? []).find((t) => t.text.startsWith('Menyetujui insiden'));
  if (ap) {
    out.push({ cat: 'PIC dan eskalasi', icon: 'person', text: `PIC: — → ${i.pic ?? '-'}`, meta: `${ap.by} · ${d(ap.at)}` });
    out.push({ cat: 'Klasifikasi', icon: 'tag', text: `Klasifikasi: ${i.category}${i.severity ? ` · ${SEV_LABEL[i.severity]}` : ''}${i.priority ? ` · prioritas ${i.priority[0].toUpperCase()}${i.priority.slice(1)}` : ''}`, meta: `${ap.by} · ${d(ap.at)}` });
    out.push({ cat: 'Status', icon: 'check', text: 'Status: Menunggu pemeriksaan → Dalam penanganan', meta: `${ap.by} · ${d(ap.at)}` });
    if (due) out.push({ cat: 'Tenggat', icon: 'clock', text: `Tenggat: — → ${formatWibFull(due)}`, meta: `Sistem · dari keparahan ${i.severity ? SEV_LABEL[i.severity] : '-'} · ${d(ap.at)}` });
  }
  if (h.takenBy) out.push({ cat: 'PIC dan eskalasi', icon: 'person', text: `PIC: ${i.pic ?? GROUP_NAME} → ${h.takenBy}`, meta: `${h.takenBy} · ${d(demoNow())}` });
  if (h.escalatedTo) out.push({ cat: 'PIC dan eskalasi', icon: 'person', text: `Eskalasi: ke ${h.escalatedName ?? h.escalatedTo}`, meta: `${i.pic ?? ''} · ${d(demoNow())}`, note: h.escalationReason ? `Alasan: ${h.escalationReason}` : undefined });
  if (i.status === 'minta-ditutup') out.push({ cat: 'Status', icon: 'check', text: 'Status: Dalam penanganan → Menunggu penutupan', meta: `${i.pic ?? ''} · ${d(h.closure?.requestedAt ?? demoNow())}` });
  return out.reverse();
}

/** Mitra/penyebab/faktor (daftar pilihan demo; taksonomi PLT-06 menunggu K-05). */
export const PARTNER_OPTS: { name: string; type: HandledBy }[] = [
  { name: 'PT Garda Nusantara Sejahtera · BUJP', type: 'bujp' },
  { name: 'Polres Musi Banyuasin · Polri', type: 'polri' },
  { name: 'Kodim 0402 Musi Banyuasin · TNI', type: 'tni' },
  { name: 'Security internal', type: 'int' },
];
export const CAUSE_OPTS = ['Celah pengamanan fisik', 'Kelalaian prosedur', 'Tindak kriminal pihak luar', 'Faktor sosial dan masyarakat', 'Gangguan teknis atau cuaca', 'Lainnya'];
export const FACTOR_OPTS = ['Lemahnya pengawasan malam', 'Celah pagar', 'Penerangan kurang', 'CCTV tidak menjangkau', 'Prosedur tidak dijalankan', 'Kondisi sosial sekitar'];
export const typesOf = (names: string[]): HandledBy[] => [...new Set(names.map((n) => PARTNER_OPTS.find((p) => p.name === n)?.type).filter((x): x is HandledBy => !!x))];

/** Contoh isian untuk ?state=belum-lengkap dan ?state=dikembalikan (board PS6, PS11). */
export const SAMPLE_CLOSURE = {
  actions: 'Kabel 40 m diganti, pompa menyala 29 Okt 16.10. Laporan polisi dibuat. Gembok panel diganti tipe anti potong.',
  partnerNames: ['PT Garda Nusantara Sejahtera · BUJP'],
  causeDetail: 'Panel listrik berada di luar jangkauan CCTV dan pagar sisi panel rendah.',
  factors: ['Lemahnya pengawasan malam', 'Celah pagar'],
};
export const DEMO_RETURN = { text: 'Lampirkan berita acara yang sudah ditandatangani Polsek, bukan draf.', by: PEJABAT, at: '2026-10-30T10:12:00' };
export const ESC_TARGETS = {
  pejabat: ['Rudi Hartono · Pejabat Berwenang'],
  skk: ['Hendra Wijaya · Pengawas SKK'],
};
export const PEJABAT_NAME = PEJABAT;
