// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S14
export function TrendChart({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card c7">
<div className="lk-card-head">
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Tren per bulan</h2>
<span className="p-cap">{v.trCap}</span>
</div>
<div className="p-qf" role="radiogroup" aria-label="Ukuran grafik">{(v.measures ?? []).map((q: any, k32: number) => (<Fragment key={k32}>
<button type="button" role="radio" aria-checked={q.on} onClick={q.pick}>{q.label}</button>
</Fragment>))}</div>
</div>
<div className="db-bars" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", marginTop: "24px" }} role="img" aria-label={v.trAria}>{(v.trend ?? []).map((b: any, k33: number) => (<Fragment key={k33}>
<div className="db-col" data-tip={b.tip} role="link" tabIndex={0} onClick={() => v.ui?.go?.("/insiden?bulan=" + b.bulan)} onKeyDown={(e) => { if (e.key === "Enter") v.ui?.go?.("/insiden?bulan=" + b.bulan); }}>{(b.hasMk) && (<>
<span className="mk" aria-hidden="true">1</span>
</>)}<span className="v">{b.lbl}</span>
<span className="st">{(b.hasD) && (<>
<i style={{ height: b.hd, background: "var(--border-control)" }} />
</>)}<i style={{ height: b.h, background: b.c, boxShadow: b.ring }} />
</span>
</div>
</Fragment>))}</div>
<div className="db-x" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }} aria-hidden="true">{(v.trend ?? []).map((b: any, k34: number) => (<Fragment key={k34}>
<span>{b.m}</span>
</Fragment>))}</div>
<div className="db-trn db-push">
<span className="mk" aria-hidden="true">1</span>
<span>
<b>{v.trNoteT}</b> {v.trNoteD}</span>
<span className="p-tag t-act" style={{ height: "20px", marginLeft: "auto" }}>Dibuat AI</span>
</div>
<div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>{(v.dtt) && (<>
<span className="p-cap">
<i style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "var(--border-control)", verticalAlign: "-1px" }} /> DTT</span>
</>)}</div>
</section></>
  );
}
