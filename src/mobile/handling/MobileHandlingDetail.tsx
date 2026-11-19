// Detail insiden berjalan di mobile (board MP2..MP6). Memilih tampilan dari peran + status:
// PIC → MP2 (detail) / MP3 (`?langkah=penutupan`); Pejabat → MP5/MP6 (sheet Tutup, Ubah tenggat, dst.); SKK → baca-saja + Beri arahan.
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { isSkk, type Role } from '@/lib/rbac';
import type { Incident } from '@/services/types';
import { accessOf } from '@/features/insiden/components/detail/detailLogic';
import { isPicOf } from '@/features/insiden/logic/handling';
import { MobileShell } from '../ui/MobileShell';
import { PicDetail } from './PicDetail';
import { PicWork } from './PicWork';
import { PejabatView } from './PejabatView';
import { SkkView } from './SkkView';

export type HandlingView = 'pic-work' | 'pic' | 'pejabat' | 'skk' | null;

const running = (i: Incident) => i.status === 'dalam-penanganan' || i.status === 'minta-ditutup' || i.status === 'ditutup';

/** Tampilan mobile penanganan yang berlaku untuk peran + insiden ini, atau null bila bukan domain ini (dispatcher memakai tampilan lain). */
export function handlingViewOf(i: Incident | undefined, role: Role, langkah?: string | null): HandlingView {
  if (!i || accessOf(i, role) === 'terbatas' || !running(i)) return null;
  if (isPicOf(i, role)) return langkah === 'penutupan' ? 'pic-work' : 'pic';
  if (role === 'pejabat') return 'pejabat';
  if (isSkk(role)) return 'skk';
  return null;
}

export function MobileHandlingDetail() {
  const { no = '' } = useParams();
  const [params] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const view = handlingViewOf(incident, role, params.get('langkah'));
  if (!incident || !view) {
    return (
      <MobileShell title="Insiden" backTo="/insiden">
        <div className="in-status">
          <h2>Anda tidak punya akses ke insiden ini.</h2>
          <p>Insiden ini terbatas atau di luar cakupan Anda. Hubungi Pejabat Berwenang bila perlu melihatnya.</p>
          <Link to="/insiden" className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>Kembali ke daftar</Link>
        </div>
      </MobileShell>
    );
  }
  if (view === 'pic-work') return <PicWork key={incident.no} i={incident} />;
  if (view === 'pic') return <PicDetail key={incident.no} i={incident} />;
  if (view === 'pejabat') return <PejabatView key={incident.no} i={incident} />;
  return <SkkView key={incident.no} i={incident} />;
}
