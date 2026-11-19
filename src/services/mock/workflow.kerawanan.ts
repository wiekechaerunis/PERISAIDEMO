// Alur Kerawanan setelah tercatat (fase 5; board KD1–KD6, KF1). Fungsi murni gaya workflow.ts: menerima state, mengembalikan state baru.
// Keputusan PM 18 Nov: Naikkan jadi insiden dilakukan Pejabat tanpa approver tambahan (langsung disetujui + PIC, satu catatan);
// Ajukan jadi insiden (Pelapor/pengguna WK sama) masuk Menunggu pemeriksaan; Tambah perkembangan + "Makin rawan" memberi tahu Pejabat.
import type { DemoState, Incident, Kerawanan, KerawananProgress, ModuleConfig, TimelineEntry } from '../types';
import type { Axis } from '@/features/insiden/logic/draft';
import { nextNumber } from '@/features/insiden/logic/submit';
import { handlingDeadline } from '@/lib/deadline';
import { isHighOrCritical, suggestSeverity, type CasualtyKind, type OpsImpact, type Severity } from '@/lib/severity';
import { KERAWANAN_BOARD, KERAWANAN_DETAIL } from './seedExtra';
import type { DecisionResult } from './workflow';

type Slice = Pick<DemoState, 'incidents' | 'kerawanan' | 'config'>;

/** Waktu "sekarang" alur Kerawanan: tanggal board KD1/KD4 (18 Nov 2026, 10:42 WIB). */
export const KRW_NOW = '2026-11-18T10:42:00';
/** Waktu entri perkembangan baru (board KD1: 19 Nov 2026, 06:10 WIB). */
export const KRW_PROGRESS_AT = '2026-11-19T06:10:00';
/** ASSUMPTION: batas pemeriksaan 24 jam sejak diajukan (sama dengan buildIncident). */
const VERIFY_HOURS = 24;

export const MIN_RAISE_REASON = 10;
export const MAX_RAISE_REASON = 500;
export const MAX_PROGRESS = 500;

const BULAN: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', Mei: '05', Jun: '06', Jul: '07', Agu: '08', Sep: '09', Okt: '10', Nov: '11', Des: '12' };

/** "18 Nov 2026, 07:20" → "2026-11-18T07:20:00" */
function parseBoardWhen(when: string): string | null {
  const m = /^(\d{1,2}) (\w{3}) (\d{4}), (\d{2}:\d{2})$/.exec(when);
  return m && BULAN[m[2]] ? `${m[3]}-${BULAN[m[2]]}-${m[1].padStart(2, '0')}T${m[4]}:00` : null;
}
const addMinutes = (iso: string, min: number) => new Date(new Date(iso + 'Z').getTime() + min * 60_000).toISOString().slice(0, 19);

/** Kerawanan dengan kolom deskriptif board (KERAWANAN_BOARD, KERAWANAN_DETAIL) di atas seed; kolom yang berubah (progress, worsening, raisedTo) tetap dari store. */
export function resolveKerawanan(k: Kerawanan): Kerawanan {
  const b = KERAWANAN_BOARD[k.no];
  const d = KERAWANAN_DETAIL[k.no];
  const observedAt = d?.observedAt ?? (b ? parseBoardWhen(b.when) : null) ?? k.observedAt;
  const loc = b?.loc ?? k.location;
  const [name, district] = loc.split(' · ');
  return {
    ...k,
    title: b?.title ?? k.title,
    kind: k.kind ?? d?.kind ?? b?.kind ?? 'Kondisi rawan',
    observedAt,
    recordedAt: k.recordedAt ?? d?.recordedAt ?? addMinutes(observedAt, 12),
    location: name,
    area: k.area ?? d?.area ?? (district ? `Kab. ${district} · Dalam ${k.wk}` : `Dalam ${k.wk}`),
    reporter: b?.rep ?? k.reporter,
    source: k.source ?? d?.source ?? b?.src,
    story: k.story ?? d?.story,
    patokan: k.patokan ?? d?.patokan,
    lat: k.lat ?? d?.lat ?? null,
    lng: k.lng ?? d?.lng ?? null,
    attachments: k.attachments ?? d?.attachments ?? [],
  };
}

export interface ImpactForm {
  axes: Axis[];
  ops: OpsImpact | null;
  opsHours: number | null;
  ongoing: boolean;
  lossIdr: number | null;
  casualties: Partial<Record<CasualtyKind, number>>;
  envNote: string;
  dataNote: string;
}

/** Saran keparahan dari sumbu dampak tertinggi (Konfigurasi › Matriks keparahan); tanpa dampak = Sangat rendah. */
export function suggestRaiseSeverity(f: ImpactForm, cfg: ModuleConfig): Severity {
  return (
    suggestSeverity(
      {
        ops: f.axes.includes('prop') ? f.ops : null,
        casualties: f.axes.includes('man') ? f.casualties : {},
        environment: f.axes.includes('ling'),
        data: f.axes.includes('data'),
        lossIdr: f.axes.includes('prop') ? (f.lossIdr ?? 0) : 0,
        kursIdrPerUsd: cfg.kursIdrPerUsd,
      },
      cfg.lossThresholdsUsd,
    ) ?? 'sangat-rendah'
  );
}

export interface SubmitInput extends ImpactForm {
  by: string;
  category: string;
  jenis?: string | null;
  securityImpact: string;
  severity: Severity;
  /** wajib bila `severity` beda dari saran */
  severityReason?: string;
  reason: string;
  /** judul insiden bila diperbaiki; bawaan = judul kerawanan */
  title?: string;
}
export interface RaiseInput extends SubmitInput {
  picKind: 'perorangan' | 'grup';
  pic: string;
}

export type RaiseErrors = Partial<Record<'category' | 'securityImpact' | 'axes' | 'ops' | 'opsHours' | 'casualties' | 'severityReason' | 'reason' | 'pic', string>>;

/** Validasi KD3/KD5: kategori, dampak, minimal satu sumbu beserta isiannya, alasan beda keparahan, alasan dinaikkan >= 10 karakter, PIC (KD3). */
export function raiseErrors(f: SubmitInput & { pic?: string }, suggested: Severity, needPic: boolean): RaiseErrors {
  const e: RaiseErrors = {};
  if (!f.category) e.category = 'Pilih kategori kejadian.';
  if (!f.securityImpact.trim()) e.securityImpact = 'Isi dampak keamanan.';
  if (f.axes.length === 0) e.axes = 'Pilih minimal satu yang terdampak.';
  if (f.axes.includes('prop')) {
    if (!f.ops) e.ops = 'Pilih kondisi operasi.';
    else if (f.ops !== 'tidak' && f.opsHours === null) e.opsHours = f.ops === 'berhenti' ? 'Isi berapa jam operasi berhenti.' : 'Isi berapa jam operasi terganggu.';
  }
  if (f.axes.includes('man') && Object.keys(f.casualties).length === 0) e.casualties = 'Pilih kondisi korban.';
  if (f.severity !== suggested && !f.severityReason?.trim()) e.severityReason = 'Jelaskan kenapa berbeda dari saran.';
  if (f.reason.trim().length < MIN_RAISE_REASON) e.reason = `Alasan minimal ${MIN_RAISE_REASON} karakter.`;
  if (needPic && !f.pic?.trim()) e.pic = 'Pilih PIC penanganan.';
  return e;
}

const firstError = (e: RaiseErrors) => Object.values(e)[0] ?? '';

function findKrw(s: Slice, no: string): { krw?: Kerawanan; bad?: string } {
  const krw = s.kerawanan.find((k) => k.no === no);
  if (!krw) return { bad: 'Kerawanan tidak ditemukan.' };
  if (krw.raisedTo) return { bad: `Kerawanan ini sudah dinaikkan jadi ${krw.raisedTo}.` };
  return { krw };
}

const areaShort = (r: Kerawanan) => (r.area ? r.area.replace(/^Kab\. /, '').replace(' · Dalam ', ' · ') : `${r.location} · ${r.wk}`);

function buildIncident(s: Slice, krw: Kerawanan, a: SubmitInput, no: string, extra: Partial<Incident>): Incident {
  const r = resolveKerawanan(krw);
  const suggested = suggestRaiseSeverity(a, s.config);
  const differs = a.severity !== suggested;
  const prop = a.axes.includes('prop');
  return {
    no, title: a.title?.trim() || r.title, category: a.category, location: r.location, area: areaShort(r), wk: r.wk, org: r.org,
    severity: a.severity, occurredAt: r.observedAt, status: 'review-internal', pic: null, reporter: r.reporter, source: 'form', fromKrw: r.no,
    officialSeverityReason: differs ? a.severityReason?.trim() : undefined,
    detail: {
      story: r.story ?? r.title, securityImpact: a.securityImpact.trim(), axes: a.axes, ops: prop ? a.ops : null,
      opsHours: prop && a.ops !== 'tidak' ? a.opsHours : null, ongoing: prop && a.ops !== 'tidak' ? a.ongoing : false,
      lossIdr: prop ? a.lossIdr : null, casualties: a.axes.includes('man') ? a.casualties : {}, handledBy: [], patokan: r.patokan ?? r.location,
      lat: r.lat ?? null, lng: r.lng ?? null, attachments: (r.attachments ?? []).map((f) => ({ ...f })),
      reporterSeverity: a.severity, severityReason: differs ? (a.severityReason?.trim() ?? '') : '', suggestedSeverity: suggested, jenis: a.jenis ?? null,
    },
    raisedReason: a.reason.trim(), raisedBy: a.by, raisedAt: KRW_NOW,
    ...extra,
  };
}

const stamp = (by: string, text: string): TimelineEntry => ({ at: KRW_NOW, by, text });
const registered = (r: Kerawanan): TimelineEntry => ({ at: r.recordedAt ?? r.observedAt, by: r.reporter, text: `Tercatat sebagai kerawanan ${r.no}.` });

/**
 * Naikkan jadi insiden (Pejabat Berwenang), cabang "berdampak": kerawanan itu sendiri menjadi insiden, langsung disetujui
 * (Dalam penanganan) dengan PIC; tenggat dari Konfigurasi › Tenggat. Satu catatan: nomor KRW tetap sebagai asal (`fromKrw` / `raisedTo`).
 */
export function raiseToIncident(s: Slice, krwNo: string, a: RaiseInput): DecisionResult {
  const { krw, bad } = findKrw(s, krwNo);
  if (!krw) return { ok: false, reason: bad ?? '' };
  const errors = raiseErrors(a, suggestRaiseSeverity(a, s.config), true);
  if (Object.keys(errors).length) return { ok: false, reason: firstError(errors) };
  const no = nextNumber('INS-SEN', s.incidents.map((i) => i.no));
  const r = resolveKerawanan(krw);
  const inc = buildIncident(s, krw, a, no, {
    status: 'dalam-penanganan', pic: a.pic, picKind: a.picKind, priority: isHighOrCritical(a.severity) ? 'tinggi' : 'normal',
    handleDueAt: handlingDeadline(KRW_NOW, a.severity, s.config.deadlines), verifiedBy: a.by, verifiedAt: KRW_NOW,
    skkNotified: isHighOrCritical(a.severity),
    timeline: [
      registered(r),
      stamp(a.by, `Dinaikkan jadi insiden dan disetujui. Alasan: ${a.reason.trim()}`),
      stamp(a.by, `Menetapkan PIC penanganan: ${a.pic}.`),
    ],
  });
  const kr: Kerawanan = { ...krw, raisedTo: no };
  return {
    ok: true, skkNotified: isHighOrCritical(a.severity),
    state: { ...s, incidents: [inc, ...s.incidents], kerawanan: s.kerawanan.map((k) => (k.no === krwNo ? kr : k)) },
  };
}

/** Ajukan jadi insiden (Pelapor/pengguna KKKS di WK sama): insiden Menunggu pemeriksaan tanpa PIC, menunggu pemeriksaan Pejabat. */
export function submitAsIncident(s: Slice, krwNo: string, a: SubmitInput): DecisionResult {
  const { krw, bad } = findKrw(s, krwNo);
  if (!krw) return { ok: false, reason: bad ?? '' };
  const errors = raiseErrors(a, suggestRaiseSeverity(a, s.config), false);
  if (Object.keys(errors).length) return { ok: false, reason: firstError(errors) };
  const no = nextNumber('INS-SEN', s.incidents.map((i) => i.no));
  const r = resolveKerawanan(krw);
  const inc = buildIncident(s, krw, a, no, {
    status: 'review-internal', pic: null, verifyDueAt: addMinutes(KRW_NOW, VERIFY_HOURS * 60),
    timeline: [registered(r), stamp(a.by, `Mengajukan kerawanan jadi insiden. Alasan: ${a.reason.trim()}`)],
  });
  const kr: Kerawanan = { ...krw, raisedTo: no };
  return {
    ok: true, skkNotified: false,
    state: { ...s, incidents: [inc, ...s.incidents], kerawanan: s.kerawanan.map((k) => (k.no === krwNo ? kr : k)) },
  };
}

export interface ProgressInput {
  by: string;
  text: string;
  /** tanda "Makin rawan": Pejabat diberi tahu seketika */
  worsening: boolean;
  photos?: string[];
}

/** Tambah perkembangan (KD6). Hanya untuk kerawanan yang belum dinaikkan; "Makin rawan" menandai `worsening`. */
export function addProgress(s: Slice, krwNo: string, a: ProgressInput): DecisionResult {
  const { krw, bad } = findKrw(s, krwNo);
  if (!krw) return { ok: false, reason: bad ?? '' };
  if (!a.text.trim()) return { ok: false, reason: 'Isi apa yang berubah.' };
  const entry: KerawananProgress = { at: KRW_PROGRESS_AT, by: a.by, text: a.text.trim(), worsening: a.worsening, photos: a.photos?.length ? a.photos : undefined };
  const kr: Kerawanan = { ...krw, worsening: krw.worsening || a.worsening, progress: [...(krw.progress ?? []), entry] };
  return { ok: true, state: { ...s, kerawanan: s.kerawanan.map((k) => (k.no === krwNo ? kr : k)) } };
}

/**
 * Cabang "kejadian baru di lokasi ini" (KD2 opsi b): insiden baru dibuat lewat alur Laporan baru; kerawanan tetap Tercatat sebagai pemicu.
 * Dipanggil setelah laporan itu diajukan untuk menautkan keduanya (`fromKrw`, tanpa `raisedTo`).
 */
export function linkNewIncident(s: Slice, krwNo: string, incidentNo: string, by: string): DecisionResult {
  const krw = s.kerawanan.find((k) => k.no === krwNo);
  const inc = s.incidents.find((i) => i.no === incidentNo);
  if (!krw || !inc) return { ok: false, reason: 'Kerawanan atau insiden tidak ditemukan.' };
  const entry: KerawananProgress = { at: KRW_NOW, by, text: `Kejadian baru di lokasi ini dilaporkan sebagai insiden ${incidentNo}.`, worsening: false };
  return {
    ok: true,
    state: {
      ...s,
      incidents: s.incidents.map((i) => (i.no === incidentNo ? { ...i, fromKrw: krwNo } : i)),
      kerawanan: s.kerawanan.map((k) => (k.no === krwNo ? { ...k, progress: [...(k.progress ?? []), entry] } : k)),
    },
  };
}
