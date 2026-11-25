// Menu ⋯ per baris daftar (B-15; board Main-Aksi*, V11-Aksi*, P11-AksiAmbil). Baris tanpa aksi tidak punya tombol.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { RowMenuItem } from '../../logic/list';

export function RowMenu({ no, items, onAction }: { no: string; items: RowMenuItem[]; onAction: (it: RowMenuItem) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div className="in-menuwrap" ref={ref} style={{ display: 'inline-block' }}>
      <button
        type="button" className="p-ibtn ghost" style={{ width: 32, height: 32 }} aria-label={`Aksi untuk ${no}`}
        aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
      >
        <Icon name="more" size={16} />
      </button>
      {open && (
        <div className="in-menu ls-rm" role="menu" aria-label={`Aksi untuk ${no}`}>
          {items.map((it) =>
            it.to ? (
              <Link key={it.label} to={it.to} role="menuitem" className={it.danger ? 'dz' : undefined} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ) : (
              <button key={it.label} type="button" role="menuitem" className={it.danger ? 'dz' : undefined} onClick={() => { setOpen(false); onAction(it); }}>
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
