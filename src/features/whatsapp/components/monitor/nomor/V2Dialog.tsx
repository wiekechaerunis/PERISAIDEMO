// Dialog `pr-dialog` (papan V2-23, 23b, 23c, 24): elemen <dialog> asli, modal bila peramban mendukung.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Ic, P } from './icons';

export interface V2DialogProps {
  title: string;
  subtitle?: ReactNode;
  size?: 'md' | 'lg';
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  /** catatan di kiri footer (`pr-dialog__note`) */
  note?: ReactNode;
  labelId?: string;
}

export function V2Dialog({ title, subtitle, size = 'md', onClose, children, footer, note, labelId }: V2DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const auto = useId();
  const id = labelId ?? auto;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showModal === 'function') { if (!el.open) el.showModal(); return; }
    el.setAttribute('open', '');
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <dialog ref={ref} aria-labelledby={id} className={`pr-dialog pr-dialog--${size}`} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="pr-dialog__frame">
        <header className="pr-dialog__head">
          <div className="min-w-0"><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button type="button" className="pr-close" aria-label="Tutup dialog" onClick={onClose}><Ic d={P.close} /></button>
        </header>
        <div className="pr-dialog__body">{children}</div>
        <footer className="pr-dialog__foot">{note && <div className="pr-dialog__note">{note}</div>}{footer}</footer>
      </div>
    </dialog>
  );
}
