// Tambahan data demo Dashboard (permintaan 25 Nov 2026: sebaran insiden lebih luas di peta). Desain hanya memuat area di
// Sumatra dan Jawa; ini menambah area di Kalimantan, Sulawesi, Jawa Timur, Jambi, dan Lampung beserta insidennya.
// Dipasang oleh scripts/dc-to-tsx.mjs di akhir src/data/dashboard.ts. Peta per area (wk-, wkl-, wka-, l-*.svg) dibuat oleh
// scripts/dashboard-extra-svg.mjs. Pamalu tetap "belum melapor" sesuai cerita desain.

/** [id, wilayah, nama, x, y, jumlah per level (Sangat rendah..Kritis), kerugian (jt), KKKS, WK, kode nomor] */
type ExtraArea = [string, string, string, number, number, number[], number, string, string, string];
export const EXTRA_AREAS: ExtraArea[] = [
  ['kkr', 'kls', 'Kutai Kartanegara', 488.3, 137.9, [1, 3, 3, 1, 0], 180, 'PT Mahakam Delta Energi', 'WK Mahakam Hilir', 'MDE'],
  ['btg', 'kls', 'Bontang', 503.2, 107.1, [1, 2, 1, 0, 0], 35, 'PT Mahakam Delta Energi', 'WK Bontang Pesisir', 'MDE'],
  ['tbl', 'kls', 'Tabalong', 462.1, 182.9, [0, 2, 2, 1, 0], 90, 'PT Barito Raya Petro', 'WK Barito Utara', 'BRP'],
  ['bgi', 'kls', 'Banggai', 618.4, 172.2, [1, 2, 2, 1, 1], 260, 'PT Senoro Gas Sulawesi', 'WK Matindok', 'SGS'],
  ['wjo', 'kls', 'Wajo', 576.4, 229.9, [0, 2, 1, 0, 0], 28, 'PT Sengkang Energi', 'WK Sengkang', 'SKE'],
  ['smp', 'jbn', 'Sumenep', 413.9, 286.1, [1, 2, 1, 0, 0], 45, 'PT Madura Lepas Pantai', 'WK Madura Timur', 'MLP'],
  ['sda', 'jbn', 'Sidoarjo', 396.1, 302.2, [0, 1, 1, 1, 0], 70, 'PT Brantas Hulu', 'WK Brantas', 'BRH'],
  ['jbi', 'sbs', 'Batanghari', 173.3, 186.5, [1, 2, 1, 0, 0], 30, 'PT Bara Jambi Energi', 'WK Bara Barat', 'BJE'],
  ['lmp', 'sbs', 'Lampung Timur', 223.4, 259, [0, 1, 2, 0, 0], 25, 'PT Sekampung Energi', 'WK Sekampung', 'SKP'],
];

/** Lokasi aset per area (fasilitas, stasiun, jalur pipa), sejajar dengan wka-*.svg. */
export const EXTRA_SITES = Object.fromEntries(
  EXTRA_AREAS.map(([id, , , x, y]) => [id, [[+(x - 3.6).toFixed(2), +(y + 2.4).toFixed(2), 'fas'], [+(x + 3.2).toFixed(2), +(y - 2.6).toFixed(2), 'sta'], [+(x - 0.1).toFixed(2), +y.toFixed(2), 'pipa']]]),
);

/** Kategori per area (indeks CAT), dipakai berurutan untuk insiden area itu; jumlah per wilayah ikut ditambahkan ke CAT. */
const AREA_CATS: Record<string, number[]> = {
  kkr: [0, 0, 0, 3, 3, 4, 0, 2], btg: [0, 3, 4, 0], tbl: [0, 2, 0, 2, 3], bgi: [4, 4, 0, 3, 0, 5, 6], wjo: [0, 2, 6],
  smp: [0, 4, 6, 0], sda: [4, 0, 6], jbi: [0, 1, 0, 2], lmp: [1, 0, 0],
};

const TITLE = [
  ['Pencurian kabel listrik di area sumur', 'Pencurian peralatan kerja di gudang lapangan', 'Perampokan kendaraan logistik', 'Pencurian pipa bekas di lokasi proyek'],
  ['Pengeboran liar di sekitar sumur tua'],
  ['Sambungan ilegal pada jalur pipa', 'Penyadapan pipa minyak oleh pihak luar'],
  ['Penghentian kegiatan oleh warga sekitar', 'Pemblokiran akses jalan ke lokasi'],
  ['Unjuk rasa terkait kompensasi lahan', 'Unjuk rasa menuntut rekrutmen tenaga lokal'],
  ['Kebakaran lahan dekat fasilitas produksi'],
  ['Perusakan pagar dan papan peringatan', 'Perusakan CCTV di gerbang fasilitas'],
];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

/**
 * Baris insiden: [nomor, area, kategori, level, status, lewat tenggat, tgl lapor, judul, lama tutup (hari), bulan].
 * Nomor per KKKS melanjutkan nomor yang sudah ada di `existing` (mis. PT Bara Jambi Energi punya WK di tjb dan jbi,
 * keduanya berkode BJE), supaya tidak ada nomor dobel.
 */
export function extraIncidents(existing: unknown[][] = []) {
  const rows: (string | number)[][] = [];
  const seq: Record<string, number> = {};
  existing.forEach((r) => {
    const m = /^INS-([A-Z]+)-2026-(\d+)$/.exec(String(r[0]));
    if (m) seq[m[1]] = Math.max(seq[m[1]] ?? 0, Number(m[2]));
  });
  let k = 0;
  EXTRA_AREAS.forEach((a) => {
    const cats = AREA_CATS[a[0]];
    let ci = 0;
    a[5].forEach((cnt, lv) => {
      for (let j = 0; j < cnt; j++) {
        const cat = cats[ci++ % cats.length];
        const m = (k * 5 + lv) % 6;
        const day = 2 + ((k * 7) % 26);
        const st = k % 3 === 0 ? 0 : k % 3 === 1 ? 2 : 1;
        const late = st === 0 && lv >= 3 && k % 2 === 0 ? 1 : 0;
        seq[a[9]] = (seq[a[9]] ?? 0) + 1;
        const t = TITLE[cat][k % TITLE[cat].length];
        rows.push([`INS-${a[9]}-2026-${String(seq[a[9]]).padStart(4, '0')}`, a[0], cat, lv, st, late, `${day} ${MON[m]}`, t, 4 + (k % 9), m]);
        k++;
      }
    });
  });
  return rows;
}

/**
 * Bulan kejadian yang dipindah (masukan 26 Nov): sebaran bulan insiden KKKS (PT Samudra Energi Nusantara) disamakan
 * dengan kartu Tren per bulan di desain (3, 4, 3, 5, 5, 4). Hanya tanggal lapor dan bulan yang diubah; kategori, level,
 * status, dan jumlah tetap. Sebelum: 4, 2, 3, 3, 6, 6.
 */
export const MONTH_MOVES: Record<string, string> = {
  'INS-SEN-2026-0003': '3 Feb', // dari 21 Jan
  'INS-SEN-2026-0013': '10 Feb', // dari 10 Mei
  'INS-SEN-2026-0023': '14 Apr', // dari 24 Jun
  'INS-SEN-2026-0024': '21 Apr', // dari 25 Jun
};

/** Pasang tambahan ke data desain: area, insiden, hitungan kategori per wilayah, dan status wilayah Kalsul. */
type Cat = [string, Record<string, number>, Record<string, number>];
export function extendDashboard({ A0, INC, CAT, W }: { A0: unknown[][]; INC: unknown[][]; CAT: Cat[]; W: Record<string, { none?: boolean; rep: number }> }) {
  if (A0.some((a) => a[0] === EXTRA_AREAS[0][0])) return;
  INC.forEach((r) => {
    const t = MONTH_MOVES[String(r[0])];
    if (t) { r[6] = t; r[9] = MON.indexOf(t.split(' ')[1]); }
  });
  EXTRA_AREAS.forEach((a) => A0.push(a.slice(0, 9)));
  const inc = extraIncidents(INC);
  INC.push(...inc);
  inc.forEach((r) => {
    const w = EXTRA_AREAS.find((a) => a[0] === r[1])![1];
    const c = CAT[r[2] as number][1];
    c[w] = (c[w] || 0) + 1;
  });
  W.kls.none = false;
  W.kls.rep = 4;
  W.jbn.rep += 2;
  W.sbs.rep += 1;
}
