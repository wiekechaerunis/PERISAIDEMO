import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { MobileHandlingDetail, handlingViewOf } from '../handling/MobileHandlingDetail';
import { MobileIncidentDetail } from '../formB/MobileIncidentDetail';

/** Pengarah `/insiden/:no` di mobile: penanganan (PIC/Pejabat/SKK pada insiden berjalan), review Pejabat, atau detail biasa. */
function MobileIncidentRoute() {
  const { no } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  if (role === 'pejabat' && incident?.status === 'review-internal') {
    return <Navigate to={`/insiden/${no}/review`} replace state={location.state} />;
  }
  return handlingViewOf(incident, role, params.get('langkah')) ? <MobileHandlingDetail /> : <MobileIncidentDetail />;
}

export const MOBILE_INCIDENT: Record<string, ComponentType> = { '/insiden/:no': MobileIncidentRoute };
