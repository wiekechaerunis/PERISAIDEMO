// Periode Dashboard insiden (tombol Periode di AppBar). Pilihan sama dengan filter Periode kejadian di daftar Insiden.
// "Hari ini" dashboard = 30 Jun 2026, akhir data demo dashboard (Jan–Jun 2026), bukan jam demo aplikasi (28 Okt 2026):
// dengan jam demo, 7 hari / 30 hari / Bulan ini / 3 bulan terakhir tidak akan berisi data sama sekali. Lihat DEVIATIONS D-D1.
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { choiceLabel, parsePeriod, periodLabel, rangeCaption, rangeOf, withPeriod, type Period } from '@/features/insiden/logic/period';

/** Tanggal acuan "hari ini" untuk preset dashboard. */
export const DASH_NOW = '2026-06-30T23:59:00';
export const DASH_TODAY = DASH_NOW.slice(0, 10);
/** Rentang data demo dashboard. */
export const DATA_FROM = '2026-01-01';
export const DATA_TO = '2026-06-30';
export const DATA_CAPTION = '1 Jan – 30 Jun 2026';

/** Periode yang dioper ke logika dashboard (props.periode). */
export interface DashPeriodInfo {
  from: string;
  to: string;
  /** true bila rentang mencakup seluruh data demo: angka dashboard sama persis dengan versi semester */
  full: boolean;
  /** "30 hari terakhir" atau "1–15 Mei 2026" */
  label: string;
  /** "31 Mei – 30 Jun 2026" */
  cap: string;
  /** teks untuk subjudul dan keterangan, mis. "30 hari terakhir (31 Mei – 30 Jun 2026)" */
  text: string;
}

export function dashPeriodInfo(p: Period): DashPeriodInfo {
  const r = rangeOf(p, DASH_NOW);
  const from = r?.from ?? DATA_FROM;
  const to = r?.to ?? DATA_TO;
  const full = from <= DATA_FROM && to >= DATA_TO;
  const label = p.kind === 'custom' ? periodLabel(p) : choiceLabel(p.preset);
  const cap = r ? rangeCaption(r) : DATA_CAPTION;
  // Semua waktu = seluruh data demo = Semester I 2026 (teks dashboard tetap seperti sebelumnya); rentang khusus labelnya sudah tanggal
  const text = p.kind === 'custom' ? label : p.preset === 'all' ? 'Semester I 2026' : `${label} (${cap})`;
  return { from, to, full, label, cap, text };
}

/** Periode dashboard di URL (`?periode=` atau `?dari=&sampai=`), sama formatnya dengan daftar Insiden. */
export function useDashPeriod() {
  const [params, setParams] = useSearchParams();
  const period = parsePeriod(params, DASH_TODAY);
  const setPeriod = useCallback((p: Period) => setParams((cur) => withPeriod(cur, p), { replace: false }), [setParams]);
  return { period, setPeriod, info: dashPeriodInfo(period) };
}
