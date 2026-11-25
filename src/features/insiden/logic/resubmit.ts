// Ajukan ulang laporan Perlu perbaikan (ADJ-11, board PB2, PB3). Cek laporan ganda dijalankan lagi HANYA bila lokasi, waktu kejadian,
// atau kategori berubah dari versi yang terakhir diajukan; kecocokan yang sudah diputus pelapor (ditandai) tidak ditanyakan lagi.
import type { Incident } from '@/services/types';
import type { ReportDraft } from './draft';
import { occurredIso } from './submit';

export type ResubmitField = 'lokasi' | 'waktu kejadian' | 'kategori';

/** Field yang berubah dibanding insiden yang terakhir diajukan. */
export function changedFields(prev: Incident, d: ReportDraft): ResubmitField[] {
  const out: ResubmitField[] = [];
  const pd = prev.detail;
  if ((d.lat !== null && pd?.lat !== d.lat) || (d.lng !== null && pd?.lng !== d.lng) || (d.locationName && (pd?.locationName ?? prev.location) !== d.locationName)) out.push('lokasi');
  if (occurredIso(d) !== prev.occurredAt) out.push('waktu kejadian');
  if ((d.category ?? '') !== prev.category) out.push('kategori');
  return out;
}

const H48 = 48 * 3_600_000;
const t = (iso: string) => new Date(iso + 'Z').getTime();

/**
 * Laporan lain yang mirip (kategori sama, WK sama, waktu kejadian ±48 jam), tanpa yang sudah diputus pelapor (`decided`).
 * Hanya dipanggil bila `changedFields` tidak kosong.
 */
export function similarOnResubmit(no: string, d: ReportDraft, all: Incident[], decided: string[] = []): Incident[] {
  const at = t(occurredIso(d));
  return all.filter(
    (x) =>
      x.no !== no && !decided.includes(x.no) && x.status !== 'draf' && x.status !== 'dibatalkan' && x.status !== 'digabung' &&
      x.category === d.category && x.wk === d.wk && Math.abs(t(x.occurredAt) - at) <= H48,
  );
}
