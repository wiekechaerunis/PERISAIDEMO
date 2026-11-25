// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S15
export function HandlingStatus({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section data-flash="" className="p-card c5">
<div className="lk-card-head">
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Status penanganan</h2>
<span className="p-cap">{v.stCap}</span>
</div>
</div>
<div className="db-stack" style={{ height: "14px" }} role="img" aria-label={v.stAria}>{(v.stBar ?? []).map((v: any, k35: number) => (<Fragment key={k35}>
<i style={{ width: v.w, background: v.c }} />
</Fragment>))}</div>
<div className="db-fade" key={v.fk} style={{ display: "flex", flexDirection: "column", marginTop: "10px" }}>{(v.st ?? []).map((v: any, k36: number) => (<Fragment key={k36}>
<div className="db-stw">
<button type="button" className="db-str" aria-expanded={v.openStr} onClick={v.go}>
<i style={{ background: v.c }} />
<span style={{ flex: "1", textAlign: "left" }}>{v.n}</span>
<b>
<AnimNum text={v.v} />
</b>
<span className="p-cap" style={{ width: "40px", textAlign: "right" }}>{v.p}</span>
<svg className="p-ic ch" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px", transform: v.rot }}>
<path d="m9 6 6 6-6 6" />
</svg>
</button>{(v.open) && (<>
<div className="db-stl">{(v.items ?? []).map((i: any, k37: number) => (<Fragment key={k37}>
<a className="db-sti" href={routeHref(i.href, i.id)}>
<span className="db-id">{i.id}</span>
<span className="tt">
<b>{i.t}</b>
<span>{i.d}</span>
</span>
<span className="db-sev" style={{ background: i.sbg, color: i.sink }}>
<i style={{ background: i.sc }} />{i.sn}</span>
<span className={`x ${i.xc}`}>{i.x}</span>
</a>
</Fragment>))}<a className="lk-alink" href={routeHref(v.listHref)} style={{ fontSize: "12px", padding: "8px 0 2px 0" }}>{v.more}</a>
</div>
</>)}</div>
</Fragment>))}</div>
<div className="db-ik db-push" style={{ marginTop: "12px", paddingTop: "14px", borderTop: "1px dashed var(--border-control)", gridTemplateColumns: "1fr 1fr", marginBottom: "0" }}>
<button type="button" className="db-kv" onClick={v.lateGo} aria-expanded={v.lateOpenStr}>
<span className="p-cap">Lewat tenggat</span>
<b style={{ color: "var(--sev-critical-ink)" }}>{v.stLate}</b>
<span className="p-cap" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>Lihat insidennya</span>
</button>
<div>
<span className="p-cap">Median lama penanganan</span>
<b>{v.stMed}</b>
<span className="p-cap">dari {v.stClosed} insiden yang ditutup</span>
</div>
</div>
</section></>
  );
}
