// Tab Pemantauan WhatsApp v2: Nomor tertaut, Grup, Aturan, dan ketentuan pemakaian (board V2-20..24, V2-30..32, V2-40..43).
// Hanya Admin KKKS (R-04). Gateway WhatsApp ditiru: pemindaian QR dilakukan dari panel simulasi (WaSimPanel).
import type { ReactNode } from 'react';
import { useDemoStore } from '@/services/mock/store';
import type { WaResult } from '@/services/mock/workflow.wamon';
import type { createNumber } from '@/services/mock/workflow.wamon';

export const WK = ['WK Andalas Darat', 'WK Batu Ampar', 'WK Rokan'];
export const PAIR_CODE = 'PRSI2026';

export const Btn = ({ children, onClick, kind = 'secondary', disabled, label }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; label?: string }) => (
  <button type="button" className={`p-btn p-btn-${kind} p-btn-sm`} onClick={onClick} disabled={disabled} aria-label={label}>{children}</button>
);
export const run = (fn: (s: ReturnType<typeof slice>) => WaResult): string | null => {
  let err: string | null = null;
  useDemoStore.getState().updateWaMon((s) => {
    const r = fn(s);
    if (!r.ok) { err = r.reason; return {}; }
    return r.state;
  });
  return err;
};
export const slice = () => useDemoStore.getState() as unknown as Parameters<typeof createNumber>[0];

