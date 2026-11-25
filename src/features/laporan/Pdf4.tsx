// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
export function Pdf4() {
  return (
    <><div className="pg">
<div className="top" style={{ paddingBottom: "8px", borderBottomWidth: "1px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: ".06em", color: "var(--ink-muted)" }}>LAPORAN INSIDEN KEAMANAN · SEMESTER I 2026</span>
<h1 style={{ fontSize: "18px", lineHeight: "24px" }}>Per KKKS dan status penanganan</h1>
</div>
<div className="meta">Data per 25 Nov 2026, 08.00 WIB<br />Seluruh wilayah · DTT tidak dihitung</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<h2>Per KKKS</h2>
<table>
<thead>
<tr>
<th>KKKS · wilayah · WK</th>
<th className="r">Insiden</th>
<th className="r">Kerugian</th>
<th>Level tertinggi</th>
<th className="r">{"Tinggi & Kritis"}</th>
<th className="r">Masih terbuka</th>
<th className="r">Lewat tenggat</th>
<th className="r">Median penanganan</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<b>PT Samudra Energi Nusantara</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagsel · WK Andalas Darat, WK Batu Ampar</span>
</td>
<td className="r">24</td>
<td className="r">Rp730 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-critical-bg)", color: "var(--sev-critical-ink)" }}>
<i style={{ background: "var(--sev-critical-dot)" }} />Kritis</span>
</td>
<td className="r">8</td>
<td className="r">10</td>
<td className="r up">2</td>
<td className="r">7 hari</td>
</tr>
<tr>
<td>
<b>PT Lintas Andalas Petro</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagut · WK Lintas Selatan, WK Lintas Utara</span>
</td>
<td className="r">21</td>
<td className="r">Rp139 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">2</td>
<td className="r">4</td>
<td className="r">0</td>
<td className="r">7 hari</td>
</tr>
<tr>
<td>
<b>PT Deli Raya Hulu</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagut · WK Deli Hilir</span>
</td>
<td className="r">17</td>
<td className="r">Rp60 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">3</td>
<td className="r up">1</td>
<td className="r">7 hari</td>
</tr>
<tr>
<td>
<b>PT Serambi Utara Energi</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagut · WK Serambi Timur</span>
</td>
<td className="r">13</td>
<td className="r">Rp40 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">6 hari</td>
</tr>
<tr>
<td>
<b>PT Lembayung Petro</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagsel · WK Lembayung Hulu</span>
</td>
<td className="r">8</td>
<td className="r">Rp120 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">2</td>
<td className="r">0</td>
<td className="r">7 hari</td>
</tr>
<tr>
<td>
<b>PT Citarum Energi</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Pusat · WK Citarum Hilir</span>
</td>
<td className="r">7</td>
<td className="r">Rp132 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">6 hari</td>
</tr>
<tr>
<td>
<b>PT Pantura Gas Hulu</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Pusat · WK Pantura Pesisir</span>
</td>
<td className="r">7</td>
<td className="r">Rp150 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">6 hari</td>
</tr>
<tr>
<td>
<b>PT Bara Jambi Energi</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Sumbagsel · WK Bara Timur</span>
</td>
<td className="r">6</td>
<td className="r">Rp41 jt</td>
<td>
<span className="sv" style={{ background: "var(--sev-high-bg)", color: "var(--sev-high-ink)" }}>
<i style={{ background: "var(--sev-high-dot)" }} />Tinggi</span>
</td>
<td className="r">1</td>
<td className="r">3</td>
<td className="r up">1</td>
<td className="r">4 hari</td>
</tr>
<tr>
<td>
<b>PT Tanjung Mas Hulu</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Jabanusa · WK Bengawan Tengah</span>
</td>
<td className="r">2</td>
<td className="r">Rp0</td>
<td>
<span className="sv" style={{ background: "var(--sev-low-bg)", color: "var(--sev-low-ink)" }}>
<i style={{ background: "var(--sev-low-dot)" }} />Rendah</span>
</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">7 hari</td>
</tr>
<tr>
<td>
<b>PT Gresik Samudra Hulu</b>
<br />
<span style={{ color: "var(--ink-muted)", fontSize: "10px" }}>Jabanusa · WK Bengawan Hilir</span>
</td>
<td className="r">1</td>
<td className="r">Rp0</td>
<td>
<span className="sv" style={{ background: "var(--sev-low-bg)", color: "var(--sev-low-ink)" }}>
<i style={{ background: "var(--sev-low-dot)" }} />Rendah</span>
</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">0</td>
<td className="r">10 hari</td>
</tr>
</tbody>
</table>
<p style={{ fontSize: "10px", color: "var(--ink-muted)" }}>10 dari 131 KKKS memiliki insiden terverifikasi pada periode ini. KKKS tanpa insiden tidak ditampilkan; kelengkapan laporan ada di halaman 3.</p>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<h2>Status penanganan</h2>
<div className="kp" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
<div>
<span>Dalam penanganan</span>
<b>14</b>
</div>
<div>
<span>Menunggu penutupan</span>
<b>8</b>
</div>
<div>
<span>Ditutup</span>
<b>84</b>
</div>
<div>
<span>Lewat tenggat</span>
<b style={{ color: "var(--sev-critical-ink)" }}>4</b>
</div>
<div>
<span>Median lama penanganan</span>
<b>7 hari</b>
</div>
</div>
</div>
<div className="ft">
<span>Hanya insiden terverifikasi. Angka sama dengan dashboard pada waktu unduh. Angka demo.</span>
<span>Halaman 4 dari 5</span>
</div>
</div></>
  );
}
