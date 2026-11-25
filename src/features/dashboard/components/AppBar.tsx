// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { downloadExcel } from '@/dc/download';
import { AnimNum } from '../anim';
import { PeriodSelect } from './PeriodSelect';

// S1
export function AppBar({ v }: { v: any }) {
  void routeHref; void downloadExcel; void Fragment; void AnimNum;
  return (
    <><header className="p-appbar top">
<div className="hdr">
<button type="button" className="p-sbtoggle" aria-expanded="true" aria-label="Perkecil sidebar">
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "18px", height: "18px" }}>
<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
</svg>
</button>
<div className="p-col ttl">
<h1>Dashboard insiden</h1>
<span className="sub">{v.subtitle}</span>
</div>
<div className="acts" style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative" }}>
<PeriodSelect />
<button type="button" className="p-btn p-btn-secondary p-btn-sm" aria-haspopup="menu" aria-expanded={v.dlStr} onClick={v.toggleDl}>
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
</svg>Unduh<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "16px", height: "16px" }}>
<path d="m6 9 6 6 6-6" />
</svg>
</button>{(v.dlOpen) && (<>
<div className="p-pop db-dl" role="menu" aria-label="Unduh">
<p className="hd">Mengikuti filter aktif: {v.dlScope}</p>
<button type="button" role="menuitem" className="it" onClick={() => { v.toggleDl(); window.open("/laporan", "_blank"); }}>
<span className="fi pdf" aria-hidden="true">PDF</span>
<span>
<b>Laporan PDF</b>
<span>5 halaman A4: ringkasan, peta, tren, jenis, wilayah, per KKKS, insiden Tinggi/Kritis</span>
</span>
</button>
<button type="button" role="menuitem" className="it" onClick={() => { v.toggleDl(); downloadExcel(); }}>
<span className="fi xls" aria-hidden="true">XLS</span>
<span>
<b>Data Excel</b>
<span>6 sheet: ringkasan, per wilayah, kategori × wilayah, rekap bulanan format SKK, daftar insiden</span>
</span>
</button>
</div>
</>)}</div>
<span className="p-vsep" aria-hidden="true" />
<div className="util">
<button type="button" className="p-ai">
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "15px", height: "15px" }}>
<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
</svg>
<span className="lbl">Tanya AI</span>
</button>
<button type="button" className="p-ibtn ghost p-bell" aria-label="Notifikasi">
<svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: "20px", height: "20px" }}>
<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
</svg>
</button>
</div>
</div>
</header></>
  );
}
