// S16 Tabel insiden: tabel ringkasan + drill-down dengan susunan Baris · Kolom · Nilai (chip + "+ Tambah"), baris
// bertingkat sampai 3 dan kolom sampai 2 (TabelDrill, board TD0–TD20 Desain v2, 26 Nov malam).
// Markup dan kelas td-* disalin dari project/TabelDrill.dc.html; perilaku di src/analytics/tabelDrill.ts.
// Jejak drill, Baris, Kolom, Nilai, grup terlipat, tingkat insiden, dan halaman disimpan di URL
// (?tabel=…&baris=…&kolom=…&nilai=…&lipat=…&lihat=…&hal=…), jadi reload dan Back mengembalikan tampilan; sortir tidak.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  closePop, crumbTo, DIM, drillCsv, drillFromParams, drillInto, drillToParams, drillView, INIT, listHref, monthRange,
  openPop, quarterRange, reset, setAllGroups, setCols, setMeasure, setRows, showList, sortBy, toDrillInc, toggleGroup,
  toggleMenu, toggleSub, toPage, LV,
  type Chip, type Col, type CtlGroup, type DashIncRaw, type Dim, type DrillCell, type DrillInc, type DrillRow, type DrillState,
  type DrillView, type Measure, type Step,
} from '@/analytics/tabelDrill';
import { useDashPeriod } from '../dashPeriod';

type Local = Pick<DrillState, 'sort' | 'pop' | 'sub' | 'dd'>;
const LOCAL0: Local = { sort: null, pop: null, sub: false, dd: null };
const STO = ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'];

const Chev = ({ d, size = 14, rot }: { d: string; size?: number; rot?: string }) => (
  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size, ...(rot ? { transform: rot } : {}) }}><path d={d} /></svg>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IncidentDrillTable({ v }: { v: any }) {
  const kk = !v.tdSkk;
  const [params, setParams] = useSearchParams();
  const { setPeriod } = useDashPeriod();
  const [local, setLocal] = useState<Local>(LOCAL0);
  const [toast, setToast] = useState<string | null>(null);

  const inc: DrillInc[] = useMemo(() => ((v.tdInc ?? []) as DashIncRaw[]).map(toDrillInc), [v.tdInc]);
  const url = drillFromParams(params, kk);
  const s: DrillState = { ...INIT, ...url, ...local };
  const view = drillView(inc, s, kk);
  const { rd, cd } = view.layout;

  const set = (n: DrillState) => {
    setLocal({ sort: n.sort, pop: n.pop, sub: n.sub, dd: n.dd });
    const next = drillToParams(params, n, kk);
    if (next.toString() !== params.toString()) setParams(next, { replace: false });
  };

  // popover dan menu menutup dengan Escape atau klik di luar
  useEffect(() => {
    if (!local.pop && !local.dd) return;
    const down = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element) || !t.closest('.td-pop, .td-menu, .td-t .cv, .td-t .nm, .td-chip .pill, .td-add')) setLocal((l) => ({ ...l, pop: null, sub: false, dd: null }));
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setLocal((l) => ({ ...l, pop: null, sub: false, dd: null })); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [local.pop, local.dd]);

  const csv = () => {
    const blob = new Blob([drillCsv(view, kk)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tabel-insiden' + (s.path.length ? '-' + s.path.map((p) => p.v).join('-') : '') + (view.showPivot ? '-pivot' : '') + (s.list ? '-daftar' : '') + '.csv';
    a.download = a.download.replace(/[^\w.-]+/g, '-').toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    set({ ...s, pop: null, dd: null });
    const n = s.list ? view.lAll.length + ' insiden' : (view.showPivot ? view.pv.rows.length : view.rows.length) + ' baris';
    setToast('CSV tampilan ini diunduh (' + n + ').');
  };

  /** Saring halaman: pasang filter halaman untuk semua filter sel ini; Status penanganan tidak punya filter halaman. */
  const stepsOf = (p: DrillView['pop']): Step[] => (p ? p.steps.filter((x) => x.d !== 'st') : []);
  const filterPage = () => {
    const steps = stepsOf(view.pop);
    if (!steps.length) return;
    const patch: Record<string, unknown> = {};
    let range: { from: string; to: string } | null = null;
    // urutan: yang lebih rinci menimpa (WK setelah Wilayah, Bulan setelah Triwulan)
    const order: Dim[] = ['kat', 'wil', 'kkks', 'wk', 'lv', 'tw', 'bln'];
    [...steps].sort((a, b) => order.indexOf(a.d) - order.indexOf(b.d)).forEach((st) => {
      const i = inc.find((x) => DIM[st.d].f(x) === st.v);
      if (!i) return;
      if (st.d === 'kat') patch.kat = i.katI;
      else if (st.d === 'wil') { patch.z = i.wilKey; patch.loc = null; }
      else if (st.d === 'kkks') patch.kk = i.kk;
      else if (st.d === 'wk') { patch.z = kk ? 'own' : i.wilKey; patch.loc = i.areaId; }
      else if (st.d === 'lv') patch.lv = [0, 1, 2, 3, 4].map((l) => (l === i.lv ? 1 : 0));
      else if (st.d === 'tw') range = quarterRange(st.v);
      else if (st.d === 'bln') range = monthRange(st.v);
    });
    if (Object.keys(patch).length) v.tdApply(patch);
    if (range) setPeriod({ kind: 'custom', ...(range as { from: string; to: string }) });
    set(closePop(s));
    setToast('Filter halaman dipasang: ' + steps.map((x) => DIM[x.d].l + ' = ' + x.v).join(', ') + '. Semua kartu di dasbor ikut tersaring (lihat chip Filter aktif).');
  };

  const openDetail = (i: DrillInc) =>
    v.ui?.openInc?.({ id: i.id, t: i.t, lv: LV[i.lv][0], st: STO[i.st], cat: i.kat, tgl: i.tgl, area: i.area, wk: i.wk, kk: i.kk });
  const hrefList = listHref(s.path, s.list?.c ?? null);
  const pop = view.pop;

  /** Popover aksi: Lihat n insiden · Rincikan menurut › · Saring halaman ke "nilai". */
  const popover = (side: string) =>
    pop && (
      <div className={`p-pop td-pop ${side}`} role="dialog" aria-label={pop.T}>
        <div className="ph">
          <b>{pop.T}</b><span className="p-cap">{pop.S}</span>
          <button type="button" className="x" onClick={() => set(closePop(s))} aria-label="Tutup">×</button>
        </div>
        <button type="button" className="it" onClick={() => set(showList(s, kk))}>
          <Chev d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" size={16} />
          <span>Lihat {pop.N} insiden</span>
        </button>
        {pop.subOpts.length > 0 && (
          <button type="button" className="it" onClick={() => set(toggleSub(s))} aria-expanded={s.sub ? 'true' : 'false'}>
            <Chev d="M4 6h16M7 12h10M10 18h4" size={16} />
            <span style={{ flex: 1 }}>Rincikan menurut</span>
            <Chev d="m9 6 6 6-6 6" rot={s.sub ? 'rotate(90deg)' : 'none'} />
          </button>
        )}
        {s.sub && pop.subOpts.length > 0 && (
          <div className="sub" role="menu">
            {pop.subOpts.map((o) => (
              <button key={o.d} type="button" role="menuitem" className="it" onClick={() => set(drillInto(s, o.d, kk))}>{o.l}</button>
            ))}
          </div>
        )}
        {stepsOf(pop).length > 0 && (
          <button type="button" className="it" onClick={filterPage}>
            <Chev d="M3 5h18l-7 8v6l-4-2v-4L3 5z" size={16} />
            <span>Saring halaman ke “{pop.V}”</span>
          </button>
        )}
      </div>
    );

  // kontrol Baris / Kolom / Nilai
  const pickChip = (gp: CtlGroup, ix: number, val: Dim | Measure) => {
    if (gp.k === 'm') return set(setMeasure(s, val as Measure));
    if (gp.k === 'r') { const a = rd.slice(); a[ix] = val as Dim; return set(setRows(s, a)); }
    const a = cd.slice(); a[ix] = val as Dim; return set(setCols(s, a));
  };
  const removeChip = (gp: CtlGroup, ix: number) =>
    set(gp.k === 'r' ? setRows(s, rd.filter((_, j) => j !== ix)) : setCols(s, cd.filter((_, j) => j !== ix)));
  const addDim = (gp: CtlGroup, d: Dim) => set(gp.k === 'r' ? setRows(s, [...rd, d]) : setCols(s, [...cd, d]));

  const chip = (gp: CtlGroup, mn: Chip, ix: number) => (
    <Fragment key={mn.id}>
      {mn.sep && <span className="sep" aria-hidden="true">{gp.sep}</span>}
      <span className="dd">
        <span className="td-chip">
          <button type="button" className="pill" onClick={() => set(toggleMenu(s, mn.id))} aria-haspopup="menu" aria-expanded={s.dd === mn.id ? 'true' : 'false'} aria-label={`${gp.l} ${mn.n}: ${mn.v}`}>
            {mn.v}<Chev d="m6 9 6 6 6-6" />
          </button>
          {mn.x && <button type="button" className="chx" onClick={() => removeChip(gp, ix)} aria-label={`Hapus ${mn.v} dari ${gp.l}`}>×</button>}
        </span>
        {s.dd === mn.id && (
          <span className="p-pop td-menu" role="menu">
            {mn.opts.map((o) => (
              <button key={o.l} type="button" role="menuitemradio" aria-checked={o.on ? 'true' : 'false'} onClick={() => pickChip(gp, ix, o.val)}>{o.l}</button>
            ))}
          </span>
        )}
      </span>
    </Fragment>
  );

  /** Sel tabel (ringkasan atau pivot) dengan popover aksi. */
  const cell = (r: DrillRow, c: DrillCell, k: string) => (
    <td key={k} className={`num ${c.cls}`}>
      {c.z && <span className="z" aria-label="nol">–</span>}
      {!c.z && (
        <button type="button" className="cv" onClick={() => set(c.exp ? closePop(s) : openPop(s, r.rv, c.k as Col, false, c.cv))} aria-haspopup="dialog" aria-expanded={c.exp ? 'true' : 'false'} aria-label={c.aria}>
          {c.v}
          {c.bar && <span className="bar" aria-hidden="true"><i style={{ width: c.w }} /></span>}
        </button>
      )}
      {c.exp && popover(c.side)}
    </td>
  );
  /** Kepala baris: − / + (baris induk), nama, jumlah rincian. */
  const rowHead = (r: DrillRow) => (
    <th scope="row">
      <span className="pvn" style={{ paddingLeft: r.pad }}>
        {r.tg && (
          <button type="button" className="tg" onClick={() => set(toggleGroup(s, r.key, r.open))} aria-expanded={r.open ? 'true' : 'false'} aria-label={r.tgAria}>{r.open ? '−' : '+'}</button>
        )}
        <button type="button" className="nm" onClick={() => set(openPop(s, r.rv, view.showPivot ? (view.pv.m as Col) : 'n', true))} aria-label={r.aria}>
          <span>{r.label}<span className="pvc">{r.cnt}</span></span>
          <Chev d="m9 6 6 6-6 6" />
        </button>
      </span>
    </th>
  );

  return (
    <div className="c12" aria-label="Tabel insiden">
      <section className="p-card td" aria-label="Tabel insiden">
        <div className="lk-card-head" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
          <div className="hd"><h2 className="p-h2">Tabel insiden</h2><span className="p-cap">{view.cap}</span></div>
          <button type="button" className="td-btn" onClick={csv}>
            <Chev d="M12 4v11M7 10l5 5 5-5M5 19h14" />Unduh CSV
          </button>
        </div>

        {toast && (
          <div className="td-toast" role="status"><span>{toast}</span><button type="button" onClick={() => setToast(null)} aria-label="Tutup pesan">×</button></div>
        )}

        {view.showCtl && (
          <div className="td-ctl" role="group" aria-label="Susunan tabel">
            {view.ctl.map((gp) => (
              <span key={gp.k} className="td-gl" role="group" aria-label={gp.l}>
                <span className="lb">{gp.l}</span>
                {gp.chips.map((mn, ix) => chip(gp, mn, ix))}
                {gp.canAdd && (
                  <span className="dd">
                    <button type="button" className="td-add" onClick={() => set(toggleMenu(s, gp.addId))} aria-haspopup="menu" aria-expanded={s.dd === gp.addId ? 'true' : 'false'} aria-label={`Tambah dimensi ke ${gp.l}`}>+ Tambah</button>
                    {s.dd === gp.addId && (
                      <span className="p-pop td-menu" role="menu">
                        <span className="mh">{gp.addH}</span>
                        {gp.addOpts.map((o) => (
                          <button key={o.val} type="button" role="menuitem" onClick={() => addDim(gp, o.val)}>{o.l}</button>
                        ))}
                      </span>
                    )}
                  </span>
                )}
              </span>
            ))}
            {view.nested && (
              <span className="td-ca">
                <button type="button" onClick={() => set(setAllGroups(s, view.groupKeys, false))}>Buka semua</button>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={() => set(setAllGroups(s, view.groupKeys, true))}>Lipat semua</button>
              </span>
            )}
          </div>
        )}

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

        {view.showFlat && (
          // td-sum: lebar kolom otomatis, kolom angka selebar isinya, kolom baris mengambil sisa; layar sempit bergeser
          <div className="td-scroll"><table className="td-t td-sum">
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
                <tr key={r.key} className={r.rc}>
                  {rowHead(r)}
                  {r.cells.map((c) => cell(r, c, c.k))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row">Total</th>{view.foot.map((f, k) => <td key={k} className="num">{f}</td>)}</tr>
            </tfoot>
          </table></div>
        )}

        {view.showPivot && (
          <>
            <div className="td-pvw"><table className="td-t td-pv" style={{ minWidth: view.pv.minW }}>
              <thead>
                <tr className="h1">
                  <th scope="col" rowSpan={view.pv.rs} aria-sort={view.hDim.sort}>
                    <button type="button" className="sh" onClick={() => set(sortBy(s, 'dim'))}>{view.rowL}<span className="pvx">↓ × {view.colL} →</span><span className="ar">{view.hDim.a}</span></button>
                  </th>
                  {view.pv.head.map((h) => (
                    <th key={h.v} scope="col" colSpan={h.span} className={h.cls}><span className="pvh"><i className="dot" style={{ display: h.dot ? 'inline-block' : 'none', background: h.dot ?? 'transparent' }} />{h.l}</span></th>
                  ))}
                  <th scope="col" rowSpan={view.pv.rs} className="num tot" aria-sort={view.pv.hTot.sort}>
                    <button type="button" className="sh" onClick={() => set(sortBy(s, view.pv.m))}>Total<span className="ar">{view.pv.hTot.a}</span></button>
                  </th>
                </tr>
                {view.pv.twoCol && (
                  <tr className="h2">
                    {view.pv.head2.map((h, k) => (
                      <th key={k} scope="col" className={`num ${h.cls}`}><span className="pvh"><i className="dot" style={{ display: h.dot ? 'inline-block' : 'none', background: h.dot ?? 'transparent' }} />{h.l}</span></th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {view.pv.rows.map((r) => (
                  <tr key={r.key} className={r.rc}>
                    {rowHead(r)}
                    {r.cells.map((c, k) => cell(r, c, String(k)))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th>{view.pv.foot.map((f, k) => <td key={k} className={`num ${f.cls}`}>{f.v}</td>)}</tr>
              </tfoot>
            </table></div>
            <p className="p-cap" style={{ margin: 0 }}>{view.pv.note}</p>
          </>
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
