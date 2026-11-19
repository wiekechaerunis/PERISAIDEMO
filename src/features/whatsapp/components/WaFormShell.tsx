// Kerangka form "Jadikan draf laporan" dari WhatsApp: Sidebar + AppBar "child" (crumb Pemantauan WhatsApp) + Stepper + catatan + grid c8/c4 + footer.
// Board: I20, I21, I21b, I22 (struktur sama; beda dari ReportFormShell: crumb, tanpa tag Draf, slot catatan di bawah stepper).
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { WA_ROUTES, WA_STEPS } from '../logic/draft';

export interface WaAction {
  label: string;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
}

function Btn({ a }: { a: WaAction }) {
  const cls = 'p-btn ' + (a.variant === 'primary' ? 'p-btn-primary' : 'p-btn-secondary');
  if (a.to && !a.disabled) return <Link to={a.to} className={cls}>{a.icon}{a.label}</Link>;
  return (
    <button type="button" className={cls} onClick={a.onClick} disabled={a.disabled} aria-disabled={a.disabled || undefined}>
      {a.icon}{a.label}
    </button>
  );
}

interface Props {
  step: 1 | 2 | 3 | 4;
  /** kartu/banner di bawah stepper (catatan asal draf, banner ganda) */
  top?: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  back: WaAction;
  actions: WaAction[];
  overlay?: ReactNode;
}

export function WaFormShell({ step, top, main, aside, back, actions, overlay }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const navigate = useNavigate();
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar"><Icon name="collapse" size={18} /></button>
            <button type="button" className="p-ibtn" aria-label="Kembali ke Insiden" onClick={() => navigate('/insiden')}>
              <Icon name="back" size={16} />
            </button>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1>Laporan baru</h1></div>
              <ol className="p-crumb">
                <li><Link to={WA_ROUTES.inbox}>Pemantauan WhatsApp</Link></li>
                <li aria-hidden="true">›</li>
                <li aria-current="page">Jadikan draf laporan</li>
              </ol>
            </div>
            <div className="acts"></div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai"><Icon name="sparkle" size={15} /><span className="lbl">Tanya AI</span></button>
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi"><Icon name="bell" size={20} /></button>
            </div>
          </div>
        </header>
        <form className="lk-content" style={{ paddingBottom: 0 }} onSubmit={(e) => e.preventDefault()}>
          <ol className="p-stepper" aria-label="Langkah">
            {WA_STEPS.map((label, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'on' : '';
              return (
                <StepItem key={label} n={n} label={label} state={state} />
              );
            })}
          </ol>
          {top}
          <div className="lk-grid">
            <div className="c8 lk-stack">{main}</div>
            <aside className="c4 lk-stack">{aside}</aside>
          </div>
          <div className="lk-ffoot" role="region" aria-label="Aksi formulir" style={{ margin: '0 -24px' }}>
            <Btn a={back} />
            <div style={{ display: 'flex', gap: 8 }}>
              {actions.map((a) => <Btn key={a.label} a={a} />)}
            </div>
          </div>
        </form>
      </div>
      {overlay}
      <RoleSwitcher />
    </div>
  );
}

function StepItem({ n, label, state }: { n: number; label: string; state: string }) {
  return (
    <>
      {n > 1 && <li className={'p-conn' + (state !== '' ? ' done' : '')} aria-hidden="true"></li>}
      <li className={'p-step' + (state ? ' ' + state : '')} aria-current={state === 'on' ? 'step' : undefined}>
        <span className="n">{state === 'done' ? <Icon name="check" size={12} /> : n}</span>
        {label}
      </li>
    </>
  );
}
