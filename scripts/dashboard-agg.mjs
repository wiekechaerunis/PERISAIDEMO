// Satu sumber angka untuk Dashboard insiden (masukan 26 Nov): sebelumnya Tren per bulan, Insiden dan kerawanan, dan
// Jenis terbanyak memakai angka tetap dari desain (diskalakan), dan kartu angka dengan filter Kategori memakai alokasi
// matriks desain, sehingga total per bulan berbeda dari Tabel insiden. Patch ini membuat semua kartu dihitung dari
// insiden yang sama (`incS`, juga sumber `tdInc` Tabel insiden) lewat aggInc (src/analytics/incAgg.ts).
// Dipasang oleh scripts/dc-to-tsx.mjs setelah PERIOD_PATCHES, jadi teks yang dicocokkan adalah hasil patch sebelumnya.

/** [cari, ganti] pada kelas logika */
export const AGG_PATCHES = [
  // kartu angka + peta: level per area dari INC (juga saat filter Kategori), bukan alokasi matriks desain
  [/^ *let lv = pFull \? a\[5\]\.slice\(\)[^\n]*\n *if \(catIdx >= 0 && catIdx < CAT\.length\) lv = alloc[^\n]*\n/m,
    () => '      let lv = aggInc(INCP.filter((r) => r[1] === a[0] && (catIdx < 0 || catIdx >= CAT.length || r[2] === catIdx)), undefined, CAT.length).byLv;\n'],
  // agregat bersama, tepat setelah incS
  [/^( *const incS = [^\n]*\n)/m, (_, line) => line + String.raw`    // Kerugian per insiden: data demo belum punya kerugian per insiden, jadi kerugian area setelah filter (angka yang sama
    // dengan KPI Kerugian) dibagi rata ke insiden area itu. Disimpan per baris, bukan per nomor. PRODUKSI: dari data layer.
    const tdRp = new Map();
    { const cnt = {}; incS.forEach((r) => { cnt[r[1]] = (cnt[r[1]] || 0) + 1; }); const aRp = {}; SC.forEach((a) => { aRp[a.id] = a.rp; }); incS.forEach((r) => { tdRp.set(r, (aRp[r[1]] || 0) / cnt[r[1]]); }); }
    // Satu sumber (src/analytics/incAgg.ts): Tren per bulan, Insiden dan kerawanan, Status penanganan, Tabel insiden = incS.
    // Jenis terbanyak memakai cakupan yang sama tanpa filter Kategori (supaya jenis lain tetap terlihat).
    const AG = aggInc(incS, (r) => tdRp.get(r) || 0, CAT.length);
    const AGc = aggInc(INCP.filter((r) => scIds.includes(r[1]) && s.lv[r[3]]), undefined, CAT.length);
`],
  // tdRp sekarang dihitung di atas (dipakai juga oleh Tren per bulan)
  [/(\/\/ ===== Tabel insiden \(TabelDrill\)[^\n]*\n) *\/\/ Kerugian per insiden: data demo belum[^\n]*\n *\/\/ dengan KPI Kerugian\)[^\n]*\n *const tdRp = new Map\(\);\n *\{ const cnt = \{\}; incS[^\n]*\n/, (_, head) => head],
  [/^ *const stA = [^\n]*\n/m, () => '    const stA = AG.byStatus;\n'],
  // Tren per bulan: jumlah dan kerugian per bulan dari insiden (tidak lagi angka desain diskalakan)
  [/^ *const vN = pFull [^\n]*\n/m, () => '    const vN = AG.byMonth.slice();\n'],
  [/^ *const rMo = pFull [^\n]*\n/m, () => '    const rMo = AG.byMonthRp.map((x) => Math.round(x));\n'],
  // catatan tren dihitung dari angka (catatan kurasi desain memakai angka lama)
  [/^ *const curated = \(isNat \|\| isOwn\) && pFull;\n/m, () => '    const curated = false;\n'],
  // Insiden dan kerawanan: batang insiden = Tren per bulan; kerawanan memakai rasio desain per bulan
  [/^ *const fS = [^\n]*\n *const KR = \(skk \? (\[[^\]]*\]) : (\[[^\]]*\])\)[^\n]*\n *const IN = \(skk \? (\[[^\]]*\]) : (\[[^\]]*\])\)[^\n]*\n/m,
    (_, k1, k2, i1, i2) => `    const IN0 = skk ? ${i1} : ${i2};\n    const KR = (skk ? ${k1} : ${k2}).map((v, i) => Math.round(v / IN0[i] * vN[i]));\n    const IN = vN.slice();\n`],
  // Jenis terbanyak: jumlah per kategori dari insiden
  [/^ *let v = catScope\(c\);[^\n]*\n *if \(v == null\) \{[^\n]*\n/m, () => '      const v = AGc.byCat[i];\n'],
];
