// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S13
export function IncidentVsRisk({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section data-flash="" className="p-card c6">
<div className="lk-card-head">
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 className="p-h2">Insiden dan kerawanan</h2>
<span className="p-cap">Kerawanan = ancaman atau gangguan tanpa kerugian, indikator awal</span>
</div>
<div className="p-cap" style={{ display: "flex", gap: "12px", whiteSpace: "nowrap" }}>
<span>
<i className="db-key" style={{ background: "var(--chart-series-1)" }} />Insiden</span>
<span>
<i className="db-key" style={{ background: "var(--action-line)" }} />Kerawanan</span>
</div>
</div>
<div className="db-ik">
<div>
<span className="p-cap">Insiden</span>
<b>
<AnimNum text={v.ikN} />
</b>
</div>
<div>
<span className="p-cap">Kerawanan</span>
<b>
<AnimNum text={v.ikK} />
</b>
</div>
<div>
<span className="p-cap">Naik jadi insiden</span>
<b>{v.ikUp}</b>
</div>
</div>
<div className="db-gb" role="img" aria-label={v.ikAria}>{(v.ikBars ?? []).map((b: any, k20: number) => (<Fragment key={k20}>
<div className="g" data-tip={b.tip}>
<span className="b">
<i style={{ height: b.hn, background: "var(--chart-series-1)" }} />
<i style={{ height: b.hk, background: "var(--action-line)" }} />
</span>
</div>
</Fragment>))}</div>
<div className="db-x" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }} aria-hidden="true">{(v.ikBars ?? []).map((b: any, k21: number) => (<Fragment key={k21}>
<span>{b.m}</span>
</Fragment>))}</div>
<p className="p-cap db-push" style={{ margin: "12px 0 0 0", paddingTop: "12px" }}>{v.ikNote}</p>
</section></>
  );
}
