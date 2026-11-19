// Cangkang layar mobile (board M1 dst.): `.in-m` > `.top` (56px) + `.body` + `.foot` opsional + FAB. Class dari ins.css.
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

interface Props {
  title: ReactNode;
  /** 'menu' = ikon hamburger (daftar), 'back' = panah kembali (layar anak), 'close' = silang */
  left?: 'menu' | 'back' | 'close';
  /** tujuan tombol kembali; default navigate(-1) */
  backTo?: string;
  onMenu?: () => void;
  /** tombol di kanan bar atas (ikon .ib44) */
  actions?: ReactNode;
  /** isi `.body` */
  children: ReactNode;
  /** bar bawah `.foot` (aksi utama menempel) */
  footer?: ReactNode;
  /** tombol mengambang (`.p-fab`) */
  fab?: ReactNode;
  /** lapisan di atas layar: BottomSheet, toast */
  overlay?: ReactNode;
  bodyStyle?: CSSProperties;
}

export function MobileShell({ title, left = 'back', backTo, onMenu, actions, children, footer, fab, overlay, bodyStyle }: Props) {
  const navigate = useNavigate();
  return (
    <div className="in-m app">
      <div className="top">
        {left === 'menu' ? (
          <button type="button" className="ib44" aria-label="Buka menu" onClick={onMenu}>
            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 22, height: 22 }}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : (
          <button type="button" className="ib44" aria-label={left === 'close' ? 'Tutup' : 'Kembali'} onClick={() => (backTo ? navigate(backTo) : navigate(-1))}>
            <Icon name={left === 'close' ? 'close' : 'back'} size={20} />
          </button>
        )}
        <span className="ttl">{title}</span>
        {actions}
      </div>
      <div className="body" style={{ paddingBottom: footer || fab ? 96 : undefined, ...bodyStyle }}>
        {children}
      </div>
      {footer && <div className="foot">{footer}</div>}
      {fab}
      {overlay}
    </div>
  );
}
