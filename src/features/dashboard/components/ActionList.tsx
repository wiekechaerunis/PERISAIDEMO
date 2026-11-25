// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S7
export function ActionList({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card c5 db-attc" style={{ alignSelf: "stretch" }}>
<div className="lk-card-head" style={{ marginBottom: "6px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Perlu tindakan</h2>
<span className="p-cap">Paling mendesak di atas · seluruh wilayah</span>
</div>
<span className="p-tag t-caution">{v.attnCount}</span>
</div>
<div className="db-ins">{(v.attn ?? []).map((a: any, k13: number) => (<Fragment key={k13}>
<button type="button" className="row" onClick={a.go}>
<span className={`ic ${a.k}`} aria-hidden="true">
<svg className="p-ic" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}>
<path d={a.ic} />
</svg>
</span>
<span className="tx">
<b>{a.t}</b>
<span>{a.d}</span>
</span>
<svg className="p-ic ch" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="m9 6 6 6-6 6" />
</svg>
</button>
</Fragment>))}</div>
</section></>
  );
}
