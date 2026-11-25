// Isian "Periode kejadian" di panel Filter (Main-Filter). Board hanya menampilkan isian tertutup; dropdown memakai pola `.p-pop` + baris
// pilihan seperti PeriodSelect dashboard, rentang khusus memakai DateField DS. Lihat DEVIATIONS.md (D-P1..D-P7).
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DateField } from '@/components/ui/DateField';
import { PERIOD_CHOICES, choiceLabel, periodRange, rangeCaption, validateCustomRange, type PeriodChoice, type PeriodDraft } from '../../logic/period';

interface Props {
  draft: PeriodDraft;
  onChange: (d: PeriodDraft) => void;
  /** ISO WIB dari demoNow() */
  now: string;
}

const captionOf = (c: PeriodChoice, now: string) => {
  if (c === 'all' || c === 'custom') return '';
  return rangeCaption(periodRange(c, now)!);
};

export function PeriodField({ draft, onChange, now }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const today = now.slice(0, 10);

  const lb = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) lb.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, PERIOD_CHOICES.findIndex((c) => c.key === draft.choice)));
    setOpen(true);
  };
  const pick = (c: PeriodChoice) => {
    onChange(c === 'custom' ? { choice: 'custom', from: draft.from, to: draft.to } : { choice: c, from: '', to: '' });
    setOpen(false);
    btn.current?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = PERIOD_CHOICES.length;
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : PERIOD_CHOICES.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(PERIOD_CHOICES[active].key);
    } else if (e.key === 'Escape') {
      // Esc hanya menutup dropdown; panel Filter tetap terbuka
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') setOpen(false);
  };

  const isAll = draft.choice === 'all';
  const cap = captionOf(draft.choice, now);
  const err = draft.choice === 'custom' ? validateCustomRange(draft.from, draft.to, today) : null;
  const incomplete = draft.choice === 'custom' && !err && (!draft.from || !draft.to);
  const optId = (i: number) => `${uid}-o${i}`;

  return (
    <div className="ls-sec">
      <span className="p-lbl" id={`${uid}-lbl`}>
        Periode kejadian
      </span>
      <div ref={root} style={{ position: 'relative' }}>
        <button
          ref={btn}
          type="button"
          className="p-input ls-dd-btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? `${uid}-lb` : undefined}
          aria-activedescendant={open ? optId(active) : undefined}
          aria-labelledby={`${uid}-lbl ${uid}-val`}
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={onKey}
        >
          <span id={`${uid}-val`} style={{ flex: 1, color: isAll ? 'var(--ink-muted)' : undefined }}>
            {choiceLabel(draft.choice)}
          </span>
          {cap && <span className="p-cap">{cap}</span>}
          <Icon name="chevDown" size={16} />
        </button>
        {open && (
          <div ref={lb} id={`${uid}-lb`} className="p-pop ls-dd" role="listbox" aria-label="Periode kejadian">
            {PERIOD_CHOICES.map((c, i) => {
              const sel = c.key === draft.choice;
              const oc = captionOf(c.key, now);
              return (
                <div
                  key={c.key}
                  id={optId(i)}
                  role="option"
                  aria-selected={sel}
                  className={'row' + (i === active ? ' act' : '')}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c.key)}
                >
                  <span className="tx">
                    <span className="nm">{c.label}</span>
                    {oc && <span className="p-cap">{oc}</span>}
                  </span>
                  {sel && <Icon name="check" size={16} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {draft.choice === 'custom' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="ls-sec" style={{ gap: 4 }}>
              <span className="p-cap">Dari</span>
              <DateField label="Dari" value={draft.from} onChange={(v) => onChange({ ...draft, from: v })} invalid={!!err} today={today} />
            </div>
            <div className="ls-sec" style={{ gap: 4 }}>
              <span className="p-cap">Sampai</span>
              <DateField label="Sampai" value={draft.to} onChange={(v) => onChange({ ...draft, to: v })} invalid={!!err} today={today} />
            </div>
          </div>
          <div aria-live="polite">
            {err ? (
              <p className="p-help err" role="alert" style={{ margin: 0 }}>
                <Icon name="alert" size={14} />
                {err}
              </p>
            ) : incomplete ? (
              <p className="p-help" style={{ margin: 0 }}>
                Pilih tanggal Dari dan Sampai.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
