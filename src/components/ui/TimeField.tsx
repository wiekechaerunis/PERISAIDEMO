// Kolom jam DS (24 jam, WIB): `.p-input` berisi teks "01:00"; ketikan angka otomatis diberi titik dua. Menggantikan <input type="time">.
import { useEffect, useState, type CSSProperties } from 'react';

const VALID = /^([01]\d|2[0-3]):[0-5]\d$/;

interface Props {
  /** jam `HH:mm` atau '' */
  value: string;
  onChange: (v: string) => void;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}

/** "0100" → "01:00", "1" → "1", "130" → "13:0" (ketik bertahap); selain angka dibuang. */
const mask = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
};

export function TimeField({ value, onChange, label, invalid, disabled, style }: Props) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commit = (t: string) => {
    if (VALID.test(t)) onChange(t);
    else if (t === '') onChange('');
  };
  return (
    <span className={'p-input' + (invalid ? ' err' : '')} style={style}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholder="HH:mm"
        maxLength={5}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const t = mask(e.target.value);
          setText(t);
          commit(t);
        }}
        onBlur={() => {
          // jam tak lengkap dikembalikan ke nilai terakhir yang valid
          if (!VALID.test(text) && text !== '') setText(value);
        }}
        style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' }}
      />
    </span>
  );
}
