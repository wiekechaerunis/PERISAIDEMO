// Board: M1, M12, MP1, MV1, MK1, MS08–MS12 — daftar insiden mobile; varian menurut peran, ?tab=kerawanan, ?state=...
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { canCreateReport, isSkk } from '@/lib/rbac';
import { visibleIncidents } from '@/features/insiden/logic/list';
import { EmptyScreen, FailedScreen, FilterEmptyScreen, LimitedScreen, LoadingScreen } from './parts';
import { PelaporList } from './PelaporList';
import { PicList } from './PicList';
import { VerifierList } from './VerifierList';
import { SkkList } from './SkkList';
import { KerawananList } from './KerawananList';

type ListState = 'memuat' | 'kosong' | 'filter-kosong' | 'gagal' | 'terbatas';
const STATES: ListState[] = ['memuat', 'kosong', 'filter-kosong', 'gagal', 'terbatas'];

export function MobileIncidentListPage() {
  const [params, setParams] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const incidents = useDemoStore((s) => s.incidents);
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const base = useMemo(() => visibleIncidents(incidents, role), [incidents, role]);
  const state = STATES.find((s) => s === params.get('state')) ?? null;
  const clear = () => setParams({}, { replace: true });
  const canCreate = canCreateReport(role);

  if (state === 'memuat') return <LoadingScreen />;
  if (state === 'kosong') return <EmptyScreen canCreate={canCreate} />;
  if (state === 'gagal') return <FailedScreen onRetry={clear} />;
  if (state === 'terbatas') return <LimitedScreen />;
  // MS10: contoh Keparahan Kritis + Status Ditutup
  if (state === 'filter-kosong') {
    return <FilterEmptyScreen n={2} count={`0 dari ${base.length}`} desc="Filter aktif: Keparahan Kritis, Status Ditutup." onClear={clear} fab={canCreate} />;
  }

  if (params.get('tab') === 'kerawanan') return <KerawananList items={kerawanan} insCount={base.length} canCreate={canCreate} />;
  if (base.length === 0) return <EmptyScreen canCreate={canCreate} />;

  const p = { base, role, krwCount: kerawanan.length };
  if (isSkk(role)) return <SkkList {...p} />;
  if (role === 'pejabat') return <VerifierList {...p} />;
  if (role === 'pic' || role === 'pic-tl') return <PicList {...p} />;
  return <PelaporList {...p} />;
}
