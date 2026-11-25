// Board: Kerawanan (K.1) — daftar Kerawanan, pintasan Semua / Laporan saya / Makin rawan.
// Filter: hanya Periode kejadian yang berfungsi (berbagi URL dengan tab Insiden); lihat DEVIATIONS.md D-P6.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { formatWib } from '@/lib/format';
import { KERAWANAN_BOARD } from '@/services/mock/seedExtra';
import type { Kerawanan } from '@/services/types';
import { useDismiss } from '@/components/ui/useDismiss';
import { ALL_TIME, draftToPeriod, inRange, isAllTime, kerawananWhen, listPeriodLabel, periodToDraft, rangeOf, type PeriodDraft } from '../logic/period';
import { usePeriod } from '../logic/usePeriod';
import { PeriodField } from './list/PeriodField';

interface Row {
  k: Kerawanan;
  title: string;
  kind: string;
  loc: string;
  when: string;
  ago: string;
  rep: string;
  src: string;
  mr: boolean;
}

/** Gabungkan data store dengan tampilan board (jenis, sumber, "3 jam lalu"); kerawanan baru dari store memakai nilai bawaan. */
function toRow(k: Kerawanan): Row {
  const b = KERAWANAN_BOARD[k.no];
  return {
    k,
    title: b?.title ?? k.title,
    kind: b?.kind ?? k.category,
    loc: b?.loc ?? k.location,
    when: b?.when ?? formatWib(k.observedAt),
    ago: b?.ago ?? '',
    rep: b?.rep ?? k.reporter,
    src: b?.src ?? '—',
    mr: !!(b?.worsening ?? k.worsening),
  };
}

export function KerawananTable() {
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const role = useDemoStore((s) => s.role);
  const me = DEMO_USERS[role].name;
  const [q, setQ] = useState('all');
  const { period, now, today, setPeriod } = usePeriod();
  const [draft, setDraft] = useState<PeriodDraft>(() => periodToDraft(period));
  const [filterOpen, setFilterOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  useDismiss(filterOpen, popRef, () => setFilterOpen(false));

  const total = kerawanan.map(toRow).sort((a, b) => b.k.no.localeCompare(a.k.no));
  const range = rangeOf(period, now);
  const all = total.filter((r) => inRange(kerawananWhen(r.k), range));
  const draftPeriod = draftToPeriod(draft, today);
  const draftRange = draftPeriod ? rangeOf(draftPeriod, now) : range;
  const periodOn = !isAllTime(period);
  const clearPeriod = () => {
    setPeriod(ALL_TIME);
    setDraft(periodToDraft(ALL_TIME));
    setFilterOpen(false);
  };
  const defs: [string, string, (r: Row) => boolean][] = [
    ['all', 'Semua', () => true],
    ['mine', 'Laporan saya', (r) => r.rep === me],
    ['mr', 'Makin rawan', (r) => r.mr],
  ];
  const cur = defs.find((d) => d[0] === q) ?? defs[0];
  const rows = all.filter(cur[2]);
  const previewCount = total.filter((r) => inRange(kerawananWhen(r.k), draftRange) && cur[2](r)).length;

  return (
    <>
      <p className="p-cap" style={{ margin: '0 4px 12px' }}>
        Kerawanan tercatat tanpa pemeriksaan dan tidak dihitung sebagai insiden.
      </p>
      <div
        className="in-bn info"
        role="status"
        style={{ padding: '8px 12px', fontSize: 13, lineHeight: '18px', marginBottom: 12, alignItems: 'center' }}
      >
        <Icon name="info" size={16} />
        <div className="body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flex: 1 }}>
          <span>
            <b>
              Ringkasan pagi ini (17 Nov 07:00–18 Nov 07:00 <span className="p-tz">WIB</span>):
            </b>{' '}
            6 kerawanan baru · 1 upaya digagalkan · Sumur ADR-07 berulang
          </span>
          <Link to="/kerawanan/ringkasan" className="lk-alink" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            Lihat ringkasan
          </Link>
        </div>
      </div>
      <section className="p-card" style={{ padding: 0, overflow: 'visible' }}>
        <div className="p-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 className="p-h2">{q === 'all' ? 'Semua kerawanan' : cur[1]}</h2>
          <div ref={popRef} style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
            <label className="p-input" style={{ width: 300, height: 36 }}>
              <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
              <span className="ph">Cari nomor, judul, atau patokan</span>
            </label>
            <button
              type="button"
              className="p-btn p-btn-secondary p-btn-sm"
              aria-expanded={filterOpen}
              onClick={() => {
                if (!filterOpen) setDraft(periodToDraft(period));
                setFilterOpen(!filterOpen);
              }}
            >
              <Icon name="filter" size={16} />
              Filter
              {periodOn && (
                <span className="p-count" style={{ background: 'var(--action)', color: 'var(--on-action)' }}>
                  1
                </span>
              )}
            </button>
            {filterOpen && (
              <div className="p-pop ls-pop" role="dialog" aria-label="Filter kerawanan">
                <div style={{ padding: '14px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 15 }}>Filter</b>
                  <span className="p-cap">{draft.choice !== 'all' ? '1 filter aktif' : 'Belum ada filter'}</span>
                </div>
                <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <PeriodField draft={draft} onChange={setDraft} now={now} />
                </div>
                <div className="p-foot">
                  <button type="button" className="p-link" onClick={clearPeriod}>
                    Hapus filter
                  </button>
                  <button
                    type="button"
                    className="p-btn p-btn-primary p-btn-sm"
                    disabled={!draftPeriod || previewCount === 0}
                    onClick={() => {
                      if (draftPeriod) setPeriod(draftPeriod);
                      setFilterOpen(false);
                    }}
                  >
                    {!draftPeriod ? 'Tampilkan kerawanan' : previewCount === 0 ? 'Tidak ada kerawanan' : `Tampilkan ${previewCount} kerawanan`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lk-quick">
          <div className="p-qf" role="radiogroup" aria-label="Pintasan">
            {defs.map(([k, label, test]) => (
              <button key={k} type="button" role="radio" aria-checked={q === k} onClick={() => setQ(k)}>
                {label}
                <span className="c">{all.filter(test).length}</span>
              </button>
            ))}
          </div>
        </div>
        {periodOn && (
          <div className="lk-applied">
            <button type="button" className="p-chip" aria-pressed="true" aria-label={`Hapus filter Periode: ${listPeriodLabel(period)}`} onClick={clearPeriod}>
              Periode: {listPeriodLabel(period)}
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="p-table lk-tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Kerawanan</th>
                <th>Jenis · lokasi</th>
                <th>Waktu diketahui</th>
                <th>Dilaporkan oleh</th>
                <th style={{ paddingRight: 16 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    {periodOn ? 'Tidak ada kerawanan pada periode ini.' : 'Tidak ada kerawanan.'}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.k.no}>
                  <td style={{ paddingLeft: 16 }}>
                    <Link className="ttl" to={`/kerawanan/${r.k.no}`}>
                      {r.title}
                    </Link>
                    <span className="id">{r.k.no}</span>
                  </td>
                  <td>
                    {r.kind}
                    <div className="sub">{r.loc}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.when} <span className="p-tz">WIB</span>
                    <div className="sub">{r.ago}</div>
                  </td>
                  <td>
                    {r.rep}
                    <div className="sub">{r.src}</div>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <span className={'p-tag ' + (r.k.raisedTo ? 't-info' : 't-neutral')}>{r.k.raisedTo ? 'Dinaikkan' : 'Tercatat'}</span>
                    {r.mr && (
                      <span className="p-tag t-caution" style={{ marginLeft: 6 }}>
                        Makin rawan
                      </span>
                    )}
                    {r.k.raisedTo && (
                      <div className="sub">
                        <Link to={`/insiden/${r.k.raisedTo}`}>{r.k.raisedTo}</Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="p-pager"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--ink-muted)',
          }}
        >
          <span>
            {rows.length} dari {total.length} kerawanan
          </span>
          <span style={{ display: 'flex', gap: 4 }}>
            <span className="p-pg on" aria-current="page">
              1
            </span>
          </span>
        </div>
      </section>
    </>
  );
}
