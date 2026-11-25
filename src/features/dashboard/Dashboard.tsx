import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { useDashboard, type DashboardProps } from './useDashboard';
import { DashboardView } from './DashboardView';
import { TipLayer } from './TipLayer';
import { incidentFromDashboard, type IncInfo } from './openIncident';
import { useDashPeriod } from './dashPeriod';

export type { DashboardProps };

/**
 * Dashboard insiden. Logika di useDashboard; tampilan per bagian (S1-S17) di ./components.
 * Iterasi 2: state tampilan peta (panel ringkasan terbuka, lebar peta) ikut ke rumus zoom.
 */
export function Dashboard(props: DashboardProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapW, setMapW] = useState(1078);
  // Periode dari tombol Periode (URL); rentang penuh Jan–Jun 2026 = angka semester apa adanya
  const { info: periode } = useDashPeriod();
  const v = useDashboard({ ...props, panelOpen, mapW, periode });
  // Iterasi 3: di tingkat nasional panel ringkasan tersembunyi (bidang wilayah + chip sudah membawa informasinya);
  // panel muncul otomatis saat zoom ke wilayah atau WK. Tombol "Ringkasan" tetap bisa membukanya.
  const [lastLvl, setLastLvl] = useState<string | null>(null);
  if (v.lvl !== lastLvl) {
    setLastLvl(v.lvl);
    setPanelOpen(v.lvl !== 'nat');
  }
  const navigate = useNavigate();

  // Klik titik insiden atau baris insiden di panel: buka halaman Detail insiden aplikasi.
  // Insiden yang belum ada di data aplikasi dibuat dulu dari data dashboard (lihat openIncident.ts).
  const addIncident = useDemoStore((s) => s.addIncident);
  const openInc = (info: IncInfo) => {
    if (!info.id) return;
    const all = useDemoStore.getState().incidents;
    if (!all.some((i) => i.no === info.id)) {
      const inc = incidentFromDashboard({ ...info, id: info.id }, all);
      if (inc) addIncident(inc);
    }
    navigate(`/insiden/${info.id}`);
  };

  const ui = {
    panelOpen,
    setPanelOpen,
    mapW,
    setMapW: (w: number) => setMapW((o) => (Math.abs(o - w) > 1 ? w : o)),
    /** E1/E4: klik kartu angka atau bar tren membuka Daftar insiden dengan filter */
    go: (to: string) => navigate(to),
    openInc,
  };
  return (
    <>
      <DashboardView v={{ ...v, ui }} />
      <TipLayer />
    </>
  );
}
