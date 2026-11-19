// Kerangka layar Kerawanan (KD1–KD6): Sidebar + AppBar "child" (kembali, judul, tag, crumb, aksi) + konten. Pola sama dengan ReviewShell.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';

export interface Crumb {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface Props {
  title: string;
  /** tag di samping judul, mis. "Belum disimpan" */
  tag?: ReactNode;
  crumbs: Crumb[];
  back: { to?: string; onClick?: () => void; label: string };
  acts?: ReactNode;
  /** konten dibungkus <form> (KD3/KD5) dan tanpa padding bawah */
  form?: boolean;
  children: ReactNode;
}

function CrumbItem({ c, last }: { c: Crumb; last: boolean }) {
  if (last) return <li aria-current="page">{c.label}</li>;
  if (c.onClick) {
    return (
      <li>
        <a href="#" onClick={(e) => { e.preventDefault(); c.onClick?.(); }}>{c.label}</a>
      </li>
    );
  }
  return <li><Link to={c.to ?? '/insiden'}>{c.label}</Link></li>;
}

export function KerawananShell({ title, tag, crumbs, back, acts, form, children }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const backIcon = (
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            {back.to ? (
              <Link to={back.to} className="p-ibtn" aria-label={back.label}>{backIcon}</Link>
            ) : (
              <button type="button" className="p-ibtn" aria-label={back.label} onClick={back.onClick}>{backIcon}</button>
            )}
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: tag ? 10 : 8, flexWrap: 'wrap' }}>
                <h1>{title}</h1>
                {tag}
              </div>
              <ol className="p-crumb">
                {crumbs.flatMap((c, i) => [
                  i > 0 ? <li key={`s${i}`} aria-hidden="true">›</li> : null,
                  <CrumbItem key={c.label} c={c} last={i === crumbs.length - 1} />,
                ])}
              </ol>
            </div>
            <div className="acts" style={acts ? { display: 'flex', gap: 8 } : undefined}>{acts}</div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai"><Icon name="sparkle" size={15} /><span className="lbl">Tanya AI</span></button>
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi"><Icon name="bell" size={20} /></button>
            </div>
          </div>
        </header>
        {form ? (
          <form className="lk-content" style={{ paddingBottom: 0 }} onSubmit={(e) => e.preventDefault()}>{children}</form>
        ) : (
          <main className="lk-content">{children}</main>
        )}
      </div>
      <RoleSwitcher />
    </div>
  );
}
