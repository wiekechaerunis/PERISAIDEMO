// Perbarui dampak selama penanganan dan Koreksi data setelah ditutup (ADJ-07; board PD1, PD1m, PD2, PD3). Fungsi murni.
// - Naik: level baru langsung berlaku; SKK diberi tahu bila Tinggi/Kritis; tenggat = min(tenggat lama, waktu kenaikan + tenggat level baru);
//   Pejabat Berwenang bisa "Kembalikan ke level sebelumnya" dengan alasan.
// - Turun: level lama tetap sampai Pejabat Berwenang mengonfirmasi; tenggat tidak diperpanjang.
// - Diperbarui Pejabat Berwenang: level berubah langsung tanpa konfirmasi.
// - Setiap pembaruan menjadi entri Riwayat dengan nilai sebelum → sesudah; nilai lama tidak hilang.
import { demoNow } from '@/services/mock/clock';
import { addWorkingDays } from '@/lib/workdays';
import { formatRupiah } from '@/lib/format';
import { SEV_LABEL, isHighOrCritical, sevRank, suggestSeverity, type CasualtyKind, type OpsImpact, type Severity } from '@/lib/severity';
import type { Incident, IncidentDetail } from '../types';
import type { DecisionResult, Slice } from './workflow';

export const MIN_IMPACT_REASON = 10;

export interface ImpactPatch {
  ops: OpsImpact | null;
  opsHours: number | null;
  ongoing: boolean;
  opsUnknown?: boolean;
  casualties: Partial<Record<CasualtyKind, number>>;
  lossIdr: number | null;
  lossUnknown?: boolean;
  reason: string;
}

/** Perubahan level yang menunggu Pejabat (turun) atau yang bisa dikembalikan Pejabat (naik). */
export interface LevelChange {
  dir: 'up' | 'down';
  from: Severity;
  to: Severity;
  at: string;
  by: string;
  /** tenggat sebelum kenaikan (untuk Kembalikan) */
  dueBefore?: string;
}

const find = (s: Slice, no: string) => s.incidents.find((i) => i.no === no);
const put = (s: Slice, i: Incident): Slice => ({ ...s, incidents: s.incidents.map((x) => (x.no === i.no ? i : x)) });

const OPS_LBL: Record<OpsImpact, string> = { tidak: 'Tidak terganggu', sebagian: 'Terganggu sebagian', berhenti: 'Berhenti' };
export const opsLine = (d: Pick<IncidentDetail, 'ops' | 'opsHours' | 'opsUnknown'>) =>
  d.opsUnknown ? 'Belum diketahui' : d.ops ? `${OPS_LBL[d.ops]}${d.ops !== 'tidak' && d.opsHours ? ` ${d.opsHours} jam` : ''}` : '—';
export const lossLine = (d: Pick<IncidentDetail, 'lossIdr' | 'lossUnknown'>) => (d.lossUnknown ? 'Belum diketahui' : d.lossIdr ? formatRupiah(d.lossIdr) : '—');
const casLine = (c: Partial<Record<CasualtyKind, number>>) => {
  const e = Object.entries(c) as [CasualtyKind, number][];
  if (!e.length) return 'Tidak ada';
  return e.map(([k, n]) => (k === 'belum' ? 'Belum diketahui' : `${n} ${k === 'p3k' ? 'luka ringan' : k === 'klinik' ? 'dirawat' : k === 'berat' ? 'luka berat' : 'meninggal'}`)).join(', ');
};

/** Saran level dari dampak baru (matriks tersimpan di konfigurasi; kurs tunggal demo). */
export function suggestFrom(p: ImpactPatch, s: Slice, axes: IncidentDetail['axes'] = []): Severity | null {
  return suggestSeverity(
    {
      ops: p.opsUnknown ? null : p.ops, casualties: p.casualties, lossIdr: p.lossUnknown ? 0 : (p.lossIdr ?? 0),
      environment: axes.includes('ling'), data: axes.includes('data'), kursIdrPerUsd: s.config.kursIdrPerUsd,
    },
    s.config.lossThresholdsUsd,
  );
}

/** Pratinjau akibat pembaruan (dipakai dialog PD1 sebelum disimpan). */
export function previewImpact(i: Incident, p: ImpactPatch, s: Slice, byPejabat: boolean): { to: Severity | null; dir: 'up' | 'down' | 'same'; applies: boolean } {
  const to = suggestFrom(p, s, i.detail?.axes);
  const from = i.severity;
  if (!to || !from || to === from) return { to, dir: 'same', applies: false };
  const dir = sevRank(to) > sevRank(from) ? 'up' : 'down';
  return { to, dir, applies: byPejabat || dir === 'up' };
}

export function updateImpact(s: Slice, no: string, by: string, p: ImpactPatch, byPejabat: boolean): DecisionResult & { level?: 'up' | 'down' | 'same' } {
  const i = find(s, no);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  if (i.status !== 'dalam-penanganan') return { ok: false, reason: 'Dampak hanya bisa diperbarui selama Dalam penanganan. Setelah ditutup, pakai Koreksi data.' };
  if (p.reason.trim().length < MIN_IMPACT_REASON) return { ok: false, reason: `Tulis alasan atau sumber info, minimal ${MIN_IMPACT_REASON} karakter.` };
  const d = i.detail!;
  const changes: string[] = [];
  const before = { ops: opsLine(d), cas: casLine(d.casualties), loss: lossLine(d) };
  const after = { ops: opsLine(p), cas: casLine(p.casualties), loss: lossLine(p) };
  if (before.ops !== after.ops) changes.push(`Kondisi operasi: ${before.ops} → ${after.ops}`);
  if (before.cas !== after.cas) changes.push(`Korban: ${before.cas} → ${after.cas}`);
  if (before.loss !== after.loss) changes.push(`Perkiraan kerugian: ${before.loss} → ${after.loss}`);
  if (!changes.length) return { ok: false, reason: 'Belum ada dampak yang berubah.' };
  const now = demoNow();
  const pv = previewImpact(i, p, s, byPejabat);
  const detail: IncidentDetail = {
    ...d, ops: p.opsUnknown ? null : p.ops, opsHours: p.opsHours, ongoing: p.ongoing, opsUnknown: !!p.opsUnknown,
    casualties: p.casualties, lossIdr: p.lossUnknown ? null : p.lossIdr, lossUnknown: !!p.lossUnknown, suggestedSeverity: pv.to,
    axes: Object.keys(p.casualties).length && !d.axes.includes('man') ? [...d.axes, 'man'] : d.axes,
  };
  const text = [`Memperbarui dampak. ${changes.join('; ')}. Alasan: ${p.reason.trim()}`];
  let next: Incident = { ...i, detail, impactProvisional: true };
  if (pv.to && i.severity && pv.dir !== 'same') {
    if (pv.applies) {
      const days = s.config.deadlines[pv.to];
      const fromRise = `${addWorkingDays(now, days).slice(0, 10)}T${now.slice(11, 19)}`;
      // ADJ-07 butir 4: tenggat tidak boleh lebih lama dari tenggat sebelumnya
      const due = pv.dir === 'up' && i.handleDueAt && i.handleDueAt < fromRise ? i.handleDueAt : pv.dir === 'up' ? fromRise : i.handleDueAt;
      next = {
        ...next, severity: pv.to, handleDueAt: due, skkNotified: i.skkNotified || isHighOrCritical(pv.to),
        levelChange: !byPejabat ? { dir: 'up', from: i.severity, to: pv.to, at: now, by, dueBefore: i.handleDueAt } : undefined,
      };
      text.push(`Keparahan: ${SEV_LABEL[i.severity]} → ${SEV_LABEL[pv.to]}${byPejabat ? ' (diperbarui Pejabat Berwenang, tanpa konfirmasi)' : ''}.${isHighOrCritical(pv.to) && !isHighOrCritical(i.severity) ? ' SKK Migas diberi tahu.' : ''}`);
    } else {
      next = { ...next, levelChange: { dir: 'down', from: i.severity, to: pv.to, at: now, by } };
      text.push(`Saran keparahan turun ke ${SEV_LABEL[pv.to]}; ${SEV_LABEL[i.severity]} tetap berlaku sampai Pejabat Berwenang mengonfirmasi.`);
    }
  }
  next = { ...next, timeline: [...(i.timeline ?? []), ...text.map((t) => ({ at: now, by, text: t }))] };
  return { ok: true, state: put(s, next), level: pv.dir };
}

/**
 * Pejabat Berwenang memutus perubahan level (PD2): turun → Turunkan (terima) / Tetap; naik → Biarkan / Kembalikan ke level
 * sebelumnya (alasan wajib, SKK diberi tahu koreksinya).
 */
export function resolveLevelChange(s: Slice, no: string, by: string, accept: boolean, reason = ''): DecisionResult {
  const i = find(s, no);
  const lc = i?.levelChange;
  if (!i || !lc) return { ok: false, reason: 'Tidak ada perubahan level yang menunggu.' };
  const now = demoNow();
  if (lc.dir === 'up' && !accept && !reason.trim()) return { ok: false, reason: 'Tulis alasan mengembalikan level.' };
  let next: Incident = { ...i, levelChange: undefined };
  let text: string;
  if (lc.dir === 'down') {
    next = accept ? { ...next, severity: lc.to } : next;
    text = accept ? `Mengonfirmasi penurunan level: ${SEV_LABEL[lc.from]} → ${SEV_LABEL[lc.to]}.` : `Level tetap ${SEV_LABEL[lc.from]} (penurunan tidak dikonfirmasi).`;
  } else {
    next = accept ? next : { ...next, severity: lc.from, handleDueAt: lc.dueBefore ?? i.handleDueAt };
    text = accept ? `Membiarkan kenaikan level ke ${SEV_LABEL[lc.to]}.` : `Mengembalikan level ke ${SEV_LABEL[lc.from]}. Alasan: ${reason.trim()}. SKK Migas diberi tahu koreksinya.`;
  }
  return { ok: true, state: put(s, { ...next, timeline: [...(i.timeline ?? []), { at: now, by, text }] }) };
}

/** Koreksi data setelah ditutup (PD3, ADJ-07 butir 8): status tetap Ditutup; Riwayat mencatat sebelum → sesudah. */
export function correctClosedData(s: Slice, no: string, by: string, lossFinalIdr: number, reason: string): DecisionResult {
  const i = find(s, no);
  if (!i) return { ok: false, reason: 'Insiden tidak ditemukan.' };
  if (i.status !== 'ditutup') return { ok: false, reason: 'Koreksi data hanya untuk insiden yang sudah ditutup.' };
  if (reason.trim().length < MIN_IMPACT_REASON) return { ok: false, reason: `Tulis alasan koreksi, minimal ${MIN_IMPACT_REASON} karakter.` };
  const c = i.handling?.closure;
  const prev = c?.lossFinalIdr ?? null;
  if (prev === lossFinalIdr) return { ok: false, reason: 'Nilai baru sama dengan nilai sebelumnya.' };
  const handling = { ...i.handling!, closure: { ...c!, lossFinalIdr } };
  const text = `Koreksi data: Kerugian final ${prev != null ? formatRupiah(prev) : '—'} → ${formatRupiah(lossFinalIdr)}. Alasan: ${reason.trim()}${isHighOrCritical(i.severity) ? ' SKK Migas diberi tahu.' : ''}`;
  return { ok: true, state: put(s, { ...i, handling, timeline: [...(i.timeline ?? []), { at: demoNow(), by, text }] }) };
}
