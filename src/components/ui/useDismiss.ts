import { useEffect, type RefObject } from 'react';

/** Tutup popover saat klik di luar atau tekan Escape (B10): hanya satu popover terbuka pada satu waktu. */
export function useDismiss(open: boolean, ref: RefObject<HTMLElement>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
