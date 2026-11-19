// Pembungkus gaya desain Pemantauan WhatsApp v2 (kelas `pr-*`). CSS-nya (wa-v2.css) hanya berlaku di dalam `.v2-root`.
import type { ReactNode } from 'react';

export function V2Root({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={'v2-root' + (className ? ` ${className}` : '')} data-theme="light" style={{ fontFamily: 'var(--font-sans)', width: '100%' }}>
      {children}
    </div>
  );
}
