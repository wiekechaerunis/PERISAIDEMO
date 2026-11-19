import { useState } from 'react';
import { Ic } from './Ic';

/** Ikon info + tooltip (anatomi `in-tw`/`in-tip` board). `open` awal = tooltip terbuka seperti di board; klik ikon untuk membuka/menutup. */
export function InfoTip({ label, text, right, defaultOpen = false }: { label: string; text: string; right?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <span className={open ? 'in-tw open' : 'in-tw'}>
      <button type="button" className="ib" aria-label={`Penjelasan ${label}`} onClick={() => setOpen((v) => !v)}>
        <Ic d="info" size={14} />
      </button>
      <span className={right ? 'in-tip r' : 'in-tip'} role="tooltip">{text}</span>
    </span>
  );
}
