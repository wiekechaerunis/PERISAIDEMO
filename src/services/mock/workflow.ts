// Transisi status insiden (FR-INS-21..28, 43, 55). Fungsi murni: menerima state, mengembalikan state baru.
import { demoNow } from '@/services/mock/clock';
import type { DemoState, Incident, Kerawanan, Priority } from '../types';
import { addWorkingDays } from '@/lib/workdays';
import { isHighOrCritical, type Severity } from '@/lib/severity';

import { nextNumber } from '@/features/insiden/logic/submit';

/** Irisan state untuk transisi. `followUps` opsional agar transisi lama (hanya insiden) tetap berlaku; transisi TL memerlukannya. */
export type Slice = Pick<DemoState, 'incidents' | 'kerawanan' | 'config'> & Partial<Pick<DemoState, 'followUps' | 'waMessages' | 'waDrafts'>>;
export type DecisionResult = { ok: true; state: Slice; skkNotified?: boolean } | { ok: false; reason: string };

/** Daftar PIC perorangan dan grup untuk dialog Setujui (data demo). */
export const PIC_PEOPLE = [
  { name: 'Andi Pratama', caption: 'Koordinator Security' },
  { name: 'Dedi Kurniawan', caption: 'Supervisor Security' },
];
export const PIC_GROUPS = [{ name: 'Tim Pengamanan ADR Area 2', caption: '4 anggota' }];

const stamp = (by: string, text: string) => ({ at: demoNow(), by, text });
const find = (s: Slice, no: string) => s.incidents.find((i) => i.no === no);
const put = (s: Slice, i: Incident): Slice => ({ ...s, incidents: s.incidents.map((x) => (x.no === i.no ? i : x)) });
const ensureReview = (i?: Incident): string | null =>
  !i ? 'Insiden tidak ditemukan.' : i.status !== 'review-internal' ? 'Sudah diputus penyetuju lain.' : null;

export interface ApproveInput {
  by: string;
  category: string;
  severity: Severity;
  /** wajib bila beda dari keparahan pelapor */
  severityReason?: string;
  priority: Priority;
  pic: string;
  picKind: 'perorangan' | 'grup';
  steps: string[];
  /** hari kerja; kosong = bawaan konfigurasi. Beda dari bawaan wajib beralasan. */
  dueDays?: number;
  dueReason?: string;
}

/** Setujui: Menunggu pemeriksaan → Dalam penanganan, PIC ditetapkan, tenggat dari Konfigurasi › Tenggat. */
export function approve(s: Slice, no: string, a: ApproveInput): DecisionResult {
  const i = find(s, no);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const changed = i.severity !== a.severity;
  if (changed && !a.severityReason?.trim()) return { ok: false, reason: 'Alasan perubahan keparahan wajib diisi.' };
  const defDays = s.config.deadlines[a.severity];
  const days = a.dueDays ?? defDays;
  if (!Number.isInteger(days) || days < 1) return { ok: false, reason: 'Isi bilangan bulat, minimal 1 hari kerja.' };
  const dueChanged = days !== defDays;
  if (dueChanged && !a.dueReason?.trim()) return { ok: false, reason: 'Alasan perubahan tenggat wajib diisi.' };
  const next: Incident = {
    ...i, status: 'dalam-penanganan', category: a.category, severity: a.severity, priority: a.priority,
    pic: a.pic, picKind: a.picKind, forwardedSteps: a.steps,
    officialSeverityReason: changed ? a.severityReason : undefined,
    handleDueAt: `${addWorkingDays(demoNow(), days).slice(0, 10)}T07:00:00`, handleDays: days,
    verifyDueAt: undefined, late: false, possibleDuplicate: false,
    skkNotified: i.skkNotified || isHighOrCritical(a.severity),
    timeline: [...(i.timeline ?? []), stamp(a.by, `Menyetujui insiden. PIC penanganan: ${a.pic}.${dueChanged ? ` Tenggat ${days} hari kerja (bawaan ${defDays}). Alasan: ${a.dueReason!.trim()}` : ''}`)],
  };
  return { ok: true, state: put(s, next) };
}

export function requestRevision(s: Slice, no: string, by: string, reason: string): DecisionResult {
  const i = find(s, no);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  if (!reason.trim()) return { ok: false, reason: 'Alasan revisi wajib diisi.' };
  return { ok: true, state: put(s, { ...i, status: 'perlu-perbaikan', revisionReason: reason, verifyDueAt: undefined, timeline: [...(i.timeline ?? []), stamp(by, `Meminta revisi: ${reason}`)] }) };
}

export function cancelIncident(s: Slice, no: string, by: string, reason: string): DecisionResult {
  const i = find(s, no);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  if (!reason.trim()) return { ok: false, reason: 'Alasan pembatalan wajib diisi.' };
  return { ok: true, state: put(s, { ...i, status: 'dibatalkan', cancelReason: reason, verifyDueAt: undefined, timeline: [...(i.timeline ?? []), stamp(by, `Membatalkan insiden: ${reason}`)] }) };
}

/** Gabung: insiden `no` menjadi bagian dari `parentNo`. */
export function mergeInto(s: Slice, no: string, parentNo: string, by: string, reason: string): DecisionResult {
  const i = find(s, no);
  const p = find(s, parentNo);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  if (!p || p.no === i.no) return { ok: false, reason: 'Insiden induk tidak valid.' };
  const merged: Incident = { ...i, status: 'digabung', mergedInto: parentNo, verifyDueAt: undefined, possibleDuplicate: false, timeline: [...(i.timeline ?? []), stamp(by, `Menggabungkan ke ${parentNo}. ${reason}`.trim())] };
  const parent: Incident = { ...p, timeline: [...(p.timeline ?? []), stamp(by, `${no} digabung ke insiden ini.`)] };
  return { ok: true, state: put(put(s, merged), parent) };
}

export function markRestricted(s: Slice, no: string, by: string): DecisionResult {
  const i = find(s, no);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  return { ok: true, state: put(s, { ...i, restricted: true, timeline: [...(i.timeline ?? []), stamp(by, 'Menandai insiden sebagai terbatas.')] }) };
}

/** Jadikan kerawanan: alasan wajib; insiden diganti kerawanan baru; SKK diberi tahu bila Tinggi/Kritis. */
export function makeKerawanan(s: Slice, no: string, _by: string, reason: string): DecisionResult {
  const i = find(s, no);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  if (!reason.trim()) return { ok: false, reason: 'Alasan wajib diisi.' };
  const krw: Kerawanan = {
    no: nextNumber('KRW-SEN', s.kerawanan.map((k) => k.no)), title: i.title, category: i.category, location: i.location,
    wk: i.wk, org: i.org, reporter: i.reporter, observedAt: i.occurredAt, convertedFrom: i.no, convertReason: reason,
  };
  return {
    ok: true, skkNotified: isHighOrCritical(i.severity),
    state: { ...s, incidents: s.incidents.filter((x) => x.no !== no), kerawanan: [krw, ...s.kerawanan] },
  };
}

export const MSG_WITHDRAW_LATE = 'Laporan sudah diproses Pejabat Berwenang dan tidak bisa ditarik kembali.';

/** Tarik kembali (Pelapor): Menunggu pemeriksaan → Draf. Pemeriksaan dibatalkan; draf bisa dilanjutkan dan diajukan ulang. */
export function withdraw(s: Slice, no: string, by: string): DecisionResult {
  const i = find(s, no);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  if (i.status !== 'review-internal') return { ok: false, reason: MSG_WITHDRAW_LATE };
  return {
    ok: true,
    state: put(s, { ...i, status: 'draf', verifyDueAt: undefined, late: false, possibleDuplicate: false, timeline: [...(i.timeline ?? []), stamp(by, 'Menarik kembali laporan')] }),
  };
}

/** Tetapkan jenis resmi (turunan kategori) saat pemeriksaan; null menghapus. */
export function setJenis(s: Slice, no: string, jenis: string | null): DecisionResult {
  const i = find(s, no);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  return { ok: true, state: put(s, { ...i, detail: i.detail ? { ...i.detail, jenis } : i.detail }) };
}

/** Putuskan tanda kemungkinan ganda: "Tautkan" (kejadian berbeda tapi berkaitan) atau "Tetap terpisah" (parentNo null). */
export function resolveDuplicate(s: Slice, no: string, by: string, linkedNo: string | null): DecisionResult {
  const i = find(s, no);
  const bad = ensureReview(i);
  if (bad || !i) return { ok: false, reason: bad ?? '' };
  const text = linkedNo ? `Menautkan dengan ${linkedNo}. Kedua insiden tetap berjalan.` : 'Memutuskan tetap sebagai insiden terpisah.';
  return { ok: true, state: put(s, { ...i, possibleDuplicate: false, timeline: [...(i.timeline ?? []), stamp(by, text)] }) };
}
