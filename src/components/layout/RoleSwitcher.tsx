import { useState } from 'react';
import { DEMO_USERS, type Role } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { useIsMobile } from '@/mobile/useIsMobile';

/** Hanya demo: ganti peran dan reset data. Di desktop pemilih peran ada di menu profil Sidebar; di mobile berupa tombol kecil yang membuka panel. */
export function RoleSwitcher() {
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!mobile) return null;
  if (!open) {
    return (
      <button type="button" className="demo-roles demo-roles-fab" aria-label="Peran demo" onClick={() => setOpen(true)}>
        Demo
      </button>
    );
  }
  return (
    <div className="demo-roles" role="group" aria-label="Demo: ganti peran">
      <label htmlFor="demo-role">Peran demo</label>
      <select id="demo-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        {(Object.keys(DEMO_USERS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {DEMO_USERS[r].roleLabel}
            {DEMO_USERS[r].name !== DEMO_USERS[r].roleLabel ? ` · ${DEMO_USERS[r].name}` : ''}
          </option>
        ))}
      </select>
      <button type="button" onClick={resetDemo}>Reset data</button>
      {mobile && (
        <button type="button" aria-label="Tutup panel demo" onClick={() => setOpen(false)}>
          Tutup
        </button>
      )}
    </div>
  );
}
