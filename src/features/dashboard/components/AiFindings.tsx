// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';
import { AskField } from './AskField';

// S6
export function AiFindings({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section data-flash="" className="db-ai c7" aria-label={v.aiHd} style={{ alignSelf: "stretch" }}>
<div className="hd">
<span className="ic" aria-hidden="true">
<svg className="p-ic" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
</svg>
</span>
<b>{v.aiHd}</b>
<span className="p-cap">{v.aiCap}</span>{(v.askOn) && (<>
<button type="button" className="back" onClick={v.askClr}>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "13px", height: "13px" }}>
<path d="M19 12H5M12 19l-7-7 7-7" />
</svg>Temuan AI</button>
</>)}</div>{(v.askOff) && (<>
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
</>)}{(v.askOn) && (<>
<div className="db-ans" role="region" aria-label={v.aiHd}>{(v.aSaran) && (<>
<span className="p-cap">Coba tanyakan</span>
<div className="sug">{(v.sugs ?? []).map((q: any, k6: number) => (<Fragment key={k6}>
<button type="button" className="sq" onClick={q.go}>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "14px", height: "14px", color: "var(--ink-muted)", flex: "none" }}>
<path d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
</svg>
<span>{q.l}</span>
<span className="k">{q.k}</span>
</button>
</Fragment>))}</div>
</>)}{(v.aBlank) && (<>
<div className="nope">
<b>Belum bisa menjawab pertanyaan ini.</b>
<span>Saya baru mengerti pertanyaan tentang jumlah, kerugian, level, wilayah, KKKS, kategori, bulan, dan tenggat insiden. Coba salah satu:</span>
<div className="chips">{(v.sugs ?? []).map((q: any, k7: number) => (<Fragment key={k7}>
<button type="button" className="chip" onClick={q.go}>{q.l}</button>
</Fragment>))}</div>
</div>
</>)}{(v.aRes) && (<>
<div className="und">
<span className="p-cap">Dipahami sebagai</span>{(v.askChips ?? []).map((c: any, k8: number) => (<Fragment key={k8}>
<span className="chip">{c.l}</span>
</Fragment>))}</div>
</>)}{(v.aRank) && (<>
<div className="lst">{(v.ansRows ?? []).map((r: any, k9: number) => (<Fragment key={k9}>
<button type="button" className="ar" onClick={r.go} title="Lihat di peta">
<span className="no">{r.no}</span>
<span className="nm">
<b>{r.name}</b>
<span className="bar" aria-hidden="true">
<i style={{ width: r.w }} />
</span>
</span>
<span className="v">
<b>{r.v}</b>
<span>{r.p}</span>
</span>
<svg className="p-ic ch" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="m9 6 6 6-6 6" />
</svg>
</button>
</Fragment>))}</div>
</>)}{(v.aList) && (<>
<div className="sum">
<b>{v.lN}</b>
<span>{v.lS}</span>
</div>
<div className="lst">{(v.lRows ?? []).map((r: any, k10: number) => (<Fragment key={k10}>
<a className="ir" href={routeHref(r.href, r.id)}>
<span className="dot" style={{ background: r.sc }} title={r.sn} />
<span className="nm">
<b>{r.t}</b>
<span>
<span className="p-mono">{r.id}</span> · {r.d}</span>
</span>
<span className={`st ${r.xc}`}>{r.x}</span>
<svg className="p-ic ch" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="m9 6 6 6-6 6" />
</svg>
</a>
</Fragment>))}</div>
</>)}{(v.aCmp) && (<>
<div className="cmp">
<div className="pair">
<div>
<span className="p-cap">{v.cA.l}</span>
<b>{v.cA.v}</b>
<span className="p-cap">insiden</span>
</div>
<span className={`dl ${v.cD.cls}`}>{v.cD.t}</span>
<div>
<span className="p-cap">{v.cB.l}</span>
<b>{v.cB.v}</b>
<span className="p-cap">insiden</span>
</div>
</div>
<div className="mbar" aria-label={v.cAria}>{(v.cMon ?? []).map((m: any, k11: number) => (<Fragment key={k11}>
<span className={`mc ${m.cls}`}>
<i style={{ height: m.h }} />
<em>{m.v}</em>
<span>{m.l}</span>
</span>
</Fragment>))}</div>
<div className="lst">{(v.cRows ?? []).map((r: any, k12: number) => (<Fragment key={k12}>
<div className="cr">
<span>{r.n}</span>
<span className="p-mono">{r.a} → {r.b}</span>
<span className={`dl ${r.cls}`}>{r.d}</span>
</div>
</Fragment>))}</div>
</div>
</>)}{(v.aRes) && (<>
<div className="ft">
<span className="p-cap">{v.ansFoot}</span>
<span style={{ display: "flex", gap: "2px", alignItems: "center", flex: "none" }}>{(v.ansMore) && (<>
<button type="button" className="more" onClick={v.ansAll}>{v.ansMoreL}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "13px", height: "13px" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>
</>)}{(v.actOn) && (<>
<button type="button" className="more" onClick={v.actGo}>{v.actL}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "13px", height: "13px" }}>
<path d="M5 12h14M13 6l6 6-6 6" />
</svg>
</button>
</>)}</span>
</div>
</>)}</div>
</>)}<AskField v={v} />
</section></>
  );
}
