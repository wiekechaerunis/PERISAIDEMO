// Board mobile: M11 (Detail insiden dari WhatsApp). Varian WA sudah ada di MobileIncidentDetail (source 'wa'); ini hanya pembungkus untuk rute `/insiden/wa/:no`.
import { Navigate, useParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { MobileIncidentDetail } from '../formB/MobileIncidentDetail';

export function MobileWaDetail() {
  const { no = '' } = useParams();
  const role = useDemoStore((s) => s.role);
  const inc = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const running = inc?.status === 'dalam-penanganan' || inc?.status === 'minta-ditutup' || inc?.status === 'ditutup';
  if (inc?.source === 'wa' && !running && role !== 'pejabat') return <MobileIncidentDetail />;
  return <Navigate to={`/insiden/${no}`} replace />;
}
