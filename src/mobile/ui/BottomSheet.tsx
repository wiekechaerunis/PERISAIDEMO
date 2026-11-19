// Bottom sheet mobile (board M1 Filter, MS03, MV3, ...): scrim + `.sheet` + `.grab` + judul + `.sb` + `.sf`.
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** tombol di `.sf` (bawah) */
  footer?: ReactNode;
  /** footer berupa baris (bawaan: kolom) */
  footerRow?: boolean;
}

export function BottomSheet({ title, onClose, children, footer, footerRow }: Props) {
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="grab" aria-hidden="true"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 16px' }}>
          <b style={{ fontSize: 17, lineHeight: '24px' }}>{title}</b>
          <button type="button" className="ib44" aria-label="Tutup" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="sb" style={{ overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div className="sf" style={footerRow ? { flexDirection: 'row' } : undefined}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
