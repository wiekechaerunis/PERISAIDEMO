// Analitik = Dashboard insiden (desain design/dashboard/Dashboard.dc.html, PRD docs/dashboard/PRD-Prototype-Dashboard-Insiden.md).
// Menggantikan halaman Analitik lama. Peran SKK/KKKS mengikuti peran demo aplikasi (RoleSwitcher).
// Query opsional: zoom=nat|sbs|sbu|pst|jbn|loc, dtt=1, unduh=1, status=0..3.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { isSkk } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';

const ZOOMS = ['nat', 'sbs', 'sbu', 'pst', 'jbn', 'loc'] as const;

export function AnalitikPage() {
  const role = useDemoStore((s) => s.role);
  const [sp] = useSearchParams();
  const peran = isSkk(role) ? 'skk' : 'kkks';
  const z = sp.get('zoom') as (typeof ZOOMS)[number] | null;
  const props = {
    peran,
    zoom: z && ZOOMS.includes(z) ? z : undefined,
    dtt: sp.get('dtt') === '1',
    menuUnduh: sp.get('unduh') === '1',
    statusTerbuka: sp.get('status') ?? '',
  } as const;

  // Esc menutup popover Level dan menu Unduh: memicu klik-di-luar yang sudah menutupnya di logika desain.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Dashboard key={`${peran}-${props.zoom ?? ''}-${props.dtt}-${props.menuUnduh}-${props.statusTerbuka}`} {...props} />
      <RoleSwitcher />
    </>
  );
}
