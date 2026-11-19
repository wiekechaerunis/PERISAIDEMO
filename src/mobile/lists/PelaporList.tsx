// Board M1 (Pelapor): tab, chip Filter + hitungan, kartu, "Muat lebih banyak", FAB, sheet Filter, MS10 bila hasil kosong.
import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { SEV_LABEL, SEVERITIES, type Severity } from '@/lib/severity';
import { KATEGORI_OPTIONS } from '@/features/insiden/logic/list';
import type { Incident } from '@/services/types';
import type { Role } from '@/lib/rbac';
import { FilterChip, FilterEmptyBody, IncidentCard, ListShell, Meta, ReportFab, SevTag, StatusTag, Tabs, shortWhen, firstSeg, useScrolled } from './parts';

interface F {
  st: 'all' | 'open' | 'closed';
  sv: Severity | 'all';
  kt: string;
}
const NONE: F = { st: 'all', sv: 'all', kt: 'all' };
const ST: [F['st'], string][] = [['all', 'Semua'], ['open', 'Masih berjalan'], ['closed', 'Ditutup']];
const SV: [F['sv'], string][] = [['all', 'Semua'], ...[...SEVERITIES].reverse().map((s): [Severity, string] => [s, SEV_LABEL[s]])];
const KT: [string, string][] = [['all', 'Semua'], ...KATEGORI_OPTIONS.map((k): [string, string] => [k, k])];

const match = (rows: Incident[], f: F) =>
  rows.filter(
    (r) =>
      (f.st === 'all' || (f.st === 'open' ? r.status !== 'ditutup' : r.status === 'ditutup')) &&
      (f.sv === 'all' || r.severity === f.sv) &&
      (f.kt === 'all' || r.category === f.kt),
  );
const countOf = (f: F) => (f.st !== 'all' ? 1 : 0) + (f.sv !== 'all' ? 1 : 0) + (f.kt !== 'all' ? 1 : 0);

function Chips<T extends string>({ opts, value, onPick }: { opts: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="in-chips" style={{ flexWrap: 'wrap' }}>
      {opts.map(([k, l]) => (
        <button key={k} type="button" className="p-chip" aria-pressed={value === k} onClick={() => onPick(k)} style={{ minHeight: 44 }}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function PelaporList({ base, role, krwCount }: { base: Incident[]; role: Role; krwCount: number }) {
  const [f, setF] = useState<F>(NONE);
  const [draft, setDraft] = useState<F>(NONE);
  const [sheet, setSheet] = useState(false);
  const scrolled = useScrolled();
  const rows = match(base, f);
  const n = countOf(f);
  const open = () => {
    setDraft(f);
    setSheet(true);
  };
  const desc = [f.sv !== 'all' && `Keparahan ${SEV_LABEL[f.sv as Severity]}`, f.st !== 'all' && `Status ${ST.find((x) => x[0] === f.st)![1]}`, f.kt !== 'all' && `Kategori ${f.kt}`]
    .filter(Boolean)
    .join(', ');

  return (
    <ListShell
      fab={<ReportFab mini={scrolled} />}
      overlay={
        sheet && (
          <BottomSheet
            title="Filter"
            onClose={() => setSheet(false)}
            footerRow
            footer={
              <>
                <button type="button" className="p-btn p-btn-secondary" onClick={() => setDraft(NONE)} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
                  Atur ulang
                </button>
                <button
                  type="button"
                  className="p-btn p-btn-primary"
                  onClick={() => {
                    setF(draft);
                    setSheet(false);
                  }}
                  style={{ flex: 2, minHeight: 44, justifyContent: 'center' }}
                >
                  Tampilkan {match(base, draft).length} insiden
                </button>
              </>
            }
          >
            <div className="ml-fields">
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Status</span>
                <Chips opts={ST} value={draft.st} onPick={(st) => setDraft({ ...draft, st })} />
              </div>
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Keparahan</span>
                <Chips opts={SV} value={draft.sv} onPick={(sv) => setDraft({ ...draft, sv })} />
              </div>
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kategori</span>
                <Chips opts={KT} value={draft.kt} onPick={(kt) => setDraft({ ...draft, kt })} />
              </div>
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Periode kejadian</span>
                <span className="p-input">
                  <span style={{ flex: 1 }}>30 hari terakhir</span>
                  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </div>
            </div>
          </BottomSheet>
        )
      }
    >
      <Tabs active="insiden" insCount={base.length} krwCount={krwCount} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <FilterChip n={n} onClick={open} />
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          {rows.length} dari {base.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <FilterEmptyBody desc={desc ? `Filter aktif: ${desc}.` : undefined} onClear={() => setF(NONE)} />
      ) : (
        <>
          {rows.map((r) => (
            <IncidentCard
              key={r.no}
              i={r}
              tags={
                <>
                  <SevTag i={r} />
                  <StatusTag i={r} role={role} />
                </>
              }
              meta={<Meta>{firstSeg(r.location)} · {shortWhen(r.occurredAt)}</Meta>}
            />
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)' }}>
            <button type="button" className="lk-alink" style={{ border: 0, background: 'none', padding: 0, minHeight: 44, font: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Muat lebih banyak
            </button>
          </div>
        </>
      )}
    </ListShell>
  );
}
