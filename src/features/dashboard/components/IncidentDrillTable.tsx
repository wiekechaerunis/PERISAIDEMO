// S16 Tabel insiden: tabel ringkasan + drill-down (TabelDrill, board TD0–TD8 Desain v2, 26 Nov).
// Markup dan kelas td-* disalin dari project/TabelDrill.dc.html; perilaku di src/analytics/tabelDrill.ts.
// Jejak drill, kelompok, tingkat insiden, dan halaman disimpan di URL (?tabel=…&lihat=…&kelompok=…&hal=…).
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  closePop, crumbTo, DIM, drillCsv, drillFromParams, drillInto, drillToParams, drillView, INIT, listHref, monthRange,
  openPop, pickGroup, reset, showList, sortBy, toDrillInc, toggleGroup, toggleSub, toPage, LV,
  type Col, type DashIncRaw, type Dim, type DrillInc, type DrillState,
} from '@/analytics/tabelDrill';
import { useDashPeriod } from '../dashPeriod';

type Local = Pick<DrillState, 'sort' | 'pop' | 'sub' | 'gOpen'>;
const LOCAL0: Local = { sort: null, pop: null, sub: false, gOpen: false };
const STO = ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IncidentDrillTable({ v }: { v: any }) {
  const kk = !v.tdSkk;
  const [params, setParams] = useSearchParams();
  const { setPeriod } = useDashPeriod();
  const [local, setLocal] = useState<Local>(LOCAL0);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  const inc: DrillInc[] = useMemo(() => ((v.tdInc ?? []) as DashIncRaw[]).map(toDrillInc), [v.tdInc]);
  const url = drillFromParams(params, kk);
  const s: DrillState = { ...INIT, ...url, ...local };
  const view = drillView(inc, s, kk);

  const set = (n: DrillState) => {
    setLocal({ sort: n.sort, pop: n.pop, sub: n.sub, gOpen: n.gOpen });
    const next = drillToParams(params, n, kk);
    if (next.toString() !== params.toString()) setParams(next, { replace: false });
  };

  // popover dan menu menutup dengan Escape atau klik di luar
  useEffect(() => {
    if (!local.pop && !local.gOpen) return;
    const down = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.td-pop, .td-menu, .td-t .cv, .td-t .nm, .td-grp .pill')) setLocal((l) => ({ ...l, pop: null, sub: false, gOpen: false }));
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setLocal((l) => ({ ...l, pop: null, sub: false, gOpen: false })); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [local.pop, local.gOpen]);

  const csv = () => {
    const blob = new Blob([drillCsv(view, kk)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tabel-insiden' + (s.path.length ? '-' + s.path.map((p) => p.v).join('-') : '') + (s.list ? '-daftar' : '') + '.csv';
    a.download = a.download.replace(/[^\w.-]+/g, '-').toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    set({ ...s, pop: null, gOpen: false });
    setToast('CSV tampilan ini diunduh (' + (s.list ? view.lAll.length + ' insiden' : view.rows.length + ' baris') + ').');
  };

  /** Saring halaman: pasang filter halaman (bar filter + chip Filter aktif), semua kartu ikut tersaring. */
  const canFilter = s.g !== 'st';
  const filterPage = () => {
    if (!s.pop) return;
    const val = s.pop.v;
    const i = inc.find((x) => DIM[s.g].f(x) === val);
    if (!i) return;
    const g: Dim = s.g;
    if (g === 'kat') v.tdApply({ kat: i.katI });
    else if (g === 'wil') v.tdApply({ z: i.wilKey, loc: null });
    else if (g === 'kkks') v.tdApply({ kk: i.kk });
    else if (g === 'wk') v.tdApply({ z: kk ? 'own' : i.wilKey, loc: i.areaId });
    else if (g === 'lv') v.tdApply({ lv: [0, 1, 2, 3, 4].map((l) => (l === i.lv ? 1 : 0)) });
    else if (g === 'bln') { const r = monthRange(val); if (r) setPeriod({ kind: 'custom', ...r }); }
    set(closePop(s));
    setToast('Filter halaman dipasang: ' + DIM[g].l + ' = ' + val + '. Semua kartu di dasbor ikut tersaring (lihat chip Filter aktif).');
  };

  const openDetail = (i: DrillInc) =>
    v.ui?.openInc?.({ id: i.id, t: i.t, lv: LV[i.lv][0], st: STO[i.st], cat: i.kat, tgl: i.tgl, area: i.area, wk: i.wk, kk: i.kk });
  const hrefList = listHref(s.path, s.list?.c ?? null);
  const pop = view.pop;

  return (
    <div className="c12" aria-label="Tabel insiden">
      <section ref={ref} className="p-card td" aria-label="Tabel insiden">
        <div className="lk-card-head" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
          <div className="hd"><h2 className="p-h2">Tabel insiden</h2><span className="p-cap">{view.cap}</span></div>
          <button type="button" className="td-btn" onClick={csv}>
            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}><path d="M12 4v11M7 10l5 5 5-5M5 19h14" /></svg>Unduh CSV
          </button>
        </div>

        {toast && (
          <div className="td-toast" role="status"><span>{toast}</span><button type="button" onClick={() => setToast(null)} aria-label="Tutup pesan">×</button></div>
        )}

        <div className="td-bar">
          {view.drilled && (
            <nav className="td-crumb" aria-label="Jejak rincian">
              {view.crumb.map((b, k) => (
                <Fragment key={k}>
                  {b.link && (
                    <>
                      <button type="button" onClick={() => set(b.ix < 0 ? reset(s) : crumbTo(s, b.ix))}>{b.t}</button>
                      <span className="sep" aria-hidden="true">›</span>
                    </>
                  )}
                  {b.cur && <span className="cur" aria-current="location">{b.t}</span>}
                </Fragment>
              ))}
              <button type="button" className="rst" onClick={() => set(reset(s))}>× Reset</button>
            </nav>
          )}
          {view.showTable && (
            <span className="td-grp">
              <span className="p-cap">Kelompokkan menurut</span>
              <span className="dd">
                <button type="button" className="pill" onClick={() => set(toggleGroup(s))} aria-haspopup="menu" aria-expanded={s.gOpen ? 'true' : 'false'}>
                  {view.gLabel}
                  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {s.gOpen && (
                  <span className="p-pop td-menu" role="menu">
                    {view.gOpts.map((o) => (
                      <button key={o.d} type="button" role="menuitemradio" aria-checked={o.on ? 'true' : 'false'} onClick={() => set(pickGroup(s, o.d))}>{o.l}</button>
                    ))}
                  </span>
                )}
              </span>
            </span>
          )}
        </div>

        {view.showTable && (
          <div className="td-scroll"><table className="td-t">
            <colgroup>
              {['30%', '13%', '6%', '11%', '11%', '10%', '8%', '11%'].map((w, k) => <col key={k} style={{ width: w }} />)}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" aria-sort={view.hDim.sort}>
                  <button type="button" className="sh" onClick={() => set(sortBy(s, 'dim'))}>{view.hDim.l}<span className="ar">{view.hDim.a}</span></button>
                </th>
                {view.heads.map((h) => (
                  <th key={h.k} scope="col" className="num" aria-sort={h.sort}>
                    <button type="button" className="sh" onClick={() => set(sortBy(s, h.k))}>{h.l}<span className="ar">{h.a}</span></button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.rows.map((r) => (
                <tr key={r.v}>
                  <th scope="row">
                    <button type="button" className="nm" onClick={() => set(openPop(s, r.v, 'n', true))} aria-label={r.aria}>
                      <span>{r.label}</span>
                      <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}><path d="m9 6 6 6-6 6" /></svg>
                    </button>
                  </th>
                  {r.cells.map((c) => (
                    <td key={c.k} className={`num ${c.cls}`}>
                      {c.z && <span className="z" aria-label="nol">–</span>}
                      {!c.z && (
                        <button type="button" className="cv" onClick={() => set(c.exp ? closePop(s) : openPop(s, r.v, c.k as Col, false))} aria-haspopup="dialog" aria-expanded={c.exp ? 'true' : 'false'} aria-label={c.aria}>
                          {c.v}
                          {c.bar && <span className="bar" aria-hidden="true"><i style={{ width: c.w }} /></span>}
                        </button>
                      )}
                      {pop && s.pop && s.pop.v === r.v && s.pop.c === c.k && (
                        <div className={`p-pop td-pop ${c.side}`} role="dialog" aria-label={pop.T}>
                          <div className="ph">
                            <b>{pop.T}</b><span className="p-cap">{pop.S}</span>
                            <button type="button" className="x" onClick={() => set(closePop(s))} aria-label="Tutup">×</button>
                          </div>
                          <button type="button" className="it" onClick={() => set(showList(s))}>
                            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                            <span>Lihat {pop.N} insiden</span>
                          </button>
                          {pop.subOpts.length > 0 && (
                            <button type="button" className="it" onClick={() => set(toggleSub(s))} aria-expanded={s.sub ? 'true' : 'false'}>
                              <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                              <span style={{ flex: 1 }}>Rincikan menurut</span>
                              <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14, transform: s.sub ? 'rotate(90deg)' : 'none' }}><path d="m9 6 6 6-6 6" /></svg>
                            </button>
                          )}
                          {s.sub && pop.subOpts.length > 0 && (
                            <div className="sub" role="menu">
                              {pop.subOpts.map((o) => (
                                <button key={o.d} type="button" role="menuitem" className="it" onClick={() => set(drillInto(s, o.d))}>{o.l}</button>
                              ))}
                            </div>
                          )}
                          {canFilter && (
                            <button type="button" className="it" onClick={filterPage}>
                              <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" /></svg>
                              <span>Saring halaman ke “{pop.V}”</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row">Total</th>{view.foot.map((f, k) => <td key={k} className="num">{f}</td>)}</tr>
            </tfoot>
          </table></div>
        )}

        {view.showList && (
          <>
            <div className="td-lh">
              <span><b>{view.lN}</b> {view.lS}</span>
              <a className="lk-alink" href={hrefList} style={{ fontSize: 13 }} onClick={(e) => { e.preventDefault(); v.ui?.go?.(hrefList); }}>Buka di daftar insiden</a>
            </div>
            <div className="td-scroll"><table className="td-t td-l">
              <colgroup>
                {['16%', '21%', '16%', '9%', '13%', '7%', '6%', '12%'].map((w, k) => <col key={k} style={{ width: w }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Nomor</th><th scope="col">Insiden</th><th scope="col">{view.lColL}</th><th scope="col">Level</th>
                  <th scope="col">Waktu kejadian</th><th scope="col" className="num">Kerugian</th><th scope="col">Korban</th><th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {view.lRows.map((i) => (
                  <tr key={i.id + i.inc.areaId} title={`Buka detail ${i.id}`} onClick={() => openDetail(i.inc)}>
                    <td><a className="id" href={`/insiden/${i.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDetail(i.inc); }}>{i.id}</a></td>
                    <td><span className="tt"><b>{i.t}</b><span>{i.kat}</span></span></td>
                    <td><span className="tt"><b style={{ fontWeight: 500 }}>{i.c1}</b><span>{i.c2}</span></span></td>
                    <td><span className="td-sev" style={{ background: i.sbg, color: i.sink }}><i style={{ background: i.sc }} />{i.sn}</span></td>
                    <td><span className="tt"><b style={{ fontWeight: 500 }}>{i.d}</b><span>{i.h}</span></span></td>
                    <td className="num">{i.rp}</td>
                    <td className={i.kc}>{i.k}</td>
                    <td><span className={`td-st ${i.xc}`}>{i.x}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="td-pg">
              <span className="p-cap">{view.pgT}</span>
              <button type="button" onClick={() => { if (!view.prevDis) set(toPage(s, view.pg - 1)); }} aria-disabled={view.prevDis ? 'true' : 'false'} aria-label="Halaman sebelumnya">‹</button>
              <button type="button" onClick={() => { if (!view.nextDis) set(toPage(s, view.pg + 1)); }} aria-disabled={view.nextDis ? 'true' : 'false'} aria-label="Halaman berikutnya">›</button>
            </div>
          </>
        )}

        <p className="p-cap td-foot">{view.foot2}</p>
      </section>
    </div>
  );
}
