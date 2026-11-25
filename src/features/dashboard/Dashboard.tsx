import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard, type DashboardProps } from './useDashboard';
import { DashboardView } from './DashboardView';
import { TipLayer } from './TipLayer';

export type { DashboardProps };

/**
 * Dashboard insiden. Logika di useDashboard; tampilan per bagian (S1-S17) di ./components.
 * Iterasi 2: state tampilan peta (panel ringkasan terbuka, lebar peta) ikut ke rumus zoom.
 */
export function Dashboard(props: DashboardProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapW, setMapW] = useState(1078);
  const v = useDashboard({ ...props, panelOpen, mapW });
  // Iterasi 3: di tingkat nasional panel ringkasan tersembunyi (bidang wilayah + chip sudah membawa informasinya);
  // panel muncul otomatis saat zoom ke wilayah atau WK. Tombol "Ringkasan" tetap bisa membukanya.
  const [lastLvl, setLastLvl] = useState<string | null>(null);
  if (v.lvl !== lastLvl) {
    setLastLvl(v.lvl);
    setPanelOpen(v.lvl !== 'nat');
  }
  const navigate = useNavigate();
  const ui = {
    panelOpen,
    setPanelOpen,
    mapW,
    setMapW: (w: number) => setMapW((o) => (Math.abs(o - w) > 1 ? w : o)),
    /** E1/E4: klik kartu angka atau bar tren membuka Daftar insiden dengan filter */
    go: (to: string) => navigate(to),
  };
  return (
    <>
      <DashboardView v={{ ...v, ui }} />
      <TipLayer />
    </>
  );
}
