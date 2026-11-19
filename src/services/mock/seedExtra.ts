import type { Incident, Kerawanan } from '../types';

/**
 * Data tambahan untuk daftar/tugas yang tidak ada di seed.ts (seed.ts tidak diubah).
 * Permintaan: bila ingin dipakai juga oleh halaman detail, gabungkan ke seedState().
 */

/** Insiden KKKS lain yang tampil di daftar SKK (board I31-DaftarSKK). Hanya terlihat oleh peran SKK. */
export const EXTRA_INCIDENTS: Incident[] = [
  {
    no: 'INS-RMB-2026-0012', title: 'Penembakan pos jaga oleh OTK', category: 'Serangan fisik',
    location: 'Pos jaga WK Lembah Timur', area: 'Mimika · WK Lembah Timur', wk: 'WK Lembah Timur', org: 'PT Rimba Bumi Energi',
    severity: 'kritis', occurredAt: '2026-10-22T23:10:00', status: 'dalam-penanganan', pic: null, reporter: 'Petugas KKKS',
  },
  {
    no: 'INS-PRA-2026-0031', title: 'Pencurian pipa bekas di gudang', category: 'Pencurian/Perampokan',
    location: 'Gudang material', area: 'Kutai Kartanegara · WK Delta', wk: 'WK Delta', org: 'PT Pesisir Raya Energi',
    severity: 'sedang', occurredAt: '2026-10-20T04:00:00', status: 'ditutup', pic: null, reporter: 'Petugas KKKS',
  },
];

/** Tanggal penutupan untuk kolom Tenggat (P11: "ditutup 26 Okt"). */
export const CLOSED_AT: Record<string, string> = {
  'INS-SEN-2026-0004': '2026-10-26T10:00:00',
};

/** Tampilan Kerawanan per board `Kerawanan.dc.html` (K.1). Dipakai sebagai overlay atas seed.kerawanan. */
export interface KerawananBoardRow {
  title: string;
  kind: string;
  loc: string;
  when: string;
  ago: string;
  rep: string;
  src: string;
  worsening?: boolean;
}
export const KERAWANAN_BOARD: Record<string, KerawananBoardRow> = {
  'KRW-SEN-2026-0047': { title: 'Pagar sisi barat sumur ADR-07 roboh', kind: 'Kondisi rawan', loc: 'Sumur ADR-07 · Musi Banyuasin', when: '18 Nov 2026, 07:20', ago: '3 jam lalu', rep: 'Budi Santoso', src: 'Patroli', worsening: true },
  'KRW-SEN-2026-0046': { title: 'Upaya pemotongan pipa idle digagalkan', kind: 'Upaya digagalkan', loc: 'Jalur pipa SP Batu Ampar KM 12', when: '18 Nov 2026, 02:40', ago: '8 jam lalu', rep: 'Budi Santoso', src: 'Patroli' },
  'KRW-SEN-2026-0045': { title: 'Lampu jalan akses SP padam', kind: 'Kondisi rawan', loc: 'Jalan akses SP Batu Ampar', when: '17 Nov 2026, 19:05', ago: 'Kemarin', rep: 'Rina Lestari', src: 'Laporan warga' },
  'KRW-SEN-2026-0044': { title: 'Gembok gerbang sumur ADR-07 rusak', kind: 'Kondisi rawan', loc: 'Sumur ADR-07 · Musi Banyuasin', when: '17 Nov 2026, 16:10', ago: 'Kemarin', rep: 'Budi Santoso', src: 'Patroli' },
  'KRW-SEN-2026-0043': { title: 'Motor tanpa pelat berhenti lama dekat sumur', kind: 'Kejadian tanpa dampak', loc: 'Sumur ADR-07 · Musi Banyuasin', when: '17 Nov 2026, 13:25', ago: 'Kemarin', rep: 'Budi Santoso', src: 'Patroli' },
  'KRW-SEN-2026-0042': { title: 'Kamera CCTV sisi timur terminal mati', kind: 'Kondisi rawan', loc: 'Terminal Arunika · Musi Banyuasin', when: '17 Nov 2026, 10:30', ago: 'Kemarin', rep: 'Rina Lestari', src: 'CCTV' },
  'KRW-SEN-2026-0041': { title: 'Warga masuk jalur pipa tanpa izin', kind: 'Kejadian tanpa dampak', loc: 'Jalur pipa SP Batu Ampar KM 9', when: '17 Nov 2026, 08:15', ago: 'Kemarin', rep: 'Rina Lestari', src: 'Laporan warga' },
  'KRW-SEN-2026-0040': { title: 'Orang tak dikenal memotret panel listrik', kind: 'Kejadian tanpa dampak', loc: 'Sumur ADR-05 · Musi Banyuasin', when: '15 Nov 2026, 16:30', ago: '3 hari lalu', rep: 'Budi Santoso', src: 'CCTV' },
};

/**
 * Isi detail kerawanan (fase 5; board KD1/KD3/KD4). Menimpa kolom deskriptif seed.kerawanan lewat `resolveKerawanan`
 * (workflow.kerawanan.ts). KRW-0047 mengikuti board; yang lain memakai KERAWANAN_BOARD + nilai bawaan.
 */
export const KERAWANAN_DETAIL: Record<string, Partial<Kerawanan>> = {
  'KRW-SEN-2026-0047': {
    kind: 'Kondisi rawan',
    observedAt: '2026-11-18T07:20:00',
    recordedAt: '2026-11-18T07:32:00',
    story:
      'Pagar sisi barat sumur ADR-07 roboh sepanjang ±6 m setelah hujan deras. Area sumur bisa dimasuki dari kebun warga. Sudah dipasang garis pembatas sementara.',
    patokan: 'Sumur ADR-07, pagar sisi barat',
    source: 'Patroli',
    lat: -2.98512,
    lng: 104.04213,
    area: 'Kab. Musi Banyuasin · Dalam WK Andalas Darat',
    attachments: [{ name: 'pagar-barat-adr07.jpg', sizeKb: 1843, caption: 'Pagar roboh dilihat dari kebun warga' }],
  },
};

/** Isian awal formulir Naikkan/Ajukan (board KD3/KD5 menampilkan form yang sudah terisi untuk kasus kanonik). */
export interface RaiseDefaults {
  /** judul insiden setelah dinaikkan (KD4) */
  title: string;
  securityImpact: string;
  lossIdr: number;
  reason: string;
}
export const RAISE_DEFAULTS: Record<string, RaiseDefaults> = {
  'KRW-SEN-2026-0047': {
    title: 'Pagar sisi barat sumur ADR-07 roboh, kabel panel hilang',
    securityImpact: 'Pagar dijebol dan kabel panel pompa ±10 m hilang. Pompa masih menyala.',
    lossIdr: 4_500_000,
    reason: 'Saat dicek ulang pukul 09:50, pagar ternyata dijebol dan kabel panel pompa ±10 m hilang.',
  },
};

/** Kerawanan yang masuk email ringkasan harian EK.1 (17 Nov 07:00 s.d. 18 Nov 07:00 WIB), urut dari terbaru. */
export const RINGKASAN_NOS = [
  'KRW-SEN-2026-0046', 'KRW-SEN-2026-0045', 'KRW-SEN-2026-0044', 'KRW-SEN-2026-0043', 'KRW-SEN-2026-0042', 'KRW-SEN-2026-0041',
];
