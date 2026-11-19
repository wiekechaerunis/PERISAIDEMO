// "Diperiksa oleh" (pola WFL-01 FR-WF-37, sama dengan WP&B): pilih-banyak, bawaan semua Pejabat Berwenang terpilih, minimal satu.
// Komponen murni: daftar nama dan teks datang dari pemakai. Yang memutus lebih dulu menyelesaikan tugas; yang lain tidak bisa melanjutkan.
import { useRef, useState } from 'react';
import { useDismiss } from './useDismiss';
import { Icon } from './Icon';

interface Props {
  options: string[];
  /** null = semua terpilih (bawaan) */
  value: string[] | null;
  onChange: (v: string[] | null) => void;
  label?: string;
  id?: string;
}

export const REVIEWER_HELP = 'Bawaan semua terpilih, minimal satu. Yang memutus lebih dulu menyelesaikan tugas; yang lain tidak bisa melanjutkan.';

export function ReviewerSelect({ options, value, onChange, label = 'Diperiksa oleh', id = 'diperiksa-oleh' }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const picked = value ? options.filter((o) => value.includes(o)) : options;
  const all = picked.length === options.length;
  useDismiss(open, box, () => setOpen(false));

  const toggle = (name: string) => {
    const on = picked.includes(name);
    if (on && picked.length === 1) return; // minimal satu
    const next = on ? picked.filter((p) => p !== name) : options.filter((o) => picked.includes(o) || o === name);
    onChange(next.length === options.length ? null : next);
  };
  const text = all ? `Semua Pejabat Berwenang (${options.length})` : picked.join(', ');

  return (
    <div className="p-field in-cbx" ref={box}>
      <span className="p-lbl" id={`${id}-l`} style={{ color: 'var(--ink)' }}>{label}<span className="p-req">*</span></span>
      <button
        type="button" className="p-input" id={id} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l ${id}`}
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', minHeight: 36 }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
        <Icon name="chevDown" size={16} />
      </button>
      <span className="p-help">{REVIEWER_HELP}</span>
      {open && (
        <div className="in-pop" role="listbox" aria-label={label} aria-multiselectable="true" style={{ top: 70 }}>
          {options.map((o) => {
            const on = picked.includes(o);
            return (
              <button
                key={o} type="button" role="option" aria-selected={on} className={on ? 'op on' : 'op'} style={{ minHeight: 44 }}
                onClick={() => toggle(o)}
              >
                <span className="t"><b>{o}</b></span>
                {on && <Icon name="check" size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
