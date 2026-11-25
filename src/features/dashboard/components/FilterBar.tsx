// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S3
export function FilterBar({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><section className="p-card db-filters" aria-label="Filter">{(v.filters ?? []).map((f: any, k0: number) => (<Fragment key={k0}>
<button type="button" className="db-sel">
<span className="k">{f.k}</span>
<span className="v">{f.v}</span>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px", color: "var(--ink-muted)" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>
</Fragment>))}<div style={{ position: "relative" }}>
<button type="button" className="db-sel" aria-haspopup="true" aria-expanded={v.lvOpenStr} onClick={v.toggleLv}>
<span className="k">Level</span>
<span className="v">{v.lvSum}</span>
<span className="dots" aria-hidden="true">{(v.lvDots ?? []).map((d: any, k1: number) => (<Fragment key={k1}>
<i style={{ background: d.c }} />
</Fragment>))}</span>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px", color: "var(--ink-muted)" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>{(v.lvOpen) && (<>
<div className="p-pop db-lvpop" role="group" aria-label="Pilih level keparahan">{(v.lvChips ?? []).map((c: any, k2: number) => (<Fragment key={k2}>
<button type="button" role="checkbox" aria-checked={c.on} className="row" onClick={c.pick}>
<span className="cb" aria-hidden="true">
<svg viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
<path d="M5 12l4 4 10-10" />
</svg>
</span>
<i style={{ background: c.c }} />
<span style={{ flex: "1" }}>{c.n}</span>
<span className="p-cap">{c.cnt}</span>
</button>
</Fragment>))}<div className="ft">
<button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={v.lvAll}>Semua level</button>
<button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={v.toggleLv}>Selesai</button>
</div>
</div>
</>)}</div>
<span style={{ flex: "1" }} />{(v.isSkk) && (<>
<button type="button" className="db-tg" role="switch" aria-checked={v.dttStr} onClick={v.toggleDtt} title="Daerah Terbatas Terlarang. Belum diputuskan apakah dihitung sebagai insiden.">
<span className={`p-switch ${v.dttCls}`} aria-hidden="true" />Hitung DTT</button>
</>)}</section></>
  );
}
