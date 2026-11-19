// Board: Main, Main-Filter (Pelapor), V11/P21 (Pejabat), P11 (PIC), I31 (SKK), S08–S12 (state daftar) — FR-INS-14, 15
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL } from '@/lib/severity';
import { STATUS_LABEL, type Incident } from '@/services/types';
import { defaultQuick, listLayout, quickFilters, taskCount, visibleIncidents } from '../logic/list';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { KerawananTable } from '../components/KerawananTable';
import { IncidentTable } from '../components/list/IncidentTable';
import { EMPTY_FILTERS, FilterPopover, type FilterKey, type Filters } from '../components/list/FilterPopover';
import { EmptyCard, FailedCard, LimitedPage, LoadingCard } from '../components/list/ListStates';

const SUBTITLE = {
  insiden: 'Kejadian yang sudah terjadi dan menimbulkan kerugian, korban, atau gangguan operasi.',
  kkks: 'Laporan insiden organisasi Anda',
  skk: 'Insiden di KKKS dalam cakupan Anda.',
  kerawanan: 'Kerawanan: kondisi atau kejadian yang berpotensi menjadi insiden, tanpa kerugian atau korban.',
};

type ListState = 'memuat' | 'kosong' | 'filter-kosong' | 'gagal' | 'terbatas';
const STATES: ListState[] = ['memuat', 'kosong', 'filter-kosong', 'gagal', 'terbatas'];

/** Halaman daftar. `?state=memuat|kosong|filter-kosong|gagal|terbatas` menampilkan state S08–S12. */
export function IncidentListPage() {
  const [params] = useSearchParams();
  const raw = params.get('state');
  const state = STATES.find((s) => s === raw) ?? null;
  return <ListBody key={state ?? ''} state={state} />;
}

function ListBody({ state }: { state: ListState | null }) {
  const role = useDemoStore((s) => s.role);
  const allIncidents = useDemoStore((s) => s.incidents);
  const followUps = useFollowUps();
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'kerawanan' ? 'kerawanan' : 'insiden';
  const me = DEMO_USERS[role].name;
  const isSkkRole = DEMO_USERS[role].org === 'skk';

  const [qState, setQState] = useState<{ role: string; key: string } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  // S10: contoh pencarian "kebakaran" + Keparahan: Kritis + Status: Ditutup
  const [f, setF] = useState<Filters>(state === 'filter-kosong' ? { ...EMPTY_FILTERS, sev: ['kritis'], st: ['ditutup'] } : EMPTY_FILTERS);
  const [search, setSearch] = useState(state === 'filter-kosong' ? 'kebakaran' : '');

  const base = useMemo(() => visibleIncidents(allIncidents, role), [allIncidents, role]);
  const quicks = quickFilters(role);
  const q = qState && qState.role === role && quicks.some((d) => d.key === qState.key) ? qState.key : defaultQuick(role);
  const quick = quicks.find((d) => d.key === q) ?? quicks[0];
  const layout = listLayout(role, base);

  const picMatch = (r: Incident) =>
    f.pic.length === 0 ||
    f.pic.some((p) => (p === 'Saya' ? r.pic === me : p === 'Belum ada PIC' ? r.pic === null : r.pic === p));
  const flagMatch = (r: Incident) =>
    f.flags.every((x) => (x === 'Lewat tenggat' ? r.late : x === 'Dieskalasi' ? r.escalated : r.possibleDuplicate));
  const text = search.trim().toLowerCase();
  const rows = base.filter(
    (r) =>
      quick.test(r) &&
      (f.sev.length === 0 || (r.severity !== null && f.sev.includes(r.severity))) &&
      (f.st.length === 0 || f.st.includes(r.status)) &&
      (f.kat.length === 0 || f.kat.includes(r.category)) &&
      picMatch(r) &&
      flagMatch(r) &&
      (!text || [r.no, r.title, r.category, r.location, r.area, r.org].some((x) => x.toLowerCase().includes(text))),
  );

  const toggle = (key: FilterKey, v: string) =>
    setF((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));
  const applied = [
    ...f.pic.map((l) => ({ label: 'PIC: ' + l, key: 'pic' as FilterKey, v: l })),
    ...f.st.map((l) => ({ label: 'Status: ' + STATUS_LABEL[l as Incident['status']], key: 'st' as FilterKey, v: l })),
    ...f.sev.map((l) => ({ label: 'Keparahan: ' + SEV_LABEL[l as keyof typeof SEV_LABEL], key: 'sev' as FilterKey, v: l })),
    ...f.flags.map((l) => ({ label: l, key: 'flags' as FilterKey, v: l })),
    ...f.kat.map((l) => ({ label: 'Kategori: ' + l, key: 'kat' as FilterKey, v: l })),
  ];
  const clearAll = () => {
    setF(EMPTY_FILTERS);
    setQState({ role, key: 'all' });
    setSearch('');
    setFilterOpen(false);
  };
  const retry = () => setParams({}, { replace: true });

  const tasks = taskCount(allIncidents, role, followUps);
  if (state === 'terbatas') return <LimitedPage role={role} taskCount={tasks} />;

  const subtitle = isSkkRole ? SUBTITLE.skk : role === 'pelapor' ? SUBTITLE.insiden : SUBTITLE.kkks;
  const tabs = [
    { to: '/insiden', label: 'Insiden', count: base.length, on: tab === 'insiden' },
    { to: '/insiden?tab=kerawanan', label: 'Kerawanan', count: kerawanan.length, on: tab === 'kerawanan' },
  ];

  // S08, S09, S11: header tanpa tab; S09 tanpa tombol di header (tombol ada di isi)
  if (state === 'memuat' || state === 'kosong' || state === 'gagal') {
    return (
      <AppShell
        nav="insiden"
        title="Insiden"
        subtitle={isSkkRole ? SUBTITLE.skk : SUBTITLE.insiden}
        action={state === 'kosong' ? undefined : { to: '/insiden/baru/temuan', label: 'Buat laporan' }}
      >
        {state === 'memuat' ? <LoadingCard /> : state === 'kosong' ? <EmptyCard role={role} /> : <FailedCard onRetry={retry} />}
      </AppShell>
    );
  }

  const staticTitle = role === 'pejabat' || role === 'pic' || role === 'pic-tl';
  const listTitle = staticTitle ? 'Insiden' : q === 'all' ? 'Semua insiden' : quick.label;
  const hasFilter = applied.length > 0 || text !== '';
  const emptyTxt =
    q === 'act'
      ? 'Tidak ada yang perlu Anda tindak lanjuti.'
      : q === 'pic'
        ? 'Tidak ada insiden yang Anda tangani.'
        : 'Tidak ada insiden yang cocok dengan filter.';
  const placeholder = isSkkRole ? 'Cari nomor, judul, atau KKKS' : 'Cari nomor, judul, atau patokan';
  const nothingAtAll = base.length === 0;

  return (
    <AppShell
      nav="insiden"
      title="Insiden"
      subtitle={tab === 'kerawanan' ? SUBTITLE.kerawanan : subtitle}
      tabs={tabs}
      tabsLabel="Insiden dan kerawanan"
      action={tab === 'kerawanan' ? { to: '/insiden/baru/temuan', label: 'Catat kerawanan' } : { to: '/insiden/baru/temuan', label: 'Buat laporan' }}
    >
      {tab === 'kerawanan' ? (
        <KerawananTable />
      ) : nothingAtAll ? (
        <EmptyCard role={role} />
      ) : (
        <section className="p-card" style={{ padding: 0, overflow: 'visible' }}>
          <div className="p-toolbar" style={{ justifyContent: 'space-between' }}>
            <h2 className="p-h2">{listTitle}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
              <label className="p-input" style={{ width: layout === 'pelapor' ? 300 : 280, height: 36 }}>
                <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
                <input
                  className="ph"
                  aria-label={placeholder}
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit' }}
                />
              </label>
              <button
                type="button"
                className="p-btn p-btn-secondary p-btn-sm"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Icon name="filter" size={16} />
                Filter
                {applied.length > 0 && (
                  <span className="p-count" style={{ background: 'var(--action)', color: 'var(--on-action)' }}>
                    {applied.length}
                  </span>
                )}
              </button>
              {filterOpen && (
                <FilterPopover
                  f={f}
                  count={applied.length}
                  rowCount={rows.length}
                  toggle={toggle}
                  onClear={clearAll}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </div>
          </div>
          <div className="lk-quick">
            <div className="p-qf" role="radiogroup" aria-label="Pintasan">
              {quicks.map((d) => {
                const n = d.key === 'all' ? null : base.filter(d.test).length;
                return (
                  <button key={d.key} type="button" role="radio" aria-checked={q === d.key} onClick={() => setQState({ role, key: d.key })}>
                    {d.label}
                    {n !== null && <span className="c">{n}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {applied.length > 0 && (
            <div className="lk-applied">
              {applied.map((a) => (
                <button key={a.key + a.v} type="button" className="p-chip" aria-pressed="true" onClick={() => toggle(a.key, a.v)}>
                  {a.label}
                  <Icon name="close" size={14} />
                </button>
              ))}
              <button type="button" className="p-link" onClick={clearAll}>
                Hapus semua
              </button>
            </div>
          )}
          {rows.length > 0 ? (
            <>
              <IncidentTable rows={rows} layout={layout} role={role} me={me} showAction={layout === 'pelapor' && (q === 'act' || q === 'all')} />
              {layout === 'pelapor' ? (
                <div
                  className="p-pager"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
                    borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--ink-muted)',
                  }}
                >
                  <span>
                    {rows.length} dari {base.length} insiden
                  </span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    <span className="p-pg on" aria-current="page">
                      1
                    </span>
                  </span>
                </div>
              ) : layout === 'skk' ? (
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
                    borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--ink-muted)',
                  }}
                >
                  <span>{rows.length} insiden</span>
                  <span className="p-pg on" aria-current="page">
                    1
                  </span>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--ink-muted)' }}>
                  {rows.length} insiden
                </div>
              )}
            </>
          ) : (
            <div className="lk-es">
              <svg className="il" viewBox="0 0 96 72" width="96" height="72" aria-hidden="true">
                <rect className="pa ln" x="16" y="10" width="52" height="52" rx="6" />
                <path className="ln" d="M28 26h28M28 36h20" />
                <circle className="ac ln" cx="68" cy="50" r="12" />
                <path className="ln" d="M64 50h8" />
              </svg>
              <b>{emptyTxt}</b>
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={clearAll}>
                {hasFilter ? 'Hapus filter' : 'Lihat semua insiden'}
              </button>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
