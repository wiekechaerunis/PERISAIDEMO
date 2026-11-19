import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

/** Tombol "Buat laporan" mengambang (board M1). `mini` = hanya ikon saat menggulir. */
export function Fab({ to, label = 'Buat laporan', mini }: { to: string; label?: string; mini?: boolean }) {
  return (
    <Link to={to} className={'p-btn p-btn-primary p-fab' + (mini ? ' mini' : '')} aria-label={label}>
      <Icon name="plus" size={20} />
      <span className="lbl">{label}</span>
    </Link>
  );
}
