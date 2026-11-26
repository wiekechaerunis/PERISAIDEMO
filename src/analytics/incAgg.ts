// Satu fungsi agregasi untuk semua kartu Dashboard insiden (masukan 26 Nov: angka per bulan harus satu sumber).
// Masukan = baris insiden INC dalam cakupan filter halaman (sama dengan `tdInc` yang dipakai Tabel insiden).
// Dipakai oleh src/generated/DashboardLogic.ts (KPI, Tren per bulan, Insiden dan kerawanan, Jenis terbanyak,
// Status penanganan) lewat patch di scripts/dashboard-agg.mjs.

/** Baris INC: [nomor, area, kategori, level, status, lewat tenggat, tgl lapor, judul, lama tutup, bulan 0..5]. */
export type IncRow = readonly [string, string, number, number, number, number, string, string, number, number];

export interface IncAgg {
  n: number;
  /** jumlah insiden per bulan Jan..Jun 2026 */
  byMonth: number[];
  /** kerugian (juta) per bulan, dari `rpOf` per insiden */
  byMonthRp: number[];
  /** jumlah per indeks kategori CAT */
  byCat: number[];
  /** 0 Dalam penanganan, 1 Menunggu penutupan, 2 Ditutup */
  byStatus: number[];
  /** 0 Sangat rendah … 4 Kritis */
  byLv: number[];
}

export function aggInc(rows: readonly unknown[], rpOf?: (r: IncRow) => number, nCat = 7): IncAgg {
  const out: IncAgg = {
    n: 0, byMonth: [0, 0, 0, 0, 0, 0], byMonthRp: [0, 0, 0, 0, 0, 0],
    byCat: Array.from({ length: nCat }, () => 0), byStatus: [0, 0, 0], byLv: [0, 0, 0, 0, 0],
  };
  for (const x of rows) {
    const r = x as IncRow;
    out.n++;
    out.byMonth[r[9]]++;
    if (rpOf) out.byMonthRp[r[9]] += rpOf(r);
    out.byCat[r[2]] = (out.byCat[r[2]] ?? 0) + 1;
    out.byStatus[r[4]]++;
    out.byLv[r[3]]++;
  }
  return out;
}
