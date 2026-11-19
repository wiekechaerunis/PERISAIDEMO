// Cangkang halaman Pemantauan WhatsApp v2: sidebar prototype + area konten papan (`pr-app__content`, header `pr-ph`).
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { DEMO_USERS, initials } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { V2Root } from '../V2Root';
import { Ic } from '../nomor/icons';

export function Account() {
  const role = useDemoStore((s) => s.role);
  const u = DEMO_USERS[role];
  return (
    <div className="pr-acct">
      <button type="button" className="pr-acct__btn" aria-label={`Akun ${u.name}`}>
        <span className="pr-avatar" aria-hidden="true">{initials(u.name)}</span>
        <span className="pr-acct__who"><b>{u.name}</b><span>{u.roleLabel}</span></span>
        <Ic d="m6 9 6 6 6-6" />
      </button>
    </div>
  );
}

/** Header halaman induk (V2-01): judul + ringkasan. */
export function PageHeader({ title, sum, action }: { title: string; sum: string; action?: ReactNode }) {
  return (
    <header className="pr-ph">
      <div className="pr-ph__text"><h1>{title}</h1><p className="pr-ph__sum">{sum}</p></div>
      {action && <div className="pr-ph__act">{action}</div>}
      <div className="pr-ph__acct"><Account /></div>
    </header>
  );
}

/** Header halaman anak (V2-10): tombol kembali + judul + remah roti. */
export function ChildHeader({ title, backTo, backLabel, crumb }: { title: string; backTo: string; backLabel: string; crumb: [string, string?][] }) {
  return (
    <header className="pr-ph pr-ph--child">
      <Link className="pr-btn pr-btn--secondary pr-ph__back" aria-label={`Kembali ke ${backLabel}`} title={`Kembali ke ${backLabel}`} to={backTo}>
        <Ic d="M19 12H5M12 19l-7-7 7-7" />
      </Link>
      <div className="pr-ph__text">
        <h1>{title}</h1>
        <div className="pr-ph__crumb">
          {crumb.map(([label, to], i) => (
            <span className="contents" key={label + i}>
              {i > 0 && <span aria-hidden="true">›</span>}
              {to ? <Link to={to}>{label}</Link> : <span>{label}</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="pr-ph__acct"><Account /></div>
    </header>
  );
}

export function PesanShell({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  return (
    <div className="lk-app p-app dt-fix">
      <Sidebar active="whatsapp" role={role} taskCount={tasks} />
      <div className="lk-main" style={{ flex: '1 1 auto', minWidth: 0 }}>
        <V2Root>
          <div className="pr-app__main" style={{ minHeight: '100vh' }}>
            <main className="pr-app__content" id="konten">{children}</main>
          </div>
        </V2Root>
      </div>
      {overlay}
      <RoleSwitcher />
    </div>
  );
}
