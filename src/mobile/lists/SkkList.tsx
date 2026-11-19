// Board M12 (SKK): tanpa FAB; chip Filter · 1 = hanya yang belum diperiksa.
import { useState } from 'react';
import type { Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { FilterRow, IncidentCard, ListShell, Meta, SevTag, StatusTag, Tabs, shortWhen, firstSeg } from './parts';

export function SkkList({ base, role, krwCount }: { base: Incident[]; role: Role; krwCount: number }) {
  const [unv, setUnv] = useState(true);
  const rows = base.filter((r) => !unv || r.status === 'review-internal');
  const countText = unv ? `${rows.length} belum diperiksa` : `${rows.length} insiden`;
  return (
    <ListShell>
      <Tabs active="insiden" insCount={base.length} krwCount={krwCount} />
      <FilterRow n={unv ? 1 : 0} onClick={() => setUnv(!unv)} count={countText} />
      {rows.map((r) => (
        <IncidentCard
          key={r.no}
          i={r}
          kkks
          tags={
            <>
              <SevTag i={r} />
              <StatusTag i={r} role={role} />
            </>
          }
          meta={<Meta>{firstSeg(r.location)} · {shortWhen(r.occurredAt)}</Meta>}
        />
      ))}
      <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)' }}>{countText}</span>
    </ListShell>
  );
}
