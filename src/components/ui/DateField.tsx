// Kolom tanggal DS: tampilan teks "28 Okt 2026" di `.p-input` + ikon kalender; pilihan lewat popover `.p-pop` berisi grid `.p-cal`.
// Menggantikan <input type="date"> bawaan browser (yang menampilkan mm/dd/yyyy dan ikon ganda).
import { demoNow } from '@/services/mock/clock';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import { formatDate } from '@/lib/format';


const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s: string): [number, number, number] | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]) - 1, Number(m[3])] : null;
};

interface Props {
  /** tanggal ISO `YYYY-MM-DD` atau '' */
  value: string;
  onChange: (iso: string) => void;
  /** label aksesibel, mis. "Tanggal" */
  label: string;
  /** tanggal paling awal / akhir yang boleh dipilih (ISO) */
  min?: string;
  max?: string;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** hari ini untuk sorotan dan tombol "Hari ini" (bawaan: tanggal demo) */
  today?: string;
  style?: CSSProperties;
}

export function DateField({ value, onChange, label, min, max, invalid, disabled, placeholder = 'Pilih tanggal', id, today = demoNow().slice(0, 10), style }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const base = parse(value) ?? parse(today)!;
  const [view, setView] = useState<[number, number]>([base[0], base[1]]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open) {
      const b = parse(value) ?? parse(today)!;
      setView([b[0], b[1]]);
    }
    setOpen(!open);
  };
  const shift = (delta: number) => {
    const t = view[0] * 12 + view[1] + delta;
    setView([Math.floor(t / 12), ((t % 12) + 12) % 12]);
  };
  const blocked = (s: string) => (!!min && s < min) || (!!max && s > max);
  const pick = (s: string) => {
    if (blocked(s)) return;
    onChange(s);
    setOpen(false);
  };

  // sel hari: mulai Senin; hari bulan lain tampil redup
  const [vy, vm] = view;
  const first = (new Date(Date.UTC(vy, vm, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(vy, vm + 1, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(vy, vm, 0)).getUTCDate();
  const cells: { s: string; d: number; off: boolean }[] = [];
  for (let i = first - 1; i >= 0; i--) {
    const t = vy * 12 + vm - 1;
    cells.push({ s: iso(Math.floor(t / 12), ((t % 12) + 12) % 12, prevDays - i), d: prevDays - i, off: true });
  }
  for (let d = 1; d <= days; d++) cells.push({ s: iso(vy, vm, d), d, off: false });
  while (cells.length % 7) {
    const t = vy * 12 + vm + 1;
    cells.push({ s: iso(Math.floor(t / 12), t % 12, cells.length - first - days + 1), d: cells.length - first - days + 1, off: true });
  }

  return (
    <div ref={root} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        id={id}
        className={'p-input' + (invalid ? ' err' : '')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        aria-label={`${label}: ${value ? formatDate(value) : 'belum dipilih'}`}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={toggle}
        style={{ width: '100%', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', font: 'inherit', color: 'inherit', border: 0 }}
      >
        <span style={{ flex: 1, color: value ? undefined : 'var(--ink-muted)' }}>{value ? formatDate(value) : placeholder}</span>
        <Icon name="calendar" size={16} />
      </button>
      {open && (
        <div id={uid} className="p-pop" role="dialog" aria-label={`Pilih ${label.toLowerCase()}`} style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', zIndex: 60, padding: 12, width: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Bulan sebelumnya" onClick={() => shift(-1)}>
              <Icon name="back" size={14} />
            </button>
            <b style={{ fontSize: 13 }} aria-live="polite">{MONTHS[vm]} {vy}</b>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Bulan berikutnya" onClick={() => shift(1)}>
              <Icon name="back" size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
          <div className="p-cal" role="grid" aria-label={`${MONTHS[vm]} ${vy}`}>
            {WEEKDAYS.map((w) => (
              <span key={w} className="wd" role="columnheader">{w}</span>
            ))}
            {cells.map((c) => {
              const off = c.off || blocked(c.s);
              const cls = [off ? 'off' : '', c.s === today ? 'today' : '', c.s === value ? 'on' : ''].filter(Boolean).join(' ');
              return (
                <span
                  key={c.s}
                  role="gridcell"
                  tabIndex={blocked(c.s) ? -1 : 0}
                  aria-selected={c.s === value}
                  aria-disabled={blocked(c.s) || undefined}
                  aria-label={formatDate(c.s)}
                  className={cls}
                  style={{ cursor: blocked(c.s) ? 'not-allowed' : 'pointer' }}
                  onClick={() => pick(c.s)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(c.s))}
                >
                  {c.d}
                </span>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button type="button" className="p-link" onClick={() => !blocked(today) && pick(today)} disabled={blocked(today)}>Hari ini</button>
            {value && (
              <button type="button" className="p-link" onClick={() => { onChange(''); setOpen(false); }}>Hapus</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
