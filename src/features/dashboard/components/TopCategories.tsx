// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S12
export function TopCategories({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card c6">
<div className="lk-card-head">
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Jenis insiden terbanyak</h2>
<span className="p-cap">{v.catCap}</span>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{(v.topCat ?? []).map((c: any, k29: number) => (<Fragment key={k29}>
<button type="button" className={`db-tc ${c.cls}`} data-tip={c.tip} onClick={c.go} aria-label={c.aria}>
<span className="nm">{c.n}</span>
<span className="t">
<i style={{ width: c.w }} />
</span>
<span className="v">{c.v}</span>
<span className="p">{c.p}</span>
<span className={`d ${c.dc}`}>{c.d}</span>
</button>
</Fragment>))}</div>
<p className="p-cap db-push" style={{ margin: "10px 0 0 0", paddingTop: "10px" }}>Klik jenis untuk menyaring seluruh halaman. Pembanding: Semester II 2025.</p>
</section></>
  );
}
