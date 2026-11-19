import { useEffect, useRef, useState } from 'react';
import { useWaSimUi } from '@/features/whatsapp/sim/WaSimPanel';
import { Link } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { Icon, type IconName } from '../ui/Icon';
import { DEMO_USERS, initials, isSkk, type Role } from '@/lib/rbac';

/** Menu profil (demo): pilih peran dan reset data. Menggantikan bilah "Peran demo" yang melayang. */
function ProfileMenu({ role }: { role: Role }) {
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
        <span className="nm">
          <b>{user.name}</b>
          <span className="p-cap">{user.roleLabel}</span>
        </span>
        <Icon name="chevDown" size={16} style={{ color: 'var(--ink-muted)' }} />
      </button>
      {open && (
        <div className="p-pop" role="menu" aria-label="Ganti peran demo" style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)', zIndex: 40, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

function Item({ to, icon, label, on, count }: { to: string; icon: IconName; label: string; on: boolean; count?: number }) {
  return (
    <Link to={to} className={on ? 'nv on' : 'nv'} aria-current={on ? 'page' : undefined} style={{ textDecoration: 'none' }}>
      <Icon name={icon} size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {count ? <span className="p-count">{count}</span> : null}
    </Link>
  );
}

/** Sidebar PERISAI (board Sidebar.dc.html): Ikhtisar, Tugas saya, Tindak lanjut | Analitik, Insiden | Administrasi. */
export function Sidebar({ active, role, taskCount }: Props) {
  return (
    <nav
      className="p-sb wide p-wedge"
      aria-label="Navigasi utama"
      id="nav-utama"
      style={{
        border: 0, borderRight: '1px solid var(--border)', borderRadius: 0, width: 240, flex: 'none',
        fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: '18px', color: 'var(--ink)',
      }}
    >
      <div className="p-col" style={{ gap: 14, padding: '0 6px 16px 6px' }}>
        {/* ASSUMPTION: logo PERISAI (/_blob) tidak ada di artifact; diganti wordmark teks. */}
        <div style={{ width: 176, fontWeight: 700, fontSize: 22, letterSpacing: '.04em' }}>PERISAI</div>
        <div className="idl" aria-hidden="true">
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="sb-search" style={{ padding: '0 6px 10px 6px' }}>
        <span className="p-input" role="button" tabIndex={0} aria-label="Cari (⌘K)">
          <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
          <span className="ph" style={{ flex: 1 }}>Cari…</span>
          <span className="k">⌘K</span>
        </span>
      </div>
      <span className="p-lbl" style={{ padding: '0 8px 6px 8px' }}>Menu</span>
      <Item to="/" icon="home" label="Ikhtisar" on={active === 'ikhtisar'} />
      <Item to="/tugas" icon="inbox" label="Tugas saya" on={active === 'tugas'} count={taskCount} />
      <Item to="/tindak-lanjut" icon="tasks" label="Tindak lanjut" on={active === 'tindak'} />
      <span className="p-lbl" style={{ padding: '14px 8px 6px 8px' }}>Security incident</span>
      <Item to="/analitik" icon="chart" label="Analitik" on={active === 'analitik'} />
      <Item to="/insiden" icon="alert" label="Insiden" on={active === 'insiden'} />
      {!isSkk(role) && <Item to="/pemantauan-whatsapp" icon="whatsapp" label="Pemantauan WhatsApp" on={active === 'whatsapp'} />}
      {role === 'admin' && (
        <>
          <span className="p-lbl" style={{ padding: '14px 8px 6px 8px' }}>Administrasi</span>
          <Item to="/konfigurasi" icon="settings" label="Konfigurasi Modul" on={active === 'pengaturan'} />
        </>
      )}
      <div className="sb-user">
        <ProfileMenu role={role} />
      </div>
      <div className="ft">
        <span>© 2026 SKK Migas.<br />Hak cipta dilindungi. v1.0.0</span>
      </div>
    </nav>
  );
}
