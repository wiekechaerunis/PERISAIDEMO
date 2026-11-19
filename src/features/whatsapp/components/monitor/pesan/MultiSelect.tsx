// Combobox pilih banyak di popover Filter (papan V2-06 tertutup, V2-06b terbuka dengan daftar dan pencarian).
import { useId, useState } from 'react';
import { Ic, P } from '../nomor/icons';

export interface Opt { value: string; label: string; sub?: string }

const PHONE = 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2';

export function MultiSelect({ label, options, value, onChange, placeholder, noun, subIcon }: {
  label: string; options: Opt[]; value: string[]; onChange: (v: string[]) => void; placeholder: string; noun: string; subIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const id = useId();
  const shown = options.filter((o) => `${o.label} ${o.sub ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const close = () => { setOpen(false); setQ(''); };
  const chev = (
    <span style={{ marginLeft: 'auto', display: 'inline-flex', transform: open ? 'rotate(180deg)' : undefined }}><Ic d="m6 9 6 6 6-6" /></span>
  );
  const tags = value.map((v) => (
    <span className="pr-tag" key={v}>
      {options.find((o) => o.value === v)?.label ?? v}{' '}
      <button type="button" aria-label={`Hapus ${options.find((o) => o.value === v)?.label ?? v}`} onClick={(e) => { e.stopPropagation(); toggle(v); }} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex' }}>
        <Ic d={P.close} size={12} />
      </button>
    </span>
  ));

  if (!open) {
    return (
      <div
        className="pr-input v2-ms" role="combobox" aria-label={label} aria-expanded="false" aria-controls={id} tabIndex={0}
        onClick={() => setOpen(true)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && (e.preventDefault(), setOpen(true))}
      >
        {value.length ? tags : <span className="v2-ph">{placeholder}</span>}
        {chev}
      </div>
    );
  }
  return (
    <div className="v2-cbw">
      <div className="pr-input v2-ms v2-focus" role="combobox" aria-expanded="true" aria-label={label} aria-controls={id}>
        {tags}
        <input className="v2-cbin" value={q} autoFocus aria-label={`Cari ${label.toLowerCase()}`} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), close())} />
        <button type="button" aria-label="Tutup daftar" onClick={close} style={{ all: 'unset', marginLeft: 'auto', cursor: 'pointer', display: 'inline-flex', transform: 'rotate(180deg)' }}><Ic d="m6 9 6 6 6-6" /></button>
      </div>
      <div className="v2-lst" role="listbox" id={id} aria-multiselectable="true" aria-label={label}>
        <div className="v2-lh">
          <span>{q.trim() ? `${shown.length} ${noun} cocok dengan “${q.trim()}”` : `${shown.length} ${noun}`}</span>
          {shown.length > 0 && (
            <button type="button" className="pr-btn pr-btn--link" onClick={() => onChange(Array.from(new Set([...value, ...shown.map((o) => o.value)])))}>Pilih semua hasil</button>
          )}
        </div>
        {shown.map((o) => (
          <label className="v2-li" key={o.value}>
            <input type="checkbox" className="pr-check" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
            <span className="v2-li-c">
              <span className="v2-li-t">{o.label}</span>
              {o.sub && <span className="v2-li-s">{subIcon && <Ic d={PHONE} size={12} />}{o.sub}</span>}
            </span>
          </label>
        ))}
        <div className="v2-lf">
          <span>{value.length} dipilih</span>
          <button type="button" className="pr-btn pr-btn--link" onClick={() => onChange([])}>Kosongkan</button>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="pr-btn pr-btn--primary pr-btn--sm v2-fb" style={{ minHeight: 32 }} onClick={close}>Terapkan</button>
        </div>
      </div>
    </div>
  );
}
