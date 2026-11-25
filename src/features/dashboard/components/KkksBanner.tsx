// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';

// S2
export function KkksBanner({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <>{(v.isKkks) && (<>
<div className="p-note" style={{ alignItems: "flex-start" }}>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
</svg>
<span>
<b>Hanya data organisasi Anda.</b> Peta terbuka di wilayah kerja PT Samudra Energi Nusantara. Data KKKS lain dan angka wilayah atau nasional tidak ditampilkan.</span>
</div>
</>)}</>
  );
}
