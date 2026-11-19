// Board MP1 (PIC): pintasan Semua / Ditangani saya / Lewat tenggat / Dieskalasi, tanpa FAB.
import { useState } from 'react';
import { dueIndicator, quickFilters } from '@/features/insiden/logic/list';
import type { Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { ClockIc, IncidentCard, ListShell, Meta, SevTag, StatusTag, Tabs, firstSeg } from './parts';

export function PicList({ base, role, krwCount }: { base: Incident[]; role: Role; krwCount: number }) {
  const mine = quickFilters(role);
  const boss = quickFilters('pejabat');
  const defs = [mine.find((d) => d.key === 'all')!, mine.find((d) => d.key === 'pic')!, boss.find((d) => d.key === 'late')!, boss.find((d) => d.key === 'esc')!];
  const [q, setQ] = useState('pic');
  const cur = defs.find((d) => d.key === q) ?? defs[0];
  const far = '9999';
  const rows = base.filter(cur.test).sort((a, b) => (a.handleDueAt ?? far).localeCompare(b.handleDueAt ?? far));
  const caption = q === 'pic' ? `${rows.length} insiden yang Anda tangani · tenggat terdekat dulu` : `${rows.length} insiden`;
  return (
    <ListShell>
      <Tabs active="insiden" insCount={base.length} krwCount={krwCount} />
      <div className="chipscroll">
        {defs.map((d) => {
          const n = d.key === 'all' ? 0 : base.filter(d.test).length;
          return (
            <button key={d.key} type="button" className="p-chip" aria-pressed={q === d.key} onClick={() => setQ(d.key)}>
              {d.label}
              {n > 0 ? ` · ${n}` : ''}
            </button>
          );
        })}
      </div>
      <span className="p-cap">{caption}</span>
      {rows.map((r) => {
        const active = (r.status === 'dalam-penanganan' || r.status === 'minta-ditutup') && r.handleDueAt;
        const ind = active ? dueIndicator(r.handleDueAt!) : null;
        return (
          <IncidentCard
            key={r.no}
            i={r}
            tags={
              <>
                <SevTag i={r} />
                <StatusTag i={r} role={role} />
                {ind && (
                  <span className={ind.cls}>
                    <ClockIc />
                    {ind.text}
                  </span>
                )}
              </>
            }
            meta={<Meta>{r.pic ? `PIC ${r.pic}` : 'Belum ada PIC'} · {firstSeg(r.area)}</Meta>}
          />
        );
      })}
    </ListShell>
  );
}
