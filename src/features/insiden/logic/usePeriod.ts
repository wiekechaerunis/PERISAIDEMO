import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { demoNow } from '@/services/mock/clock';
import { parsePeriod, withPeriod, type Period } from './period';

/**
 * Periode yang diterapkan, disimpan di URL (`?periode=` atau `?dari=&sampai=`), jadi bertahan saat reload dan Back.
 * Menerapkan periode menambah entri riwayat (push), sehingga Back kembali ke periode sebelumnya.
 */
export function usePeriod(): { period: Period; today: string; now: string; setPeriod: (p: Period) => void } {
  const [params, setParams] = useSearchParams();
  const now = demoNow();
  const today = now.slice(0, 10);
  const period = parsePeriod(params, today);
  const setPeriod = useCallback((p: Period) => setParams((cur) => withPeriod(cur, p)), [setParams]);
  return { period, today, now, setPeriod };
}
