// Periode kejadian di panel Filter (board Main-Filter): chip 7/30/90 hari terakhir, Tahun ini, Rentang tanggal. Klik chip aktif =
// kembali ke Semua waktu. Rentang tanggal membuka isian Dari/Sampai (DateField DS). Logika tetap di logic/period.ts.
import { useId } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DateField } from '@/components/ui/DateField';
import { LIST_PERIOD_CHIPS, periodRange, rangeCaption, validateCustomRange, type PeriodChoice, type PeriodDraft } from '../../logic/period';

interface Props {
  draft: PeriodDraft;
  onChange: (d: PeriodDraft) => void;
  /** ISO WIB dari demoNow() */
  now: string;
}

const captionOf = (c: PeriodChoice, now: string) => (c === 'all' || c === 'custom' ? '' : rangeCaption(periodRange(c, now)!));

export function PeriodField({ draft, onChange, now }: Props) {
  const uid = useId();
  const today = now.slice(0, 10);
  const pick = (c: PeriodChoice) => {
    if (draft.choice === c) onChange({ choice: 'all', from: '', to: '' });
    else onChange(c === 'custom' ? { choice: 'custom', from: draft.from, to: draft.to } : { choice: c, from: '', to: '' });
  };
  const cap = captionOf(draft.choice, now);
  const err = draft.choice === 'custom' ? validateCustomRange(draft.from, draft.to, today) : null;
  const incomplete = draft.choice === 'custom' && !err && (!draft.from || !draft.to);

  return (
    <div className="ls-sec">
      <span className="p-lbl" id={`${uid}-lbl`}>
        Periode kejadian
      </span>
      <div className="in-chips" role="group" aria-labelledby={`${uid}-lbl`} style={{ flexWrap: 'wrap' }}>
        {LIST_PERIOD_CHIPS.map((c) => (
          <button key={c.key} type="button" className="p-chip" aria-pressed={draft.choice === c.key} onClick={() => pick(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      {cap && <span className="p-cap">{cap}</span>}
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
