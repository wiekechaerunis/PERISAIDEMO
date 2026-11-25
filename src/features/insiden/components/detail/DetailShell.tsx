// Kerangka halaman detail: Sidebar + AppBar "child" (kembali, judul, tag, crumb, aksi) + isi + toast.
// Board: I15, I23, I32, V14, S12. Toast dari location.state.toast (sama seperti AppShell).
// B-18: tab Detail | Riwayat (n) di bawah app bar (badge lime saat aktif), crumb "Insiden › {nomor}". Tab aktif dibaca dari `?tab=riwayat`.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { Ic } from './Ic';

export interface ToastMsg {
  text: string;
  tone?: 'ok' | 'err';
}

interface Props {
  title: string;
  /** tag di samping judul (status, keparahan) */
  tags?: ReactNode;
  /** tampilkan breadcrumb Insiden › Detail insiden */
  crumb?: boolean;
  /** tombol aksi di bar atas */
  acts?: ReactNode;
  /** bar atas ringkas (S12): tanpa lonceng */
  bell?: boolean;
  /** pesan sementara dari aksi di halaman */
  toast?: ToastMsg | null;
  onToastClose?: () => void;
  /** dialog/overlay */
  overlay?: ReactNode;
  /** isi main memakai flex (state penuh layar) */
  centered?: boolean;
  busy?: boolean;
  /** nomor insiden untuk crumb "Insiden › {nomor}" (B-18) */
  no?: string;
  /** jumlah entri Riwayat; diisi = tab Detail | Riwayat (n) tampil */
  riwayatCount?: number;
  children: ReactNode;
}

export type DetailTab = 'detail' | 'riwayat';
/** Tab aktif layar detail (B-18), dari `?tab=riwayat`. */
export function useDetailTab(): DetailTab {
  return useSearchParams()[0].get('tab') === 'riwayat' ? 'riwayat' : 'detail';
}

export function DetailTabs({ count }: { count: number }) {
  const [params] = useSearchParams();
  const on = params.get('tab') === 'riwayat' ? 'riwayat' : 'detail';
  const to = (t: DetailTab) => {
    const p = new URLSearchParams(params);
    if (t === 'riwayat') p.set('tab', 'riwayat');
    else p.delete('tab');
    const q = p.toString();
    return q ? `?${q}` : '?';
  };
  return (
    <nav className="p-tabs" role="tablist" aria-label="Detail dan riwayat insiden">
      <Link to={to('detail')} role="tab" aria-selected={on === 'detail'} aria-current={on === 'detail' ? 'page' : undefined} replace>
        Detail
      </Link>
      <Link to={to('riwayat')} role="tab" aria-selected={on === 'riwayat'} aria-current={on === 'riwayat' ? 'page' : undefined} replace>
        Riwayat
        <span
          className="p-count"
          style={on === 'riwayat' ? { background: 'var(--action)', color: 'var(--on-action)' } : { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}
        >
          {count}
        </span>
      </Link>
    </nav>
  );
}

export function DetailShell({ title, tags, crumb = true, acts, bell = true, toast, onToastClose, overlay, centered, busy, no, riwayatCount, children }: Props) {
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
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Ic d="collapse" size={18} />
            </button>
            <Link to="/insiden" className="p-ibtn" aria-label="Kembali ke Insiden">
              <Ic d="back" size={16} />
            </Link>
            <div className="p-col ttl">
              {tags ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1>{title}</h1>
                  {tags}
                </div>
              ) : (
                <h1>{title}</h1>
              )}
              {crumb && (
                <ol className="p-crumb">
                  <li><Link to="/insiden">Insiden</Link></li>
                  <li aria-hidden="true">›</li>
                  <li aria-current="page">{no ? <span className="p-mono">{no}</span> : 'Detail insiden'}</li>
                </ol>
              )}
            </div>
            <div className="acts">{acts}</div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai">
                <Ic d="sparkle" size={15} />
                <span className="lbl">Tanya AI</span>
              </button>
              {bell && (
                <button type="button" className="p-ibtn ghost p-bell" aria-label={tasks ? `Notifikasi, ${tasks} belum dibaca` : 'Notifikasi'}>
                  <Ic d="bell" size={20} />
                  {tasks > 0 && <span className="p-count">{tasks}</span>}
                </button>
              )}
            </div>
          </div>
          {riwayatCount !== undefined && <DetailTabs count={riwayatCount} />}
        </header>
        <main className="lk-content" style={centered ? { display: 'flex' } : undefined} aria-busy={busy || undefined}>
          {children}
        </main>
      </div>
      {overlay}
      {shown && (
        <div className="dt-toastpos">
          <div className={shown.tone === 'err' ? 'p-toast err' : 'p-toast'} role={shown.tone === 'err' ? 'alert' : 'status'}>
            <span className="ti"><Ic d={shown.tone === 'err' ? 'close' : 'check'} size={12} /></span>
            <span className="msg">{shown.text}</span>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={closeToast}>
              <Ic d="close" size={15} />
            </button>
          </div>
        </div>
      )}
      <RoleSwitcher />
    </div>
  );
}
