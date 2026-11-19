// Riwayat insiden Ditutup (data demo) untuk panel "Bahan pertimbangan dari insiden serupa" di layar Review.
// Terpisah dari seed.ts supaya daftar dan hitungan board tidak berubah. Tidak masuk store; dibaca similar.ts.
// Angka median yang dituju (board V12): operasi berhenti 14 jam, kerugian Rp16,8 jt, lama penanganan 2,5 hari.
import type { Incident, IncidentDetail } from '../types';
import { ORG } from './seed';

const WK = 'WK Andalas Darat';
/** titik acuan peta (Sumur ADR-07); skala dipakai bersama similar.ts */
export const MAP_REF = { lat: -2.98512, lng: 104.04213, pxPerDeg: 3000, cx: 214, cy: 104 };

/** Langkah penanganan yang biasa dicatat (urutan = urutan tampil di panel). */
export const STEP_CATALOG: { text: string; tag: string }[] = [
  { text: 'Lakukan patroli tambahan di area sumur dan jalur akses.', tag: 'Patroli' },
  { text: 'Ganti kabel dan pastikan pengamanan panel.', tag: 'Perbaikan aset' },
  { text: 'Pasang CCTV atau sensor gerak di titik rawan.', tag: 'Teknologi/CCTV' },
  { text: 'Tingkatkan koordinasi dengan BUJP, TNI, atau Polri setempat.', tag: 'Pengamanan fisik' },
];

const addHours = (iso: string, h: number) => new Date(new Date(iso + 'Z').getTime() + h * 3_600_000).toISOString().slice(0, 19);
const fromXY = (x: number, y: number) => ({
  lat: +(MAP_REF.lat - (y - MAP_REF.cy) / MAP_REF.pxPerDeg).toFixed(6),
  lng: +(MAP_REF.lng + (x - MAP_REF.cx) / MAP_REF.pxPerDeg).toFixed(6),
});

interface Row {
  no: string; title: string; location: string; area: string; wk: string; at: string; story: string;
  days: number; ops: number; loss: number | null; steps: number[]; xy: [number, number];
}

const ROWS: Row[] = [
  { no: 'INS-SEN-2026-0201', title: 'Kabel pompa sumur ADR-11 dipotong', location: 'Sumur ADR-11', area: 'Musi Banyuasin · Sumur ADR-11', wk: WK, at: '2026-09-14T23:30:00', story: 'Kabel panel pompa dipotong sekitar 30 m. Pompa mati.', days: 2, ops: 14, loss: 21_000_000, steps: [0, 1, 2], xy: [172, 78] },
  { no: 'INS-SEN-2026-0202', title: 'Besi bekas di area sumur ADR-09 hilang', location: 'Sumur ADR-09', area: 'Musi Banyuasin · Sumur ADR-09', wk: WK, at: '2026-07-02T01:45:00', story: 'Besi bekas dan material sisa dibawa orang tak dikenal dari area sumur.', days: 3, ops: 6, loss: null, steps: [0, 1, 3], xy: [190, 128] },
  { no: 'INS-SEN-2026-0203', title: 'Kabel panel sumur ADR-12 dicuri', location: 'Sumur ADR-12', area: 'Musi Banyuasin · Sumur ADR-12', wk: WK, at: '2026-05-19T14:20:00', story: 'Kabel panel dicuri siang hari saat pergantian regu.', days: 2.5, ops: 30, loss: 9_200_000, steps: [0, 1, 3], xy: [238, 72] },
  { no: 'INS-SEN-2026-0204', title: 'Kabel panel gudang Terminal Arunika dipotong', location: 'Terminal Arunika · gudang', area: 'Musi Banyuasin · Terminal Arunika', wk: WK, at: '2026-03-08T22:40:00', story: 'Kabel panel gudang dipotong dan dibawa.', days: 4, ops: 12, loss: 16_800_000, steps: [0, 1, 2], xy: [258, 112] },
  { no: 'INS-SEN-2026-0205', title: 'Perampokan material di sumur ADR-05', location: 'Sumur ADR-05', area: 'Musi Banyuasin · Sumur ADR-05', wk: WK, at: '2026-01-22T03:10:00', story: 'Material pengeboran dirampas pelaku bersenjata tajam di sumur.', days: 1.5, ops: 16, loss: 34_000_000, steps: [0, 1, 3], xy: [228, 148] },
  { no: 'INS-SEN-2025-0206', title: 'Pagar kawat sumur ADR-08 dipotong', location: 'Sumur ADR-08', area: 'Musi Banyuasin · Sumur ADR-08', wk: WK, at: '2025-11-11T15:05:00', story: 'Pagar kawat dipotong, tidak ada barang hilang.', days: 3.5, ops: 8, loss: null, steps: [0, 1], xy: [160, 112] },
  { no: 'INS-SEN-2025-0207', title: 'Kabel pompa sumur ADR-02 dicuri', location: 'Sumur ADR-02', area: 'Musi Banyuasin · Sumur ADR-02', wk: WK, at: '2025-08-06T00:20:00', story: 'Kabel pompa dicuri, pompa berhenti.', days: 2, ops: 24, loss: 12_500_000, steps: [1, 3], xy: [244, 132] },
  // di luar 18 bulan / WK lain: hanya dipakai saat cakupan diperluas
  { no: 'INS-SEN-2025-0012', title: 'Kabel panel pompa sumur ADR-11 dipotong', location: 'Sumur ADR-11', area: 'Musi Banyuasin · Sumur ADR-11', wk: WK, at: '2025-02-12T00:40:00', story: 'Kabel panel pompa dipotong. Pompa mati.', days: 2, ops: 9, loss: 8_000_000, steps: [0, 1], xy: [150, 90] },
  { no: 'INS-SEN-2024-0377', title: 'Pencurian kabel listrik sumur RMB-04', location: 'Sumur RMB-04', area: 'Musi Rawas · Sumur RMB-04', wk: 'WK Rimau', at: '2024-11-20T02:15:00', story: 'Kabel listrik sumur dipotong dan dibawa.', days: 4, ops: 10, loss: 11_000_000, steps: [1, 2], xy: [60, 60] },
];

/** Insiden Ditutup lama (kategori Pencurian/Perampokan) untuk bahan pertimbangan. */
export function historyIncidents(): Incident[] {
  return ROWS.map((r) => {
    const { lat, lng } = fromXY(...r.xy);
    const registered = addHours(r.at, 6);
    const detail: IncidentDetail = {
      story: r.story, securityImpact: r.title, axes: ['prop'], ops: 'berhenti', opsHours: r.ops, ongoing: false, lossIdr: r.loss,
      casualties: {}, handledBy: ['bujp'], patokan: r.location, lat, lng, attachments: [], reporterSeverity: 'sedang',
      severityReason: '', suggestedSeverity: 'sedang', jenis: null,
    };
    return {
      no: r.no, title: r.title, category: 'Pencurian/Perampokan', location: r.location, area: r.area, wk: r.wk, org: ORG,
      severity: 'sedang', occurredAt: r.at, status: 'ditutup', pic: 'Andi Pratama', reporter: 'Budi Santoso',
      forwardedSteps: r.steps.map((i) => STEP_CATALOG[i].text), detail,
      timeline: [
        { at: registered, by: 'Budi Santoso', text: 'Mengajukan laporan.' },
        { at: addHours(registered, r.days * 24), by: 'Sari Wulandari', text: 'Menutup insiden.' },
      ],
    } satisfies Incident;
  });
}
