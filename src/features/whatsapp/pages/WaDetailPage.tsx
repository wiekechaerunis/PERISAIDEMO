// Board: I23 (Detail insiden dari WhatsApp). Varian I23 sudah ada di IncidentDetailPage (source 'wa'); rute ini hanya mengarahkannya.
import { Navigate, useParams } from 'react-router-dom';
import { IncidentDetailPage } from '@/features/insiden/pages/IncidentDetailPage';
import { useDemoStore } from '@/services/mock/store';

/** `/insiden/wa/:no`: detail WA untuk insiden `source: 'wa'` sebelum berjalan. Selain itu diserahkan ke pengarah `/insiden/:no` (peran Pejabat, PIC, SKK). */
export function WaDetailPage() {
  const { no = '' } = useParams();
  const role = useDemoStore((s) => s.role);
  const inc = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const running = inc?.status === 'dalam-penanganan' || inc?.status === 'minta-ditutup' || inc?.status === 'ditutup';
  if (inc?.source === 'wa' && !running && role !== 'pejabat') return <IncidentDetailPage />;
  return <Navigate to={`/insiden/${no}`} replace />;
}
