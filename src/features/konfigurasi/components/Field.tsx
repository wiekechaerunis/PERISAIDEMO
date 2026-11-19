import type { CSSProperties } from 'react';
import { Ic, P_WARN } from './Ic';

export const RAW_INPUT: CSSProperties = { border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' };

interface NumProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  err?: string;
  width: number;
  /** `lead` = awalan (USD), `tail` = akhiran (hari/jam) */
  lead?: string;
  tail?: string;
}

/** Isian angka bergaya `p-input` (tinggi 32) dengan awalan/akhiran dan galat inline di bawahnya. */
export function NumField({ label, value, onChange, err, width, lead, tail }: NumProps) {
  return (
    <>
      <span className={'p-input' + (err ? ' err' : '')} style={{ height: 32, width }}>
        {lead && <span className="affix">{lead}</span>}
        <input
          className="num" inputMode="numeric" aria-label={label} aria-invalid={err ? true : undefined} value={value}
          onChange={(e) => onChange(e.target.value)} style={RAW_INPUT}
        />
        {tail && <span className="affix">{tail}</span>}
      </span>
      {err && <FieldErr text={err} />}
    </>
  );
}

export function FieldErr({ text }: { text: string }) {
  return (
    <span className="p-help err" role="alert" style={{ marginTop: 4 }}>
      <Ic d={P_WARN} size={14} />
      {text}
    </span>
  );
}
