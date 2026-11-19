import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { canEditConfig } from '@/services/mock/workflow.config';
import { Ic, P_CHECK } from './Ic';

interface ShellProps {
  /** judul halaman; juga teks terakhir breadcrumb: Konfigurasi Modul › Insiden › {title} */
  title: string;
  actions?: ReactNode;
  ai?: boolean;
  mainStyle?: CSSProperties;
  children: ReactNode;
  /** elemen di luar `lk-main` (mis. toast) */
  outside?: ReactNode;
}

/** Cangkang halaman anak Konfigurasi (header `child`: tombol kembali + breadcrumb), board CFG-MatriksKeparahan/CFG-Tenggat. */
export function ChildShell({ title, actions, ai, mainStyle, children, outside }: ShellProps) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  return (
    <div className="lk-app p-app">
      <Sidebar active="pengaturan" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <Link to="/konfigurasi" className="p-ibtn" aria-label="Kembali ke Konfigurasi Modul">
              <Icon name="back" size={16} />
            </Link>
            <div className="p-col ttl">
              <h1>{title}</h1>
              <ol className="p-crumb">
                <li><Link to="/konfigurasi">Konfigurasi Modul</Link></li>
                <li aria-hidden="true">›</li>
                <li>Insiden</li>
                <li aria-hidden="true">›</li>
                <li aria-current="page">{title}</li>
              </ol>
            </div>
            <div className="acts">{actions}</div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              {ai && (
                <button type="button" className="p-ai">
                  <Icon name="sparkle" size={15} />
                  <span className="lbl">Tanya AI</span>
                </button>
              )}
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi">
                <Icon name="bell" size={20} />
              </button>
            </div>
          </div>
        </header>
        <main className="lk-content" style={mainStyle}>{children}</main>
      </div>
      {outside}
      <RoleSwitcher />
    </div>
  );
}

/** Toast status (board: kanan bawah). */
export function CfgToast({ msg, bottom }: { msg: string | null; bottom: number }) {
  if (!msg) return null;
  return (
    <div className="p-toast" role="status" style={{ position: 'fixed', right: 24, bottom, zIndex: 120 }}>
      <span className="ti"><Ic d={P_CHECK} size={12} /></span>
      <span className="msg">{msg}</span>
    </div>
  );
}

/** Pesan toast yang hilang sendiri setelah 4 detik. */
export function useCfgToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(id);
  }, [msg]);
  return [msg, setMsg] as const;
}

/** Peran selain Admin SKK: state terbatas (pola S12), tanpa kontrol ubah. */
export function LimitedConfig() {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <Link to="/insiden" className="p-ibtn" aria-label="Kembali ke Insiden">
              <Icon name="back" size={16} />
            </Link>
            <div className="p-col ttl"><h1>Konfigurasi Modul</h1></div>
            <div className="acts"></div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util"></div>
          </div>
        </header>
        <main className="lk-content" style={{ display: 'flex' }}>
          <div className="in-status">
            <svg className="il" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
              <rect className="pa ln" x="34" y="40" width="52" height="42" rx="8" />
              <path className="ln" d="M46 40V30a14 14 0 0 1 28 0v10" />
              <circle className="ac ln" cx="60" cy="61" r="6" />
            </svg>
            <h2>Anda tidak punya akses ke Konfigurasi Modul.</h2>
            <p>Menu ini hanya untuk Admin SKK. Hubungi Admin SKK bila perlu mengubah konfigurasi.</p>
            <Link to="/insiden" className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>Kembali ke daftar</Link>
          </div>
        </main>
      </div>
      <RoleSwitcher />
    </div>
  );
}

/** Hanya Admin SKK yang melihat isi; peran lain mendapat state terbatas. */
export function AdminGate({ children }: { children: ReactNode }) {
  const role = useDemoStore((s) => s.role);
  return canEditConfig(role) ? <>{children}</> : <LimitedConfig />;
}
