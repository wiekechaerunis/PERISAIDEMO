// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S6
export function AiFindings({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section data-flash="" className="db-ai c7" aria-label="Temuan AI" style={{ alignSelf: "stretch" }}>
<div className="hd">
<span className="ic" aria-hidden="true">
<svg className="p-ic" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
</svg>
</span>
<b>Temuan AI</b>
<span className="p-cap">{v.aiCap}</span>
</div>
<div className="db-ins db-fade" key={v.fk}>{(v.ins ?? []).map((g: any, k5: number) => (<Fragment key={k5}>
<button type="button" className="row" onClick={g.go}>
<span className={`m ${g.tone}`}>
<AnimNum text={g.m} />
</span>
<span className="tx">
<b>{g.t}</b>
<span>{g.d}</span>
</span>
<svg className="p-ic ch" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="m9 6 6 6-6 6" />
</svg>
</button>
</Fragment>))}</div>
<label className="ask">
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px", color: "var(--ink-muted)" }}>
<path d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
</svg>
<span className="ph">{v.askPh}</span>
<span className="go" aria-hidden="true">
<svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
<path d="M5 12h14M13 6l6 6-6 6" />
</svg>
</span>
</label>
</section></>
  );
}
