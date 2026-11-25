// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S5
export function KpiRow({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><div className="c12" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>{(v.kpis ?? []).map((k: any, k4: number) => (<Fragment key={k4}>
<div className="p-kpi db-kpi-link" data-flash="" role="link" tabIndex={0} onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) v.ui?.go?.(k.to); }} onKeyDown={(e) => { if (e.key === "Enter") v.ui?.go?.(k.to); }}>
<div className="k-head">{k.label}</div>
<div>
<span className="k-val">
<AnimNum text={k.val} />
</span>
<span className="k-unit">{k.unit}</span>
</div>
<div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
<span className={`p-trend ${k.trCls}`}>{k.tr}</span>
<span className="p-cap">{k.cmp}</span>
</div>
<a className="k-link" href={routeHref(k.href, k.id)}>{k.link}</a>
</div>
</Fragment>))}</div></>
  );
}
