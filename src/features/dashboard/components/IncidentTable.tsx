// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S16 (Tabel insiden)
export function IncidentTable({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card c12 db-tb" aria-label="Tabel insiden">
<div className="lk-card-head" style={{ alignItems: "flex-start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Tabel insiden</h2>
<span className="p-cap">{v.tbCap}</span>
</div>
<div className="seg" role="radiogroup" aria-label="Ukuran tabel">{(v.tbMs ?? []).map((m: any, k38: number) => (<Fragment key={k38}>
<button type="button" role="radio" aria-checked={m.on} onClick={m.pick}>{m.l}</button>
</Fragment>))}</div>
</div>
<div className="tbar">
<span className="lb">Baris</span>
<span className="dd" onBlur={(e) => { if (v.dR1.open && !e.currentTarget.contains(e.relatedTarget as Node)) v.dR1.t(); }} onKeyDown={(e) => { if (e.key === "Escape" && v.dR1.open) v.dR1.t(); }}>
<button type="button" className="pill" onClick={v.dR1.t} aria-expanded={v.dR1.str}>{v.dR1.l}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>{(v.dR1.open) && (<>
<span className="pop" role="menu">{(v.dR1.opts ?? []).map((o: any, k39: number) => (<Fragment key={k39}>
<button type="button" role="menuitemradio" aria-checked={o.on} onClick={o.pick}>{o.l}</button>
</Fragment>))}</span>
</>)}</span>
<span className="sep">›</span>
<span className="dd" onBlur={(e) => { if (v.dR2.open && !e.currentTarget.contains(e.relatedTarget as Node)) v.dR2.t(); }} onKeyDown={(e) => { if (e.key === "Escape" && v.dR2.open) v.dR2.t(); }}>
<button type="button" className={`pill ${v.dR2.cls}`} onClick={v.dR2.t} aria-expanded={v.dR2.str}>{v.dR2.l}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>{(v.dR2.open) && (<>
<span className="pop" role="menu">{(v.dR2.opts ?? []).map((o: any, k40: number) => (<Fragment key={k40}>
<button type="button" role="menuitemradio" aria-checked={o.on} onClick={o.pick}>{o.l}</button>
</Fragment>))}</span>
</>)}</span>
<span className="lb" style={{ marginLeft: "12px" }}>Kolom</span>
<span className="dd" onBlur={(e) => { if (v.dCol.open && !e.currentTarget.contains(e.relatedTarget as Node)) v.dCol.t(); }} onKeyDown={(e) => { if (e.key === "Escape" && v.dCol.open) v.dCol.t(); }}>
<button type="button" className={`pill ${v.dCol.cls}`} onClick={v.dCol.t} aria-expanded={v.dCol.str}>{v.dCol.l}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>{(v.dCol.open) && (<>
<span className="pop" role="menu">{(v.dCol.opts ?? []).map((o: any, k41: number) => (<Fragment key={k41}>
<button type="button" role="menuitemradio" aria-checked={o.on} onClick={o.pick}>{o.l}</button>
</Fragment>))}</span>
</>)}</span>
<span style={{ flex: "1" }} />{(v.tbAnyOpen) && (<>
<button type="button" className="lnk" onClick={v.tbCollapse}>Tutup semua rincian</button>
</>)}</div>
<div className="grid" role="table" aria-label="Tabel insiden">
<div className="ln hd" role="row" style={{ gridTemplateColumns: v.tbGrid }}>
<span role="columnheader" className="nm">{v.tbRowHead}</span>{(v.tbCols ?? []).map((h: any, k42: number) => (<Fragment key={k42}>
<span role="columnheader" className="c">
<i className="dot" style={{ display: h.dD, background: h.dc }} />{h.l}</span>
</Fragment>))}<span role="columnheader" className="c t">Total</span>
</div>{(v.tbLines ?? []).map((l: any, k43: number) => (<Fragment key={k43}>{(l.agg) && (<>
<div className={`ln ${l.cls}`} role="row" style={{ gridTemplateColumns: v.tbGrid }}>
<button type="button" className="nm" role="rowheader" onClick={l.tog} aria-expanded={l.exStr} style={{ paddingLeft: l.pad }}>
<svg className="p-ic car" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "14px", height: "14px", transform: l.rot }}>
<path d="m9 6 6 6-6 6" />
</svg>
<span className="tx">{l.n}</span>
<span className="cnt">{l.sub}</span>
</button>{(l.cells ?? []).map((c: any, k44: number) => (<Fragment key={k44}>
<button type="button" className={`c ${c.cls}`} role="cell" style={{ background: c.bg }} onClick={c.go} aria-label={c.aria}>{c.v}</button>
</Fragment>))}<span className="c t" role="cell">{l.tot}</span>
</div>
</>)}{(l.leaf) && (<>
<a className="ln leaf" role="row" href={routeHref(l.href, l.id)} style={{ paddingLeft: l.pad }}>
<i className="dot" style={{ background: l.sc }} title={l.sn} />
<span className="p-mono id">{l.id}</span>
<span className="tt">{l.t}</span>
<span className="d">{l.d}</span>
<span className={`st ${l.xc}`}>{l.x}</span>
</a>
</>)}{(l.more) && (<>
<div className="ln more" style={{ paddingLeft: l.pad }}>
<span className="p-cap">{l.mT}</span>
<a href={routeHref(l.href, l.id)} className="lk-alink" style={{ fontSize: "12px" }}>{l.mL}</a>
</div>
</>)}</Fragment>))}<div className="ln ft" role="row" style={{ gridTemplateColumns: v.tbGrid }}>
<span className="nm" role="rowheader">Total</span>{(v.tbFoot ?? []).map((c: any, k45: number) => (<Fragment key={k45}>
<span className="c" role="cell">{c}</span>
</Fragment>))}<span className="c t" role="cell">{v.tbTot}</span>
</div>
</div>
</section></>
  );
}
