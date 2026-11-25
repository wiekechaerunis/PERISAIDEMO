// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S16
export function CategoryMatrix({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card c12">
<div className="lk-card-head">
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">{v.mxTitle}</h2>
<span className="p-cap">{v.mxCap}</span>
</div>
</div>
<div style={{ overflowX: "auto" }}>
<table className="db-mx">
<thead>
<tr>
<th className="rh" style={{ width: "210px" }}>Kategori</th>{(v.mxCols ?? []).map((h: any, k28: number) => (<Fragment key={k28}>
<th>{h.n}<span className="s">{h.s}</span>
</th>
</Fragment>))}<th>Total</th>
</tr>
</thead>
<tbody className="db-fade" key={v.fk}>{(v.mxRows ?? []).map((r: any, k29: number) => (<Fragment key={k29}>
<tr className={r.cls}>
<th className="rh" scope="row">{r.n}</th>{(r.cells ?? []).map((c: any, k30: number) => (<Fragment key={k30}>
<td>
<button type="button" className={c.cls} style={{ background: c.bg }} onClick={c.go} aria-label={c.aria}>{c.v}</button>
</td>
</Fragment>))}<td className="tot">{r.tot}</td>
</tr>
</Fragment>))}</tbody>
</table>
</div>
</section></>
  );
}
