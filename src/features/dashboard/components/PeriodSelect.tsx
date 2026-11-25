import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { DateField } from '@/components/ui/DateField';
import { PERIOD_CHOICES, draftToPeriod, periodRange, periodToDraft, rangeCaption, validateCustomRange, type PeriodChoice, type PeriodDraft } from '@/features/insiden/logic/period';
import { DASH_NOW, DASH_TODAY, DATA_CAPTION, useDashPeriod } from '../dashPeriod';

// S1 tombol periode di AppBar. Pilihan sama dengan filter Periode kejadian di daftar Insiden; "hari ini" = 30 Jun 2026
// (akhir data demo dashboard). Preset langsung berlaku; Rentang khusus memakai DateField DS dan tombol Terapkan.
// Periode disimpan di URL (?periode= / ?dari=&sampai=) dan dioper ke logika dashboard (props.periode).

const captionOf = (c: PeriodChoice) => (c === 'all' ? DATA_CAPTION : c === 'custom' ? 'Pilih tanggal Dari dan Sampai' : rangeCaption(periodRange(c, DASH_NOW)!));

export function PeriodSelect() {
  const uid = useId();
  const { period, setPeriod, info } = useDashPeriod();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PeriodDraft>(() => periodToDraft(period));
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const show = () => {
    const d = periodToDraft(period);
    setDraft(d);
    setActive(Math.max(0, PERIOD_CHOICES.findIndex((c) => c.key === d.choice)));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  const pick = (c: PeriodChoice) => {
    if (c === 'custom') {
      setDraft((d) => ({ choice: 'custom', from: d.choice === 'custom' ? d.from : '', to: d.choice === 'custom' ? d.to : '' }));
      return;
    }
    setPeriod({ kind: 'preset', preset: c });
    close();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        show();
      }
      return;
    }
    const n = PERIOD_CHOICES.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(PERIOD_CHOICES[active].key);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') setOpen(false);
  };

  const custom = draft.choice === 'custom';
  const err = custom ? validateCustomRange(draft.from, draft.to, DASH_TODAY) : null;
  const ready = custom ? draftToPeriod(draft, DASH_TODAY) : null;
  const optId = (i: number) => `${uid}-o${i}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btn}
        type="button"
        className="p-input"
        aria-label={`Periode: ${info.text}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-lb` : undefined}
        aria-activedescendant={open ? optId(active) : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        style={{ height: 36, border: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
      >
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink-muted)' }}>
          <path d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />
        </svg>
        {info.label}
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={'p-pop db-lvpop db-period db-per2' + (custom ? ' cu' : '')}>
          <div id={`${uid}-lb`} role="listbox" aria-label="Periode">
            {PERIOD_CHOICES.map((c, i) => {
              const sel = c.key === draft.choice;
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
                    <span className="p-cap">{captionOf(c.key)}</span>
                  </span>
                  {sel && (
                    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
          {custom && (
            <div className="cuf">
              <div className="dts">
                <div className="dt">
                  <span className="p-cap">Dari</span>
                  <DateField label="Dari" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} invalid={!!err} today={DASH_TODAY} />
                </div>
                <div className="dt">
                  <span className="p-cap">Sampai</span>
                  <DateField label="Sampai" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} invalid={!!err} today={DASH_TODAY} />
                </div>
              </div>
              <div aria-live="polite">
                {err ? (
                  <p className="p-help err" role="alert" style={{ margin: 0 }}>
                    {err}
                  </p>
                ) : (
                  <p className="p-help" style={{ margin: 0 }}>
                    Data demo: {DATA_CAPTION}. Hari ini = 30 Jun 2026.
                  </p>
                )}
              </div>
              <div className="ft">
                <button type="button" className="p-link" onClick={() => setDraft(periodToDraft(period))}>
                  Batal
                </button>
                <button
                  type="button"
                  className="p-btn p-btn-primary p-btn-sm"
                  disabled={!ready}
                  onClick={() => {
                    if (ready) setPeriod(ready);
                    close();
                  }}
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
