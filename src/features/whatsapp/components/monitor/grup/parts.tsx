// Bagian kecil tab Grup (board V2-50..57): ikon, pilih (listbox), dialog, input tag.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MAX_GROUP_TAGS, MAX_TAG_LEN } from '@/services/mock/workflow.wamon';

export const IC = {
  chev: 'm6 9 6 6 6-6', check: 'M20 6 9 17l-5-5', x: 'M18 6 6 18M6 6l12 12',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5', pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01', note: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
};
export const Ic = ({ d, size = 16, sw = 2, className, style }: { d: string; size?: number; sw?: number; className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} aria-hidden="true" focusable="false" className={className}><path d={d} /></svg>
);

/** Dialog modal bergaya papan. Esc atau klik latar menutup. */
export function Dlg({ labelledBy, className, onClose, children }: { labelledBy: string; className: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.open) return;
    if (typeof el.showModal === 'function') el.showModal(); else el.setAttribute('open', '');
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={labelledBy} className={className} onCancel={(e) => { e.preventDefault(); onClose(); }} onMouseDown={(e) => { if (e.target === ref.current) onClose(); }}>
      {children}
    </dialog>
  );
}

export interface Opt { value: string; label: string }
/** Pilih (listbox) gaya papan: `v2-sel` untuk isian, `v2-sel-inline` untuk pemilih Nomor di bilah kartu. */
export function V2Select({ id, value, options, placeholder, disabled, invalid, onChange, inline, ariaLabel }: {
  id?: string; value: string; options: Opt[]; placeholder?: string; disabled?: boolean; invalid?: boolean; onChange: (v: string) => void; inline?: boolean; ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);
  const cur = options.find((o) => o.value === value);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); setOpen(false); }
    if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); }
  };
  return (
    <span className="v2-sel-wrap" ref={wrap} style={inline ? { display: 'inline-flex' } : undefined} onKeyDown={key}>
      {inline ? (
        <button type="button" className="v2-sel-inline" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen(!open)}>{cur?.label ?? ''}</button>
      ) : (
        <button type="button" className={'pr-input v2-sel' + (open ? ' v2-focus' : '')} aria-haspopup="listbox" aria-expanded={open} id={id} aria-invalid={invalid ? true : false} disabled={disabled} onClick={() => setOpen(!open)}>
          {cur ? <span className="v2-sel-v">{cur.label}</span> : <span className="v2-sel-ph">{placeholder}</span>}
          <Ic d={IC.chev} />
        </button>
      )}
      {open && (
        <div className="v2-sel-list" role="listbox" aria-label={ariaLabel} style={inline ? { right: 'auto', minWidth: 200 } : undefined}>
          {options.map((o) => (
            <div key={o.value} role="option" aria-selected={o.value === value} tabIndex={-1} className="v2-opt" onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}{o.value === value && <Ic d={IC.check} />}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

/** Input tag: ketik lalu Enter. Paling banyak 10 tag, 30 karakter per tag. */
export function TagInput({ id, tags, onChange }: { id: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [txt, setTxt] = useState('');
  const add = () => {
    const t = txt.trim();
    setTxt('');
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase()) || tags.length >= MAX_GROUP_TAGS) return;
    onChange([...tags, t]);
  };
  return (
    <div className="pr-field">
      <label className="pr-label" htmlFor={`${id}-in`}>Tag <span className="font-medium text-ink-muted">(opsional)</span></label>
      <div className="pr-input wa-tagin">
        {tags.map((t) => (
          <span key={t} className="pr-tag pr-tag--muted" style={{ gap: 4 }}>{t}
            <button type="button" aria-label={`Hapus tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} style={{ border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}><Ic d={IC.x} size={12} /></button>
          </span>
        ))}
        <input id={`${id}-in`} maxLength={MAX_TAG_LEN} aria-describedby={`${id}-hint`} placeholder="Ketik lalu Enter, misalnya Sitrep harian" value={txt}
          onChange={(e) => setTxt(e.target.value)} onBlur={add}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
            else if (e.key === 'Backspace' && !txt && tags.length) onChange(tags.slice(0, -1));
          }} />
      </div>
      <p id={`${id}-hint`} className="pr-help">Untuk mengelompokkan grup, misalnya "Sitrep harian" atau "Ring 1". Paling banyak {MAX_GROUP_TAGS} tag, {MAX_TAG_LEN} karakter per tag.</p>
    </div>
  );
}
