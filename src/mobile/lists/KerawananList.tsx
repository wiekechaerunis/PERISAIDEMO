// Board MK1 (tab Kerawanan): kartu ke /kerawanan/{no}, FAB bila peran boleh membuat laporan.
import { Link } from 'react-router-dom';
import { formatWib } from '@/lib/format';
import { KERAWANAN_BOARD } from '@/services/mock/seedExtra';
import { resolveKerawanan } from '@/services/mock/workflow.kerawanan';
import type { Kerawanan } from '@/services/types';
import { ListShell, ReportFab, Tabs } from './parts';

export function KerawananList({ items, insCount, canCreate }: { items: Kerawanan[]; insCount: number; canCreate: boolean }) {
  const rows = items.map(resolveKerawanan).sort((a, b) => b.no.localeCompare(a.no));
  return (
    <ListShell fab={canCreate ? <ReportFab /> : undefined}>
      <Tabs active="kerawanan" insCount={insCount} krwCount={items.length} />
      <p className="p-cap" style={{ margin: 0, color: 'var(--ink-muted)' }}>
        Kerawanan tercatat tanpa pemeriksaan dan tidak dihitung sebagai insiden.
      </p>
      {rows.map((k) => (
        <Link key={k.no} to={`/kerawanan/${k.no}`} className="card" style={{ textDecoration: 'none', color: 'inherit', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 14, lineHeight: '20px' }}>{k.title}</b>
            <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              {k.no}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="p-tag t-neutral">{k.kind}</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {KERAWANAN_BOARD[k.no]?.loc ?? k.location} · {formatWib(k.observedAt)} <span className="p-tz">WIB</span>
          </span>
        </Link>
      ))}
    </ListShell>
  );
}
