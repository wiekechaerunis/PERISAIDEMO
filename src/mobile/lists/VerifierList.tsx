// Board MV1 (Pejabat): Filter · 1 = menunggu pemeriksaan; kartu dengan batas pemeriksaan; FAB.
import { useState } from 'react';
import { verifyIndicator } from '@/features/insiden/logic/list';
import type { Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { ClockIc, FilterRow, IncidentCard, ListShell, Meta, ReportFab, SevTag, StatusTag, Tabs, firstSeg, shortWhen } from './parts';

export function VerifierList({ base, role, krwCount }: { base: Incident[]; role: Role; krwCount: number }) {
  const [wait, setWait] = useState(true);
  const rows = base.filter((r) => !wait || r.status === 'review-internal');
  return (
    <ListShell fab={<ReportFab />}>
      <Tabs active="insiden" insCount={base.length} krwCount={krwCount} />
      <FilterRow n={wait ? 1 : 0} onClick={() => setWait(!wait)} count={wait ? `${rows.length} menunggu pemeriksaan` : `${rows.length} insiden`} />
      {rows.map((r) => {
        const waiting = r.status === 'review-internal' && r.verifyDueAt;
        const ind = waiting ? verifyIndicator(r.verifyDueAt!) : null;
        return (
          <IncidentCard
            key={r.no}
            i={r}
            tags={
              <>
                <SevTag i={r} suffix={waiting ? ' · awal' : undefined} />
                <StatusTag i={r} role={role} />
              </>
            }
            meta={
              ind?.late ? (
                <span className="lk-dl" style={{ fontSize: 12 }}>
                  <ClockIc />
                  Lewat batas · {ind.text.replace(/^Lewat /, '')}
                </span>
              ) : ind ? (
                <Meta>Batas {shortWhen(r.verifyDueAt!)} · {ind.text}</Meta>
              ) : (
                <Meta>{firstSeg(r.location)} · {shortWhen(r.occurredAt)}</Meta>
              )
            }
          />
        );
      })}
    </ListShell>
  );
}
