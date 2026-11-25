// Membuka draf (atau laporan Perlu perbaikan) di form langkah 1 mode "Ubah insiden" (PA-03, board I12s). Rute: /insiden/:no/ubah.
// Hanya role aktif maker (ADJ-18); pengguna lain diarahkan ke detail baca saja.
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { isMaker } from '@/lib/rbac';
import { useDraftStore } from '../logic/draft';
import { draftFromIncident } from '../components/detail/detailLogic';
import { useCopilotStore } from '../copilot/copilotStore';
import { STEP_ROUTES } from '../logic/steps';

export function DraftEditRoute() {
  const { no = '' } = useParams();
  const navigate = useNavigate();
  const role = useDemoStore((s) => s.role);
  const inc = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const editable = !!inc && isMaker(role) && (inc.status === 'draf' || inc.status === 'perlu-perbaikan');
  useEffect(() => {
    if (!editable || !inc) return;
    useDraftStore.setState({ draft: draftFromIncident(inc) });
    useCopilotStore.getState().reset(false);
    navigate(STEP_ROUTES.temuan, { replace: true });
  }, [editable, inc, navigate]);
  if (!editable) return <Navigate to={`/insiden/${no}`} replace />;
  return null;
}
