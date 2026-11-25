// Kerangka halaman kerja PIC: Sidebar + AppBar "child" (kembali, judul, tag, crumb bertingkat, aksi) + isi + toast.
// Pola sama dengan DetailShell, ditambah `backTo` dan `crumbs` (board P12, P14 punya crumb dan tujuan kembali berbeda).
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { DetailTabs } from '../detail/DetailShell';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { Ic } from '../detail/Ic';
import type { ToastMsg } from '../detail/DetailShell';

export interface Crumb { label: string; to?: string }

interface Props {
  title: string;
  /** jumlah entri Riwayat; diisi = tab Detail | Riwayat (n) (B-18) */
  riwayatCount?: number;
  tags?: ReactNode;
  backTo?: string;
  crumbs?: Crumb[];
  acts?: ReactNode;
  toast?: ToastMsg | null;
  onToastClose?: () => void;
  overlay?: ReactNode;
  busy?: boolean;
  children: ReactNode;
}

export function HandlingShell({ title, tags, backTo = '/insiden', crumbs, acts, toast, onToastClose, overlay, busy, riwayatCount, children }: Props) {
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
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar"><Ic d="collapse" size={18} /></button>
            <Link to={backTo} className="p-ibtn" aria-label="Kembali ke Insiden"><Ic d="back" size={16} /></Link>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1>{title}</h1>
                {tags}
              </div>
              <ol className="p-crumb">
                {(crumbs ?? [{ label: 'Insiden', to: '/insiden' }, { label: 'Detail insiden' }]).flatMap((c, n, a) => {
                  const last = n === a.length - 1;
                  const li = <li key={n} aria-current={last ? 'page' : undefined}>{c.to && !last ? <Link to={c.to}>{c.label}</Link> : c.label}</li>;
                  return last ? [li] : [li, <li key={`s${n}`} aria-hidden="true">›</li>];
                })}
              </ol>
            </div>
            <div className="acts">{acts}</div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai"><Ic d="sparkle" size={15} /><span className="lbl">Tanya AI</span></button>
              <button type="button" className="p-ibtn ghost p-bell" aria-label={tasks ? `Notifikasi, ${tasks} belum dibaca` : 'Notifikasi'}>
                <Ic d="bell" size={20} />
                {tasks > 0 && <span className="p-count">{tasks}</span>}
              </button>
            </div>
          </div>
          {riwayatCount !== undefined && <DetailTabs count={riwayatCount} />}
        </header>
        <main className="lk-content" aria-busy={busy || undefined}>{children}</main>
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

/** PS9: kerangka kerja memuat. */
export function HandlingLoading() {
  const sk = (w: string | number, h: number) => <span className="p-sk" style={{ height: h, width: w, borderRadius: 'var(--radius-md)' }}></span>;
  return (
    <div className="lk-grid">
      <div className="c8 lk-stack">
        <div role="status" aria-label="Memuat" className="lk-stack">
          <section className="p-card lk-stack-sm">{sk(180, 14)}{sk('60%', 26)}{sk('80%', 28)}</section>
          <section className="p-card lk-stack-sm">{sk('40%', 18)}{sk('100%', 72)}</section>
          <section className="p-card lk-stack-sm">{sk('50%', 18)}{sk('100%', 44)}{sk('100%', 44)}{sk('100%', 44)}{sk('100%', 44)}</section>
        </div>
      </div>
      <aside className="c4 lk-stack">
        <section className="p-card lk-stack-sm">{sk('50%', 18)}{sk('100%', 40)}</section>
        <section className="p-card lk-stack-sm">{sk('60%', 18)}{sk('100%', 28)}{sk('70%', 14)}</section>
      </aside>
    </div>
  );
}
