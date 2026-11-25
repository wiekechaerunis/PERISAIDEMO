// Kerangka layar Review: Sidebar + AppBar "child" (kembali, judul, tag, Minta revisi, Aksi lain) + konten.
// Pola sama dengan ReportFormShell. Board V12, V21, VS4, VS5.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { useTaskCount } from '@/features/tindak-lanjut/logic/useFollowUps';
import { Ic } from './parts';
import { DetailTabs } from '../detail/DetailShell';

interface Props {
  children: ReactNode;
  /** chip "Lewat batas" di judul (VS5) */
  late?: boolean;
  /** tag status; disembunyikan saat memuat (VS4) */
  statusTag?: boolean;
  /** tombol aksi; null saat memuat */
  actions?: { onRevision: () => void; onKerawanan: () => void; onRestricted: () => void; onCancel: () => void } | null;
  /** nomor insiden (crumb "Insiden › {nomor}", B-18) */
  no?: string;
  /** jumlah entri Riwayat → tab Detail | Riwayat (n) */
  riwayatCount?: number;
}

export function ReviewShell({ children, late, statusTag = true, actions, no, riwayatCount }: Props) {
  const role = useDemoStore((s) => s.role);
  const tasks = useTaskCount();
  return (
    <div className="lk-app p-app">
      <Sidebar active="insiden" role={role} taskCount={tasks} />
      <div className="lk-main">
        <header className="p-appbar child">
          <div className="hdr">
            <button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
              <Icon name="collapse" size={18} />
            </button>
            <Link to="/insiden" className="p-ibtn" aria-label="Kembali"><Ic d="M19 12H5M12 19l-7-7 7-7" size={16} /></Link>
            <div className="p-col ttl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1>Review insiden</h1>
                {statusTag && <span className="p-tag t-info">Menunggu pemeriksaan</span>}
                {late && <span className="lk-dl"><Ic d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" size={14} />Lewat batas</span>}
              </div>
              <ol className="p-crumb">
                <li><Link to="/insiden">Insiden</Link></li>
                <li aria-hidden="true">›</li>
                <li aria-current="page">{no ? <span className="p-mono">{no}</span> : 'Review insiden'}</li>
              </ol>
            </div>
            <div className="acts" style={actions ? { display: 'flex', gap: 8 } : undefined}>
              {actions && (
                <>
                  <button type="button" className="p-btn p-btn-secondary" onClick={actions.onRevision}>
                    <Ic d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1" size={16} />Minta revisi
                  </button>
                  <MoreMenu {...actions} />
                </>
              )}
            </div>
            <span className="p-vsep" aria-hidden="true"></span>
            <div className="util">
              <button type="button" className="p-ai"><Icon name="sparkle" size={15} /><span className="lbl">Tanya AI</span></button>
              <button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi"><Icon name="bell" size={20} /></button>
            </div>
          </div>
          {riwayatCount !== undefined && <DetailTabs count={riwayatCount} />}
        </header>
        <main className="lk-content">{children}</main>
      </div>
      <RoleSwitcher />
    </div>
  );
}

function MoreMenu({ onKerawanan, onRestricted, onCancel }: { onKerawanan: () => void; onRestricted: () => void; onCancel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const pick = (fn: () => void) => () => { setOpen(false); fn(); };
  return (
    <div className="in-menuwrap" ref={ref}>
      <button type="button" className="p-btn p-btn-secondary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Ic d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" size={16} />Aksi lain
      </button>
      {open && (
        <div className="in-menu" role="menu" aria-label="Aksi lain">
          <button type="button" role="menuitem" onClick={pick(onKerawanan)}>
            <Ic d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={16} />Jadikan kerawanan
          </button>
          <button type="button" role="menuitem" onClick={pick(onRestricted)}>
            <Ic d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" size={16} />Tandai terbatas
          </button>
          <div className="sep" role="separator"></div>
          <button type="button" role="menuitem" className="dz" onClick={pick(onCancel)}>
            <Ic d="M18 6 6 18M6 6l12 12" size={16} />Batalkan insiden
          </button>
        </div>
      )}
    </div>
  );
}

/** VS4: kerangka muat. */
export function ReviewSkeleton() {
  const sk = (h: number, k: number) => <span key={k} className="p-sk" style={{ height: h, borderRadius: 'var(--radius-md)' }}></span>;
  return (
    <ReviewShell statusTag={false} actions={null}>
      <div className="lk-grid" role="status" aria-label="Memuat">
        <div className="c7 lk-stack">
          <section className="p-card lk-stack-sm">{[18, 14, 14, 14, 14, 14, 14].map(sk)}</section>
          <section className="p-card lk-stack-sm">{[18, 48, 48].map(sk)}</section>
        </div>
        <aside className="c5">
          <section className="p-card lk-stack-sm">{[22, 40, 40, 44, 110, 40].map(sk)}</section>
        </aside>
      </div>
    </ReviewShell>
  );
}
