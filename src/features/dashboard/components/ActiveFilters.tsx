// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S4
export function ActiveFilters({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <>{(v.hasAf) && (<>
<div className="db-af" style={{ marginTop: "-8px" }}>
<span className="p-cap">Filter aktif:</span>{(v.af ?? []).map((a: any, k3: number) => (<Fragment key={k3}>
<button type="button" className="x" onClick={a.clear} aria-label={`Hapus filter ${a.l}`}>{a.l}<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "14px", height: "14px" }}>
<path d="M18 6 6 18M6 6l12 12" />
</svg>
</button>
</Fragment>))}<button type="button" className="db-clr" onClick={v.clearAll}>Hapus semua</button>
</div>
</>)}</>
  );
}
