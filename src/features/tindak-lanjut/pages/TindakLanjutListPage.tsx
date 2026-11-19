// Daftar Tindak lanjut (artifact TLJ-01: T11, T11b, T21, T22, T35, T36, T28, T29). Rute /tindak-lanjut.
// KKKS: cakupan Milik saya / Semua, tampilan Tabel atau Papan, pencarian, panel Filter. SKK: hanya yang final (Selesai, Dibatalkan), tanpa aksi.
// ?state=memuat | gagal menampilkan keadaan memuat (skeleton) dan gagal muat.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS, isSkk } from '@/lib/rbac';
import { ORG } from '@/services/mock/seed';
import type { FollowUp } from '@/services/types';
import { formatDate } from '@/lib/format';
import {
  EMPTY_TL_FILTER, MOD_LABEL, MOD_TAG, dueSub, filterCount, isFinal, matchesTl, sortTlList, sourceId, sourceKindOf, visibleFollowUps, type TlFilter,
} from '../logic/followups';
import { useFollowUps } from '../logic/useFollowUps';
import { TlFilterPanel } from '../components/TlFilterPanel';
import { TlBoard } from '../components/TlBoard';
import { SrcIc } from '../components/SrcIc';

export function SourceCell({ f, link = true }: { f: FollowUp; link?: boolean }) {
  const k = sourceKindOf(f);
  return (
    <span className="src-cell" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <SrcIc k={k} />
      {k === 'arahan' ? (
        <span>Arahan SKK{f.arahan && <span className="p-cap"> · {f.arahan.channel} {formatDate(f.arahan.date).replace(/ \d{4}$/, '')}</span>}</span>
      ) : link ? (
        <Link to={k === 'insiden' ? `/insiden/${f.incidentNo}` : `/kerawanan/${f.krwNo}`} style={{ textDecoration: 'underline' }}>
          {k === 'insiden' ? 'Insiden' : 'Kerawanan'} <span className="p-mono" style={{ fontSize: 12 }}>{sourceId(f)}</span>
        </Link>
      ) : (
        <span>{k === 'insiden' ? 'Insiden' : 'Kerawanan'}<span className="sub p-mono" style={{ display: 'block', fontSize: 12 }}>{sourceId(f)}</span></span>
      )}
    </span>
  );
}

function Skeleton() {
  return (
    <section className="p-card" style={{ padding: 0, overflow: 'hidden' }} aria-busy="true" aria-label="Memuat daftar">
      <table className="p-table lk-tbl">
        <thead><tr>{['Tindak lanjut', 'Sumber', 'PIC', 'Pemeriksa', 'Tenggat', 'Status', 'Bukti'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 6 }, (_, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20 }}><span className="p-col" style={{ gap: 6 }}><span className="p-sk" style={{ width: 220, height: 14 }}></span><span className="p-sk" style={{ width: 120, height: 12 }}></span></span></td>
              {[110, 72, 80, 80, 90, 96].map((w) => <td key={w}><span className="p-sk" style={{ width: w, height: 14 }}></span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const aiSummary = (f: FollowUp) =>
  `${f.action} (${sourceId(f)}). ${f.pic} mengajukan selesai dengan ${f.evidence.length} bukti. Menunggu pemeriksaan Anda; tenggat ${formatDate(f.dueAt)}.`;

export function TindakLanjutListPage() {
  const role = useDemoStore((s) => s.role);
  const incidents = useDemoStore((s) => s.incidents);
  const all = useFollowUps();
  const [params] = useSearchParams();
  const skk = isSkk(role);
  const me = DEMO_USERS[role].name;
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [view, setView] = useState<'table' | 'board'>(() => {
    try { return localStorage.getItem('perisai-tl-view') === 'board' ? 'board' : 'table'; } catch { return 'table'; }
  });
  useEffect(() => { try { localStorage.setItem('perisai-tl-view', view); } catch { /* tanpa penyimpanan */ } }, [view]);
  const [search, setSearch] = useState('');
  const [flt, setFlt] = useState<TlFilter>(EMPTY_TL_FILTER);
  const [fOpen, setFOpen] = useState(false);
  const [size, setSize] = useState(25);
  const [page, setPage] = useState(1);
  const [ai, setAi] = useState<string | null>(null);

  const visible = useMemo(() => visibleFollowUps(all, incidents, role).filter((f) => !skk || isFinal(f)), [all, incidents, role, skk]);
  const scoped = visible.filter((f) => skk || scope === 'all' || f.pic === me || f.createdBy === me);
  const text = search.trim().toLowerCase();
  const rows = scoped
    .filter((f) => matchesTl(f, flt) && (!text || [f.no, f.action].some((x) => x.toLowerCase().includes(text))))
    .sort(sortTlList);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * size, cur * size);
  const nFilter = filterCount(flt);
  const canAdd = role === 'pejabat';
  const state = params.get('state');

  const subtitle = skk
    ? 'Tindak lanjut KKKS dalam cakupan Anda yang sudah selesai atau dibatalkan, lengkap dengan bukti resminya.'
    : 'Tugas perbaikan dari insiden, kerawanan, dan arahan SKK, lengkap dengan PIC, tenggat, dan buktinya.';
  const clear = () => { setFlt(EMPTY_TL_FILTER); setPage(1); };

  const emptyMsg = scoped.length === 0
    ? (scope === 'mine' && !skk
      ? { t: 'Tidak ada tugas untuk Anda', d: 'Tindak lanjut yang ditugaskan kepada Anda akan muncul di sini.' }
      : { t: 'Belum ada tindak lanjut', d: 'Tindak lanjut dibuat dari insiden, kerawanan, atau arahan SKK.' })
    : { t: 'Tidak ada tindak lanjut yang cocok dengan filter.', d: '' };

  return (
    <AppShell nav="tindak" title="Tindak lanjut" subtitle={subtitle} action={canAdd ? { to: '/tindak-lanjut/baru', label: 'Tambah tindak lanjut' } : undefined}>
      {state === 'memuat' ? <Skeleton /> : state === 'gagal' ? (
        <section className="p-card">
          <div className="lk-es es">
            <b>Daftar gagal dimuat</b>
            <span className="p-cap">Daftar tindak lanjut gagal dimuat. Muat ulang halaman atau coba beberapa saat lagi.</span>
            <Link to="/tindak-lanjut" className="p-btn p-btn-secondary p-btn-sm">Muat ulang</Link>
          </div>
        </section>
      ) : (
        <section className="p-card" style={{ padding: 0, overflow: 'visible', position: 'relative' }}>
          <div className="p-toolbar" style={{ justifyContent: 'space-between', padding: '16px 20px 12px', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 className="p-h2">Tindak lanjut</h2>
              {!skk && (
                <div className="p-qf" role="radiogroup" aria-label="Cakupan">
                  {([['mine', 'Milik saya'], ['all', 'Semua']] as const).map(([k, l]) => (
                    <button key={k} type="button" role="radio" aria-checked={scope === k} onClick={() => { setScope(k); setPage(1); }}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!skk && (
                <div className="lk-seg" role="group" aria-label="Tampilan">
                  <button type="button" aria-pressed={view === 'table'} className={view === 'table' ? 'on' : undefined} onClick={() => setView('table')}><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 10h18M3 15h18M9 5v14" /></svg>Tabel</button>
                  <button type="button" aria-pressed={view === 'board'} className={view === 'board' ? 'on' : undefined} onClick={() => setView('board')}><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v6h-4z" /></svg>Papan</button>
                </div>
              )}
              <label className="p-input" style={{ width: 280, height: 36 }}>
                <Icon name="search" size={16} style={{ color: 'var(--ink-muted)' }} />
                <input
                  aria-label="Cari nomor atau tindakan" placeholder="Cari nomor atau tindakan" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit' }}
                />
              </label>
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" aria-haspopup="dialog" aria-expanded={fOpen} onClick={() => setFOpen(!fOpen)}>
                <Icon name="filter" size={15} />Filter{nFilter ? ` · ${nFilter}` : ''}
              </button>
            </div>
          </div>
          {fOpen && (
            <TlFilterPanel
              value={flt} skk={skk} count={scoped.filter((f) => matchesTl(f, flt)).length} onChange={(v) => { setFlt(v); setPage(1); }}
              onClose={() => setFOpen(false)}
            />
          )}
          {nFilter > 0 && (
            <div className="lk-applied" role="group" aria-label="Filter aktif" style={{ padding: '0 20px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {flt.due && <button type="button" className="p-pill" aria-label="Hapus filter Tenggat" onClick={() => setFlt({ ...flt, due: null })}>Tenggat: <b>{flt.due === 'late' ? 'Terlambat' : 'Jatuh tempo minggu ini'}</b> ×</button>}
              {flt.status.length > 0 && <button type="button" className="p-pill" aria-label="Hapus filter Status" onClick={() => setFlt({ ...flt, status: [] })}>Status: <b>{flt.status.map((s) => MOD_LABEL[s]).join(', ')}</b> ×</button>}
              {flt.source.length > 0 && <button type="button" className="p-pill" aria-label="Hapus filter Sumber" onClick={() => setFlt({ ...flt, source: [] })}>Sumber: <b>{flt.source.join(', ')}</b> ×</button>}
              {flt.pic && <button type="button" className="p-pill" aria-label="Hapus filter PIC" onClick={() => setFlt({ ...flt, pic: '' })}>PIC: <b>{flt.pic}</b> ×</button>}
              {flt.giver && <button type="button" className="p-pill" aria-label="Hapus filter Pemeriksa" onClick={() => setFlt({ ...flt, giver: '' })}>Pemeriksa: <b>{flt.giver}</b> ×</button>}
              <button type="button" className="p-link" onClick={clear}>Hapus filter</button>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="lk-es es" style={{ padding: '32px 20px' }}>
              <b>{emptyMsg.t}</b>
              {emptyMsg.d && <span className="p-cap">{emptyMsg.d}</span>}
              {nFilter > 0 && <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={clear}>Hapus filter</button>}
            </div>
          ) : view === 'board' && !skk ? (
            <TlBoard rows={rows} me={me} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="p-table lk-tbl">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Tindak lanjut</th>
                      {skk && <th>KKKS</th>}
                      <th>Sumber</th>
                      <th>PIC</th>
                      {!skk && <th>Pemeriksa</th>}
                      <th>Tenggat</th>
                      <th style={skk ? { paddingRight: 20 } : undefined}>Status</th>
                      {!skk && <th style={{ textAlign: 'right', paddingRight: 20 }}>Bukti</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((f) => {
                      const sub = dueSub(f);
                      const finalSkk = skk && f.status === 'selesai' ? `Selesai ${formatDate(f.finishedAt ?? f.submittedAt ?? f.dueAt)}` : skk && f.status === 'dibatalkan' ? 'Tidak dihitung terlambat' : null;
                      return (
                        <tr key={f.no}>
                          <td style={{ paddingLeft: 20 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Link to={`/tindak-lanjut/${f.no}`} className="ttl">{f.action}</Link>
                              {!skk && role === 'pejabat' && f.status === 'menunggu-verifikasi' && (
                                <button type="button" className="p-ibtn ghost" style={{ width: 24, height: 24 }} aria-label={`Ringkasan AI ${f.no}`} aria-expanded={ai === f.no} onClick={() => setAi(ai === f.no ? null : f.no)}>
                                  <Icon name="sparkle" size={14} />
                                </button>
                              )}
                            </span>
                            <span className="id p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{f.no}</span>
                            {ai === f.no && (
                              <div role="dialog" aria-label="Ringkasan AI" className="p-pop" style={{ position: 'absolute', zIndex: 20, width: 360, padding: 14, boxShadow: 'var(--shadow-overlay)' }}>
                                <b>Ringkasan AI</b>
                                <p style={{ margin: '6px 0' }}>{aiSummary(f)}</p>
                                <span className="p-cap">Dibuat AI · bisa kurang akurat. <Link to={`/tindak-lanjut/${f.no}`}>Buka detail</Link></span>
                              </div>
                            )}
                          </td>
                          {skk && <td>{ORG}</td>}
                          <td><SourceCell f={f} link={!skk} /></td>
                          <td>{f.pic}</td>
                          {!skk && <td>{f.createdBy}</td>}
                          <td>
                            <span>{formatDate(f.dueAt)}</span>
                            {finalSkk ? <span className="sub" style={{ display: 'block' }}>{finalSkk}</span> : sub && <span className={'sub' + (sub.late ? ' lk-dl' : '')} style={{ display: 'block' }}>{sub.text}</span>}
                          </td>
                          <td style={skk ? { paddingRight: 20 } : undefined}><span className={`p-tag ${MOD_TAG[f.status]}`}>{MOD_LABEL[f.status]}</span></td>
                          {!skk && <td style={{ textAlign: 'right', paddingRight: 20 }}>{f.evidence.length}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-pager" aria-label="Halaman tabel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                <span>
                  Tampilkan{' '}
                  <select className="p-select-sm" aria-label="Baris per halaman" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
                    {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>{' '}
                  per halaman · <b>{(cur - 1) * size + 1}–{(cur - 1) * size + shown.length}</b> dari {rows.length}
                </span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <button type="button" className="p-pg nav" aria-label="Halaman sebelumnya" aria-disabled={cur <= 1} onClick={() => cur > 1 && setPage(cur - 1)}>‹</button>
                  <button type="button" className="p-pg on" aria-current="page">{cur}</button>
                  <button type="button" className="p-pg nav" aria-label="Halaman berikutnya" aria-disabled={cur >= pages} onClick={() => cur < pages && setPage(cur + 1)}>›</button>
                </span>
              </div>
            </>
          )}
        </section>
      )}
    </AppShell>
  );
}
