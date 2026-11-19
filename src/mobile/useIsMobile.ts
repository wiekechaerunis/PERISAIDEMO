import { useSyncExternalStore } from 'react';

/** Tampilan mobile (board M*, MV*, MP*, MA*, MK*, MS*): lebar viewport ≤ 480. `?m=1` memaksa mobile di desktop (demo/Playwright). */
export const MOBILE_QUERY = '(max-width: 480px)';

let forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('m') === '1';
const listeners = new Set<() => void>();

/** Paksa mode mobile (dipakai tes dan tombol demo). */
export function setForceMobile(v: boolean) {
  forced = v;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(MOBILE_QUERY) : null;
  mq?.addEventListener?.('change', cb);
  return () => {
    listeners.delete(cb);
    mq?.removeEventListener?.('change', cb);
  };
}
const snapshot = () => forced || (typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches);

export const useIsMobile = () => useSyncExternalStore(subscribe, snapshot, () => false);
