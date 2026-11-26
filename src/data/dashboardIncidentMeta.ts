// Isian tambahan untuk insiden demo Dashboard (INC di src/data/dashboard.ts) yang belum ada di data desain:
// kondisi korban dan jam kejadian. Dipakai kartu Tabel insiden (kolom Meninggal, Luka, Korban, Waktu kejadian) dan
// halaman Detail insiden yang dibuat dari data dashboard (src/features/dashboard/openIncident.ts), supaya keduanya sama.
// Level insiden tidak diubah: korban meninggal hanya dipasang pada insiden yang sudah Kritis. Lihat DEVIATIONS D-TD2.
// PRODUKSI: korban dari isian pelapor (Kondisi korban + jumlah) dan rincian PIC saat penutupan, jam dari waktu kejadian.
import type { CasualtyKind } from '@/lib/severity';

export type CasualtyRecord = Partial<Record<CasualtyKind, number>>;

export interface DashCasualty {
  /** isian pelapor (Kondisi korban + jumlah orang) */
  pelapor: CasualtyRecord;
  /** rincian korban per tingkat cedera dari PIC saat penutupan (hanya insiden Ditutup) */
  pic?: CasualtyRecord;
}

/** Nomor insiden dashboard → kondisi korban. Insiden lain: tidak ada korban. */
export const DASH_CASUALTIES: Record<string, DashCasualty> = {
  // Kritis, korban meninggal
  'INS-SEN-2026-0017': { pelapor: { meninggal: 1 } },
  'INS-SEN-2026-0022': { pelapor: { meninggal: 1, berat: 1 } },
  // korban luka (P3K, klinik/RS, luka berat)
  'INS-SEN-2026-0009': { pelapor: { p3k: 1 }, pic: { p3k: 1, klinik: 1 } },
  'INS-LAP-2026-0009': { pelapor: { p3k: 2 } },
  'INS-SEN-2026-0015': { pelapor: { klinik: 1 } },
  'INS-BJE-2026-0006': { pelapor: { berat: 1 } },
  'INS-PGH-2026-0006': { pelapor: { p3k: 3 }, pic: { p3k: 2 } },
  // kondisi korban belum diketahui
  'INS-SEN-2026-0021': { pelapor: { belum: 1 } },
};

/** Jam kejadian demo (WIB, "HH:MM") yang tetap untuk satu nomor insiden. Data desain hanya punya tanggal. */
export function jamKejadian(no: string): string {
  let h = 0;
  for (const ch of no) h = (h * 31 + ch.charCodeAt(0)) % 100_003;
  return `${String(h % 24).padStart(2, '0')}:${String((h * 7) % 60).padStart(2, '0')}`;
}
