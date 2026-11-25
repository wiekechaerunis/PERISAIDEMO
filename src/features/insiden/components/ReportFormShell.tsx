// Kerangka form lapor: Sidebar + AppBar "child" (kembali, judul, crumb, Hapus draf) + Stepper + grid c8/c4 + footer sticky.
// Board: I12, I12s, I13, I13b, I14 (struktur sama di semua langkah), I13d (Hapus draf), I13k (Tinggalkan halaman ini?).
// B-1: "Buat laporan" + crumb Insiden › Baru sebelum tersimpan; "Ubah insiden" + Draf + crumb Insiden › {nomor} › Ubah sesudahnya.
// B-7: footer sticky. B-8: Hapus draf hanya pembuat draf. B-9: keluar dengan perubahan belum disimpan → modal konfirmasi.
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, UNSAFE_DataRouterContext, useBlocker, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { deleteDraft } from '@/services/mock/workflow';
import { DEMO_USERS } from '@/lib/rbac';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { isDirty, useDraftStore } from '../logic/draft';
import { useCopilotStore } from '../copilot/copilotStore';
import { DeleteDraftDialog } from './detail/DeleteDraftDialog';

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
  /** nama langkah, mis. ['Waktu & lokasi','Dampak','Lampiran','Ringkasan'] */
  steps: string[];
  /** isi kolom kiri (c8) */
  main: ReactNode;
  /** isi kolom kanan (c4) */
  aside: ReactNode;
  /** tombol kiri footer (langkah 1: Batal; langkah 2–4: Sebelumnya) */
  back: FooterAction;
  /** tombol kanan footer; paling kanan = aksi utama */
  actions: FooterAction[];
  /** teks di sisi kiri footer sesudah tombol, opsional */
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

/** Rute di dalam form lapor (pindah langkah tidak dianggap keluar). */
const inForm = (path: string) => path.startsWith('/insiden/baru/');

/** Buang perubahan yang belum disimpan (lampiran baru ikut dibuang, B-9). */
export const discardDraft = () => {
  useDraftStore.getState().resetDraft();
  useCopilotStore.getState().reset(false);
};

export function LeaveDialog({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onStay();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onStay]);
  return (
    <>
      <div className="in-scrim" onClick={onStay}></div>
      <div className="in-dlg" role="alertdialog" aria-modal="true" aria-labelledby="lv-t">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="lv-t">Tinggalkan halaman ini?</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onStay}>
              <Icon name="close" size={15} />
            </button>
          </div>
          <div className="db">
            <span>
              Ada perubahan yang belum disimpan. Kalau Anda keluar sekarang, perubahan itu hilang. Pilih Tetap di sini lalu Simpan draf bila
              ingin menyimpannya.
            </span>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onLeave}>Keluar</button>
            <button type="button" className="p-btn p-btn-primary" ref={ref} onClick={onStay}>Tetap di sini</button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Penjaga navigasi keluar form (hanya di router data; tes dengan MemoryRouter tidak memakainya). */
function LeaveGuard() {
  const dirty = useDraftStore(isDirty);
  const blocker = useBlocker(({ nextLocation }) => dirty && !inForm(nextLocation.pathname));
  if (blocker.state !== 'blocked') return null;
  return (
    <LeaveDialog
      onLeave={() => {
        discardDraft();
        blocker.proceed();
      }}
      onStay={() => blocker.reset()}
    />
  );
}

export function ReportFormShell({ step, steps, main, aside, back, actions, footerNote }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  const navigate = useNavigate();
  const draft = useDraftStore((s) => s.draft);
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  const [delOpen, setDelOpen] = useState(false);
  const me = DEMO_USERS[role].name;
  const saved = !!draft.no;
  // B-8 + ADJ-18 butir 5: Hapus draf hanya untuk pembuat draf, hanya untuk draf yang sudah tersimpan
  const stored = useDemoStore((s) => (draft.no ? s.incidents.find((i) => i.no === draft.no) : undefined));
  const canDelete = saved && stored?.status === 'draf' && (draft.createdBy ?? stored.reporter) === me;

  const doDelete = () => {
    if (!draft.no) return;
    const r = useDemoStore.getState().decide((s) => deleteDraft(s, draft.no!, me));
    setDelOpen(false);
    if (!r.ok) return;
    discardDraft();
    navigate('/insiden', { state: { toast: 'Draf dihapus.' } });
  };

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
              <Icon name="back" size={16} />
            </button>
            <div className="p-col ttl">
              {saved ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1>Ubah insiden</h1>
                    <span className="p-tag t-draft">Draf</span>
                  </div>
                  <ol className="p-crumb">
                    <li><Link to="/insiden">Insiden</Link></li>
                    <li aria-hidden="true">›</li>
                    <li><span className="p-mono">{draft.no}</span></li>
                    <li aria-hidden="true">›</li>
                    <li aria-current="page">Ubah</li>
                  </ol>
                </>
              ) : (
                <>
                  <h1>Buat laporan</h1>
                  <ol className="p-crumb">
                    <li><Link to="/insiden">Insiden</Link></li>
                    <li aria-hidden="true">›</li>
                    <li aria-current="page">Baru</li>
                  </ol>
                </>
              )}
            </div>
            <div className="acts">
              {canDelete && (
                <button type="button" className="p-btn p-btn-danger" onClick={() => setDelOpen(true)}>
                  <Icon name="trash" size={16} />
                  Hapus draf
                </button>
              )}
            </div>
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
              return <StepItem key={label} n={n} label={label} state={state} prevDone={n <= step} />;
            })}
          </ol>
          <div className="lk-grid">
            <div className="c8 lk-stack">{main}</div>
            <aside className="c4 lk-stack">{aside}</aside>
          </div>
          <div className="lk-ffoot rf-sticky" role="region" aria-label="Aksi formulir" style={{ margin: '0 -24px' }}>
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
      {dataRouter && <LeaveGuard />}
      {delOpen && draft.no && (
        <DeleteDraftDialog no={draft.no} title={draft.title} files={draft.attachments.length} onCancel={() => setDelOpen(false)} onConfirm={doDelete} />
      )}
      <RoleSwitcher />
    </div>
  );
}

function StepItem({ n, label, state, prevDone }: { n: number; label: string; state: string; prevDone: boolean }) {
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
    </>
  );
}
