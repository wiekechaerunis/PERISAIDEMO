import { useEffect, useRef, useState } from 'react';
import { useWaSimUi } from '@/features/whatsapp/sim/WaSimPanel';
import { Link } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { Icon, type IconName } from '../ui/Icon';
import { useSidebar } from './sidebarState';
import { DEMO_USERS, initials, isSkk, type Role } from '@/lib/rbac';

/** Menu profil (demo): pilih peran dan reset data. Menggantikan bilah "Peran demo" yang melayang. */
function ProfileMenu({ role, mini }: { role: Role; mini: boolean }) {
  const user = DEMO_USERS[role];
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button type="button" className="p-uc" aria-haspopup="menu" aria-expanded={open} aria-label={`Menu akun ${user.name}`} onClick={() => setOpen(!open)}>
        <span className="p-avatar">{initials(user.name)}</span>
        {mini ? (
          <span className="tip">{user.name}</span>
        ) : (
          <>
            <span className="nm">
              <b>{user.name}</b>
              <span className="p-cap">{user.roleLabel}</span>
            </span>
            <Icon name="chevDown" size={16} style={{ color: 'var(--ink-muted)' }} />
          </>
        )}
      </button>
      {open && (
        <div className="p-pop" role="menu" aria-label="Ganti peran demo" style={{ position: 'absolute', left: 0, right: mini ? undefined : 0, width: mini ? 220 : undefined, bottom: 'calc(100% + 6px)', zIndex: 40, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="p-cap" style={{ padding: '4px 8px' }}>Peran demo</span>
          {(Object.keys(DEMO_USERS) as Role[]).map((r) => (
            <button
              key={r} type="button" role="menuitemradio" aria-checked={r === role} className={r === role ? 'p-opt on' : 'p-opt'}
              style={{ textAlign: 'left', border: 0, background: r === role ? 'var(--action-subtle-bg)' : 'none', font: 'inherit', padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => { setRole(r); setOpen(false); }}
            >
              <b style={{ fontSize: 13 }}>{DEMO_USERS[r].name}</b>
              <span className="p-cap">{DEMO_USERS[r].roleLabel}</span>
            </button>
          ))}
          <button type="button" role="menuitem" className="p-btn p-btn-secondary p-btn-sm" style={{ marginTop: 4 }} onClick={() => { useWaSimUi.getState().toggle(); setOpen(false); }}>Simulasi WhatsApp</button>
          <button type="button" role="menuitem" className="p-btn p-btn-secondary p-btn-sm" style={{ marginTop: 4 }} onClick={() => { resetDemo(); setOpen(false); }}>Reset data</button>
        </div>
      )}
    </div>
  );
}

export type NavKey = 'ikhtisar' | 'tugas' | 'tindak' | 'analitik' | 'insiden' | 'whatsapp' | 'pengaturan';


interface Props {
  active: NavKey;
  role: Role;
  taskCount: number;
}

function Item({ to, icon, label, on, count, mini }: { to: string; icon: IconName; label: string; on: boolean; count?: number; mini: boolean }) {
  return (
    <Link to={to} className={on ? 'nv on' : 'nv'} aria-current={on ? 'page' : undefined} aria-label={mini ? label : undefined} style={{ textDecoration: 'none' }}>
      <Icon name={icon} size={18} />
      {mini ? (
        <>
          {count ? <span className="dot" aria-hidden="true" /> : null}
          <span className="tip" aria-hidden="true">{label}{count ? <span className="p-count">{count}</span> : null}</span>
        </>
      ) : (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {count ? <span className="p-count">{count}</span> : null}
        </>
      )}
    </Link>
  );
}

/** Tombol .p-sbtoggle di bar atas tiap layar (termasuk shell modul lain) dihubungkan lewat delegasi klik,
 *  jadi semua shell ikut tanpa diubah satu per satu. Label dan aria-expanded diselaraskan setiap render. */
let wired = 0;
const onToggleClick = (e: MouseEvent) => {
  if ((e.target as Element | null)?.closest?.('.p-sbtoggle')) useSidebar.getState().toggle();
};
function useToggleWiring(mini: boolean) {
  useEffect(() => {
    // satu pendengar global walau Sidebar dirender lebih dari sekali (mis. Dashboard)
    if (wired++ === 0) document.addEventListener('click', onToggleClick);
    return () => { if (--wired === 0) document.removeEventListener('click', onToggleClick); };
  }, []);
  useEffect(() => {
    document.querySelectorAll('.p-sbtoggle').forEach((b) => {
      b.setAttribute('aria-expanded', String(!mini));
      b.setAttribute('aria-label', mini ? 'Lebarkan sidebar' : 'Perkecil sidebar');
      b.setAttribute('aria-controls', 'nav-utama');
    });
  });
}

/** Sidebar PERISAI (board Sidebar.dc.html): Ikhtisar, Tugas saya, Tindak lanjut | Analitik, Insiden | Administrasi. */
export function Sidebar({ active, role, taskCount }: Props) {
  const mini = useSidebar((s) => s.mini);
  useToggleWiring(mini);
  const lbl = (text: string, first: boolean) =>
    mini
      ? <span aria-hidden="true" style={{ display: 'block', width: 24, height: 1, background: 'var(--border-subtle)', margin: first ? '0 0 8px' : '12px 0 8px' }} />
      : <span className="p-lbl" style={{ padding: first ? '0 8px 6px 8px' : '14px 8px 6px 8px' }}>{text}</span>;
  return (
    <nav
      className={`p-sb ${mini ? 'mini' : 'wide'} p-wedge`}
      aria-label="Navigasi utama"
      id="nav-utama"
      style={{
        border: 0, borderRight: '1px solid var(--border)', borderRadius: 0, width: mini ? 72 : 240, flex: 'none',
        fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: '18px', color: 'var(--ink)',
      }}
    >
      <div className="p-col" style={{ gap: 14, padding: mini ? '0 0 16px' : '0 6px 16px 6px', width: mini ? 44 : undefined }}>
        {/* ASSUMPTION: logo PERISAI (/_blob) tidak ada di artifact; diganti wordmark teks (ciut: huruf P). */}
        <div style={{ width: mini ? 44 : 176, fontWeight: 700, fontSize: 22, letterSpacing: '.04em', textAlign: mini ? 'center' : undefined }} aria-label={mini ? 'PERISAI' : undefined}>{mini ? 'P' : 'PERISAI'}</div>
        <div className="idl" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="sb-search" style={{ padding: mini ? '0 0 10px' : '0 6px 10px 6px' }}>
        {mini ? (
          <span className="p-ibtn" role="button" tabIndex={0} aria-label="Cari (⌘K)">
            <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
            <span className="tip" aria-hidden="true">Cari <span className="k">⌘K</span></span>
          </span>
        ) : (
          <span className="p-input" role="button" tabIndex={0} aria-label="Cari (⌘K)">
            <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
            <span className="ph" style={{ flex: 1 }}>Cari…</span>
            <span className="k">⌘K</span>
          </span>
        )}
      </div>
      {lbl('Menu', true)}
      <Item to="/" icon="home" label="Ikhtisar" on={active === 'ikhtisar'} mini={mini} />
      <Item to="/tugas" icon="inbox" label="Tugas saya" on={active === 'tugas'} count={taskCount} mini={mini} />
      <Item to="/tindak-lanjut" icon="tasks" label="Tindak lanjut" on={active === 'tindak'} mini={mini} />
      {lbl('Security incident', false)}
      <Item to="/analitik" icon="chart" label="Analitik" on={active === 'analitik'} mini={mini} />
      <Item to="/insiden" icon="alert" label="Insiden" on={active === 'insiden'} mini={mini} />
      {!isSkk(role) && <Item to="/pemantauan-whatsapp" icon="whatsapp" label="Pemantauan WhatsApp" on={active === 'whatsapp'} mini={mini} />}
      {role === 'admin' && (
        <>
          {lbl('Administrasi', false)}
          <Item to="/konfigurasi" icon="settings" label="Konfigurasi Modul" on={active === 'pengaturan'} mini={mini} />
        </>
      )}
      <div className="sb-user">
        <ProfileMenu role={role} mini={mini} />
      </div>
      {!mini && (
        <div className="ft">
          <span>© 2026 SKK Migas.<br />Hak cipta dilindungi. v1.0.0</span>
        </div>
      )}
    </nav>
  );
}
