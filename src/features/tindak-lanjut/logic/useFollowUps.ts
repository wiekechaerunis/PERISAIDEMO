import { useMemo } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { taskCount } from '@/features/insiden/logic/list';
import { EMPTY_FU } from './followups';

/**
 * Slice tindak lanjut dari store; aman bila state lama belum memilikinya.
 * Tindak lanjut sebuah insiden baru ada setelah insiden disetujui (B11): selama Menunggu pemeriksaan, tidak ditampilkan.
 */
export const useFollowUps = () => {
  const all = useDemoStore((s) => s.followUps ?? EMPTY_FU);
  const incidents = useDemoStore((s) => s.incidents);
  return useMemo(() => {
    const pending = new Set(incidents.filter((i) => i.status === 'review-internal').map((i) => i.no));
    return all.some((f) => pending.has(f.incidentNo)) ? all.filter((f) => !pending.has(f.incidentNo)) : all;
  }, [all, incidents]);
};

/** Hitungan "Tugas saya" (sidebar dan lonceng) termasuk tugas tindak lanjut. */
export function useTaskCount(): number {
  const role = useDemoStore((s) => s.role);
  const incidents = useDemoStore((s) => s.incidents);
  const fus = useFollowUps();
  return taskCount(incidents, role, fus);
}
