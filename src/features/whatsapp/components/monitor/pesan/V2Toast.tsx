// Toast papan (`pr-toasts` > `v2-toast`): hilang sendiri setelah 4 detik.
import { useEffect } from 'react';
import { Ic } from '../nomor/icons';

export interface PesanToast { text: string; err?: boolean }

export function V2Toast({ toast, onClose }: { toast: PesanToast | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  return (
    <div className="pr-toasts" role={toast?.err ? 'alert' : 'status'} aria-live="polite">
      {toast && (
        <div className={'v2-toast' + (toast.err ? ' v2-toast--err' : '')}>
          <Ic d={toast.err ? 'M18 6 6 18M6 6l12 12' : 'M20 6 9 17l-5-5'} size={16} />
          {toast.text}
        </div>
      )}
    </div>
  );
}
