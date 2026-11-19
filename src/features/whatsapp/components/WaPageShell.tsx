// Kerangka halaman WhatsApp non-form (board I24 Detail pesan, I25 Detail insiden): sama dengan DetailShell, crumb dan tujuan kembali bisa diatur.
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { Toast } from './parts';

export interface WaToast {
  text: string;
  tone?: 'err';
}

interface Props {
  title: string;
  tags?: ReactNode;
  /** [label, tujuan?] per butir; butir terakhir = halaman ini */
  crumb: [string, string?][];
  backTo: string;
  toast?: WaToast | null;
  onToastClose?: () => void;
  overlay?: ReactNode;
  children: ReactNode;
}

export function WaPageShell({ title, tags, crumb, backTo, toast, onToastClose, overlay, children }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast ?? null;
  const [open, setOpen] = useState(!!routeToast);
  useEffect(() => setOpen(!!routeToast), [routeToast]);
  const shown: WaToast | null = toast ?? (routeToast && open ? { text: routeToast } : null);
  return (
    <div className="lk-app p-app dt-fix">
      <Sidebar active="whatsapp" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar"><Icon name="collapse" size={18} /></button>
            <Link to={backTo} className="p-ibtn" aria-label="Kembali"><Icon name="back" size={16} /></Link>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1>{title}</h1>
                {tags}
              </div>
              <ol className="p-crumb">
                {crumb.map(([label, to], i) => (
                  <Fragment key={label}>
                    {i > 0 && <li aria-hidden="true">›</li>}
                    <li aria-current={i === crumb.length - 1 ? 'page' : undefined}>{to ? <Link to={to}>{label}</Link> : label}</li>
                  </Fragment>
                ))}
              </ol>
            </div>
            <div className="acts"></div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi"><Icon name="bell" size={20} /></button>
            </div>
          </div>
        </header>
        <main className="lk-content">{children}</main>
      </div>
      {overlay}
      {shown && <Toast text={shown.text} tone={shown.tone} onClose={() => { setOpen(false); onToastClose?.(); }} />}
      <RoleSwitcher />
    </div>
  );
}
