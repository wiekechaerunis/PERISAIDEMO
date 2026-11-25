import { useDC } from '@/dc/runtime';
import { DashboardLogic } from '@/generated/DashboardLogic';
import type { DashPeriodInfo } from './dashPeriod';

export interface DashboardProps {
  peran?: 'skk' | 'kkks';
  zoom?: 'nat' | 'sbs' | 'sbu' | 'pst' | 'jbn' | 'loc';
  dtt?: boolean;
  menuUnduh?: boolean;
  statusTerbuka?: string;
  /** Iterasi 2: panel ringkasan terbuka (rumus zoom memakai lebar peta - 376px) */
  panelOpen?: boolean;
  /** Iterasi 2: lebar kotak peta dalam px */
  mapW?: number;
  /** Periode terpilih (tombol Periode). Tanpa nilai atau `full` = seluruh data Jan–Jun 2026 */
  periode?: DashPeriodInfo;
}

/**
 * Logika Dashboard insiden: state, filter, zoom peta, dan semua rumus (alloc() largest remainder, KPI, tren, matriks).
 * Dibawa apa adanya dari renderVals() di design/Dashboard.dc.html lewat src/generated/DashboardLogic.ts;
 * data demo ada di src/data/dashboard.ts. Mengembalikan objek `v` yang dipakai semua komponen bagian.
 */
export function useDashboard(props: DashboardProps) {
  return useDC(DashboardLogic, props);
}
