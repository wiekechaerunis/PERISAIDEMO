// Kerangka halaman tindak lanjut (board T3..T9): Sidebar aktif "Tindak lanjut" + AppBar "child" (kembali, judul, tag, crumb, aksi) + toast.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useDemoStore } from '@/services/mock/store';
import { Ic } from '@/features/insiden/components/detail/Ic';
import type { ToastMsg } from '@/features/insiden/components/detail/DetailShell';
import { useTaskCount } from '../logic/useFollowUps';

interface Props {
  title: string;
  tags?: ReactNode;
  /** nomor TL untuk crumb; kosong = tanpa crumb */
  crumbNo?: string;
  acts?: ReactNode;
  toast?: ToastMsg | null;
  onToastClose?: () => void;
  overlay?: ReactNode;
  children: ReactNode;
}

export function TlShell({ title, tags, crumbNo, acts, toast, onToastClose, overlay, children }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast ?? null;
  const [routeOpen, setRouteOpen] = useState(!!routeToast);
  useEffect(() => setRouteOpen(!!routeToast), [routeToast]);
  const shown: ToastMsg | null = toast ?? (routeToast && routeOpen ? { text: routeToast } : null);
  const closeToast = () => {
    setRouteOpen(false);
    onToastClose?.();
  };
  return (
    <div className="lk-app p-app dt-fix">
      <Sidebar active="tindak" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar"><Ic d="collapse" size={18} /></button>
            <Link to="/tindak-lanjut" className="p-ibtn" aria-label="Kembali ke Tindak lanjut"><Ic d="back" size={16} /></Link>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1>{title}</h1>
                {tags}
              </div>
              {crumbNo && (
                <ol className="p-crumb">
                  <li><Link to="/tindak-lanjut">Tindak lanjut</Link></li>
                  <li aria-hidden="true">›</li>
                  <li aria-current="page">{crumbNo}</li>
                </ol>
              )}
            </div>
            <div className="acts">{acts}</div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ibtn ghost p-bell" aria-label={tasks ? `Notifikasi, ${tasks} belum dibaca` : 'Notifikasi'}>
                <Ic d="bell" size={20} />
                {tasks > 0 && <span className="p-count">{tasks}</span>}
              </button>
            </div>
          </div>
        </header>
        <main className="lk-content">{children}</main>
      </div>
      {overlay}
      {shown && (
        <div className="dt-toastpos">
          <div className={shown.tone === 'err' ? 'p-toast err' : 'p-toast'} role={shown.tone === 'err' ? 'alert' : 'status'}>
            <span className="ti"><Ic d={shown.tone === 'err' ? 'close' : 'check'} size={12} /></span>
            <span className="msg">{shown.text}</span>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={closeToast}><Ic d="close" size={15} /></button>
          </div>
        </div>
      )}
      <RoleSwitcher />
    </div>
  );
}
