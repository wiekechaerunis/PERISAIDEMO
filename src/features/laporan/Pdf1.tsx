// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
export function Pdf1() {
  return (
    <><div className="pg">
<div className="top">
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
<span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".06em", color: "var(--ink-muted)" }}>PERISAI · SKK MIGAS</span>
<h1>Laporan Insiden Keamanan Hulu Migas</h1>
<p style={{ color: "var(--ink-subtle)" }}>Semester I 2026 (1 Jan – 30 Jun 2026) · Seluruh wilayah SKK</p>
</div>
<div className="meta">Data per 25 Nov 2026, 08.00 WIB<br />Diunduh oleh Hendra Wijaya (Pengawas SKK)<br />Filter: semua KKKS, semua kategori, semua level<br />DTT tidak dihitung</div>
</div>
<div className="ai">
<span className="tg">Ringkasan dibuat AI · dicek ulang sebelum dibagikan</span>
<p>Semester I 2026 mencatat 106 insiden terverifikasi dengan kerugian Rp1,41 M, naik 15% dari Semester II 2025. Sumbagsel menyumbang 63% kerugian walau hanya 36% insiden; kedua insiden Kritis ada di Musi Banyuasin. Pencurian/Perampokan tetap kategori terbanyak (80), terutama di Sumbagut. Pamalu belum mengirim laporan apa pun, jadi angka 0 di wilayah itu belum bisa dibaca sebagai aman.</p>
</div>
<div className="kp">
<div>
<span>Insiden terverifikasi</span>
<b>106</b>
<i>▲ 15% vs Sem. II 2025 (92)</i>
</div>
<div>
<span>Kerugian</span>
<b>Rp1,41 M</b>
<i>▲ 28% vs Sem. II 2025 (Rp1,10 M)</i>
</div>
<div>
<span>{"Tinggi & Kritis"}</span>
<b>16</b>
<i>5 masih terbuka · 4 insiden lewat tenggat</i>
</div>
<div>
<span>KKKS melapor (Jun)</span>
<b>14 / 131</b>
<i>7–14 KKKS per bulan</i>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<h2>Peta insiden</h2>
<div className="mp">
<img src="/peta/id-prov.svg" alt="" aria-hidden="true" />
<span className="ht" style={{ left: "6.48%", top: "9.65%", width: "3%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 55%, transparent), transparent)" }} />
<span className="ht" style={{ left: "7.65%", top: "14.45%", width: "3.4%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 68%, transparent), transparent)" }} />
<span className="ht" style={{ left: "14.66%", top: "27.60%", width: "2.6%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-medium-dot) 45%, transparent), transparent)" }} />
<span className="ht" style={{ left: "15.34%", top: "29.85%", width: "3.2%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 65%, transparent), transparent)" }} />
<span className="ht" style={{ left: "19.54%", top: "48.35%", width: "3.3%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-critical-dot) 66%, transparent), transparent)" }} />
<span className="ht" style={{ left: "21.83%", top: "48.27%", width: "2.8%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 55%, transparent), transparent)" }} />
<span className="ht" style={{ left: "20.02%", top: "53.83%", width: "2.7%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 50%, transparent), transparent)" }} />
<span className="ht" style={{ left: "19.99%", top: "40.40%", width: "2.5%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 45%, transparent), transparent)" }} />
<span className="ht" style={{ left: "29.11%", top: "68.58%", width: "2.5%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 45%, transparent), transparent)" }} />
<span className="ht" style={{ left: "27.39%", top: "67.80%", width: "2.5%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-high-dot) 45%, transparent), transparent)" }} />
<span className="ht" style={{ left: "36.71%", top: "73.05%", width: "2.2%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-low-dot) 35%, transparent), transparent)" }} />
<span className="ht" style={{ left: "38.39%", top: "72.40%", width: "2.2%", background: "radial-gradient(circle closest-side, color-mix(in srgb, var(--sev-low-dot) 32%, transparent), transparent)" }} />
</div>
<div className="lg">
<span>
<b>Warna = level tertinggi:</b>
</span>
<span>
<i style={{ background: "var(--ink-subtle)" }} />Sangat rendah</span>
<span>
<i style={{ background: "var(--sev-low-dot)" }} />Rendah</span>
<span>
<i style={{ background: "var(--sev-medium-dot)" }} />Sedang</span>
<span>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
<span>
<i style={{ background: "var(--sev-critical-dot)" }} />Kritis</span>
<span>· makin pekat makin banyak insiden</span>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<h2>Per wilayah SKK</h2>
<table>
<thead>
<tr>
<th>Wilayah</th>
<th className="r">Insiden</th>
<th className="r">Kerugian</th>
<th className="r">Porsi insiden · kerugian</th>
<th>Level tertinggi</th>
<th className="r">KKKS melapor (Jun)</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<b>Sumbagut</b>
</td>
<td className="r">51</td>
<td className="r">Rp239 jt</td>
<td className="r">48% · 17%</td>
<td>Tinggi</td>
<td className="r">4 dari 24</td>
</tr>
<tr>
<td>
<b>Sumbagsel</b>
</td>
<td className="r">38</td>
<td className="r">Rp891 jt</td>
<td className="r">36% · 63%</td>
<td>Kritis</td>
<td className="r">4 dari 31</td>
</tr>
<tr>
<td>
<b>Pusat</b>
</td>
<td className="r">14</td>
<td className="r">Rp282 jt</td>
<td className="r">13% · 20%</td>
<td>Tinggi</td>
<td className="r">3 dari 18</td>
</tr>
<tr>
<td>
<b>Jabanusa</b>
</td>
<td className="r">3</td>
<td className="r">Rp0</td>
<td className="r">3% · 0%</td>
<td>Rendah</td>
<td className="r">2 dari 20</td>
</tr>
<tr>
<td>
<b>Kalsul</b>
</td>
<td className="r">0</td>
<td className="r">Rp0</td>
<td className="r">0% · 0%</td>
<td>Tidak ada</td>
<td className="r">1 dari 26 (nihil)</td>
</tr>
<tr>
<td>
<b>Pamalu</b>
</td>
<td className="r">–</td>
<td className="r">–</td>
<td className="r">–</td>
<td>Belum ada laporan</td>
<td className="r">0 dari 12</td>
</tr>
<tr>
<td>
<b>Total</b>
</td>
<td className="r">
<b>106</b>
</td>
<td className="r">
<b>Rp1,41 M</b>
</td>
<td className="r" />
<td />
<td className="r">
<b>14 dari 131</b>
</td>
</tr>
</tbody>
</table>
</div>
<div className="ft">
<span>Hanya insiden terverifikasi. Angka sama dengan dashboard pada waktu unduh. Batas wilayah: Kemendagri 2025 (cahyadsn/wilayah_boundaries, MIT). Angka demo.</span>
<span>Halaman 1 dari 5</span>
</div>
</div></>
  );
}
