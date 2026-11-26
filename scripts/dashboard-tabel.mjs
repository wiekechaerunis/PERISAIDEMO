// Kartu "Tabel insiden" (TabelDrill, board TD0–TD8 canvas Desain v2, 26 Nov) menggantikan matriks "Kategori × wilayah".
// Dipasang oleh scripts/dc-to-tsx.mjs:
// - SOURCE_PATCHES mengubah sumber design/dashboard/Dashboard.dc.html sebelum diterjemahkan: CSS matriks dibuang dan
//   section matriks diganti wadah kosong `div.c12` (split 0/1/1/3/8 = IncidentDrillTable, komponen tulisan tangan).
// - TABLE_LOGIC_PATCHES membuang logika matriks dan mengekspor `tdInc` (insiden dalam cakupan filter halaman, dengan
//   kerugian per insiden) dan `tdApply` (pasang filter halaman). Tabel dihitung di src/analytics/tabelDrill.ts.
// Logika pivot Desain v2 sebelumnya (state `tb`, prop `tabel`) tidak dipakai lagi (catatan TD0 #4). Lihat DEVIATIONS D-TD*.

const TD_LOGIC = String.raw`    // ===== Tabel insiden (TabelDrill): insiden dalam cakupan filter halaman, untuk src/analytics/tabelDrill.ts =====
    // Kerugian per insiden: data demo belum punya kerugian per insiden, jadi kerugian area setelah filter (angka yang sama
    // dengan KPI Kerugian) dibagi rata ke insiden area itu. Disimpan per baris, bukan per nomor. PRODUKSI: dari data layer.
    const tdRp = new Map();
    { const cnt = {}; incS.forEach((r) => { cnt[r[1]] = (cnt[r[1]] || 0) + 1; }); const aRp = {}; SC.forEach((a) => { aRp[a.id] = a.rp; }); incS.forEach((r) => { tdRp.set(r, (aRp[r[1]] || 0) / cnt[r[1]]); }); }
    const tdInc = incS.map((r) => { const a = AREA[r[1]]; return { id: r[0], t: r[7], katI: r[2], kat: CAT[r[2]][0], wilKey: a[1], wil: W[a[1]].n, kk: a[7], wk: a[8], areaId: a[0], area: a[2], lv: r[3], st: r[4], tgl: r[6], m: r[9], rp: tdRp.get(r) || 0 }; });`;

/** [cari, ganti] pada teks .dc.html */
export const SOURCE_PATCHES = [
  [/\.db-mx\{[^\n]*\n(?:\.db-mx [^\n]*\n)*/, () => ''],
  [/        <section class="p-card c12">\n          <div class="lk-card-head"><div style="display: flex; flex-direction: column; gap: 2px"><h2 class="p-h2">\{\{mxTitle\}\}[\s\S]*?<\/section>/, () => '        <div class="c12" aria-label="Tabel insiden"></div>'],
];

/** [cari, ganti] pada kelas logika (dipasang sebelum PERIOD_PATCHES) */
export const TABLE_LOGIC_PATCHES = [
  [/    \/\/ ===== matriks =====[\s\S]*?\n    \}\n\n(    \/\/ ===== filter aktif =====)/, (_, tail) => TD_LOGIC + '\n\n' + tail],
  [/      mxTitle:[^\n]*\n      mxCap:[^\n]*\n      mxCols, mxRows,/, () => '      tdInc, tdSkk: skk, tdApply: (patch) => this.setState(patch),'],
];
