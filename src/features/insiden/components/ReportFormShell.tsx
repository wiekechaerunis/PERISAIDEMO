// Kerangka form lapor: Sidebar + AppBar "child" (kembali, judul, crumb) + Stepper + grid c8/c4 + FormFooter.
// Board: I12, I13, I13b, I14 (struktur sama di semua langkah).
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';

export interface FooterAction {
  label: string;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

interface Props {
  /** langkah aktif 1..total */
  step: number;
  /** nama langkah, mis. ['Temuan','Kejadian & dampak','Lampiran','Ringkasan'] */
  steps: string[];
  /** isi kolom kiri (c8) */
  main: ReactNode;
  /** isi kolom kanan (c4): kartu Pengajuan + Copilot */
  aside: ReactNode;
  /** tombol kiri footer (Batal / Kembali) */
  back: FooterAction;
  /** tombol kanan footer; paling kanan = aksi utama */
  actions: FooterAction[];
  /** teks di sisi kiri footer sebelum tombol (mis. ikon gembok), opsional */
  footerNote?: ReactNode;
}

function Btn({ a }: { a: FooterAction }) {
  const cls = 'p-btn ' + (a.variant === 'primary' ? 'p-btn-primary' : 'p-btn-secondary');
  if (a.to && !a.disabled) return <Link to={a.to} className={cls}>{a.label}</Link>;
  return (
    <button type="button" className={cls} onClick={a.onClick} disabled={a.disabled}>
      {a.label}
    </button>
  );
}

export function ReportFormShell({ step, steps, main, aside, back, actions, footerNote }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const navigate = useNavigate();
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <button type="button" className="p-ibtn" aria-label="Kembali ke Insiden" onClick={() => navigate('/insiden')}>
              <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1>Laporan baru</h1>
                <span className="p-tag t-draft">Draf</span>
              </div>
              <ol className="p-crumb">
                <li><Link to="/insiden">Insiden</Link></li>
                <li aria-hidden="true">›</li>
                <li aria-current="page">Laporan baru</li>
              </ol>
            </div>
            <div className="acts"></div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai">
                <Icon name="sparkle" size={15} />
                <span className="lbl">Tanya AI</span>
              </button>
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi">
                <Icon name="bell" size={20} />
              </button>
            </div>
          </div>
        </header>
        <form className="lk-content" style={{ paddingBottom: 0 }} onSubmit={(e) => e.preventDefault()}>
          <ol className="p-stepper" aria-label="Langkah">
            {steps.map((label, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'on' : '';
              return (
                <StepItem key={label} n={n} label={label} state={state} last={i === steps.length - 1} prevDone={n <= step} />
              );
            })}
          </ol>
          <div className="lk-grid">
            <div className="c8 lk-stack">{main}</div>
            <aside className="c4 lk-stack">{aside}</aside>
          </div>
          <div className="lk-ffoot" role="region" aria-label="Aksi formulir" style={{ margin: '0 -24px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Btn a={back} />
              {footerNote}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {actions.map((a) => (
                <Btn key={a.label} a={a} />
              ))}
            </div>
          </div>
        </form>
      </div>
      <RoleSwitcher />
    </div>
  );
}

function StepItem({ n, label, state, last, prevDone }: { n: number; label: string; state: string; last: boolean; prevDone: boolean }) {
  return (
    <>
      {n > 1 && <li className={'p-conn' + (prevDone && state !== '' ? ' done' : '')} aria-hidden="true"></li>}
      <li className={'p-step' + (state ? ' ' + state : '')} aria-current={state === 'on' ? 'step' : undefined}>
        <span className="n">
          {state === 'done' ? (
            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12 }}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            n
          )}
        </span>
        {label}
      </li>
      {last ? null : null}
    </>
  );
}
