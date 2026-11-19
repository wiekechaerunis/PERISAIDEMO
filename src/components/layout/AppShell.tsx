import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, type NavKey } from './Sidebar';
import { RoleSwitcher } from './RoleSwitcher';
import { Icon } from '../ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { canCreateReport } from '@/lib/rbac';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';

export interface TabDef {
  to: string;
  label: string;
  count: number;
  on: boolean;
}

interface Props {
  nav: NavKey;
  title: string;
  subtitle?: string;
  tabs?: TabDef[];
  tabsLabel?: string;
  /** tombol utama di bar atas (mis. Buat laporan) */
  action?: { to: string; label: string };
  children: ReactNode;
}

/** Cangkang halaman: Sidebar + AppBar (top) + konten (`lk-app`, `lk-main`, `lk-content`). */
export function AppShell({ nav, title, subtitle, tabs, tabsLabel, action, children }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast ?? null;
  const [toast, setToast] = useState<string | null>(routeToast);
  useEffect(() => {
    setToast(routeToast);
    if (!routeToast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [routeToast]);
  return (
    <div className="lk-app p-app">
      <Sidebar active={nav} role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar top">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <div className="p-col ttl">
              <h1>{title}</h1>
              {subtitle && <span className="sub">{subtitle}</span>}
            </div>
            {action && canCreateReport(role) && (
              <div className="acts">
                <Link to={action.to} className="p-btn p-btn-primary">
                  <Icon name="plus" size={16} />
                  {action.label}
                </Link>
              </div>
            )}
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai">
                <Icon name="sparkle" size={15} />
                <span className="lbl">Tanya AI</span>
              </button>
              <button
                type="button"
                className="p-ibtn ghost p-bell"
                aria-label={tasks ? `Notifikasi, ${tasks} belum dibaca` : 'Notifikasi'}
              >
                <Icon name="bell" size={20} />
                {tasks > 0 && <span className="p-count">{tasks}</span>}
              </button>
            </div>
          </div>
          {tabs && (
            <nav className="p-tabs" role="tablist" aria-label={tabsLabel}>
              {tabs.map((t) => (
                <Link key={t.to} to={t.to} role="tab" aria-selected={t.on} aria-current={t.on ? 'page' : undefined}>
                  {t.label}
                  <span
                    className="p-count"
                    style={
                      t.on
                        ? { background: 'var(--action)', color: 'var(--on-action)' }
                        : { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }
                    }
                  >
                    {t.count}
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </header>
        <main className="lk-content">{children}</main>
      </div>
      {toast && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 120 }}>
          <div className="p-toast" role="status">
            <span className="ti"><Icon name="check" size={14} /></span>
            {toast}
          </div>
        </div>
      )}
      <RoleSwitcher />
    </div>
  );
}
