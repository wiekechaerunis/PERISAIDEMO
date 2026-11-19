import { withHandlingSeed } from './seedHandling';
import { seedFollowUps } from './seedFollowUps';
import { seedWaMessages } from './seedWa';
import { seedWaGroups, seedWaNumbers, seedWaRules } from './seedWaMon';
import type { ConfigChange, DemoState, Incident, IncidentDetail, TimelineEntry } from '../types';

/** Riwayat awal Konfigurasi Modul (board CFG-Tenggat dan CFG-MatriksKeparahan), terbaru di depan. */
export function seedConfigHistory(): ConfigChange[] {
  return [
    {
      key: 'matriks', at: '2026-11-18T13:05:00', by: 'Rina Hapsari', version: 2, effectiveFrom: '2027-01-01',
      text: 'Contoh ambang awal (menunggu K-2). 4 insiden terbuka dengan waktu kejadian sejak 1 Jan 2027 akan dihitung dengan versi ini.',
    },
    {
      key: 'tenggat', at: '2026-11-18T09:00:00', by: 'Sistem',
      text: 'Diisi nilai contoh: Kritis 1, Tinggi 3, Sedang 7, Rendah 14, Sangat rendah 14 hari kerja',
    },
    {
      key: 'matriks', at: '2024-01-01T00:00:00', by: 'Sistem (migrasi)', version: 1, effectiveFrom: '2024-01-01',
      text: 'Ambang lama (10× lebih tinggi). Dipakai untuk data lama hasil migrasi; levelnya tidak dihitung ulang.',
    },
  ];
}

/** Waktu "sekarang" untuk demo, supaya tenggat dan "Lewat 5 jam" stabil (VS5). */
export const DEMO_NOW = '2026-10-28T13:00:00';
export const ORG = 'PT Samudra Energi Nusantara';
const WK = 'WK Andalas Darat';

const STORY_ADR07 =
  'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Panel listrik terbuka, pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta. Yang jaga malam itu dari Garda Nusantara.';

const D = (p: Partial<IncidentDetail>): IncidentDetail => ({
  story: '', securityImpact: '', axes: [], ops: null, opsHours: null, ongoing: false, lossIdr: null, casualties: {},
  handledBy: [], patokan: '', lat: null, lng: null, attachments: [], reporterSeverity: null, severityReason: '',
  suggestedSeverity: null, jenis: null, ...p,
});

/** Isi laporan dan jejak audit contoh per insiden (data demo; selaras dengan board V12/I15/P12 sejauh terbaca). */
function enrich(i: Incident): Incident {
  const day = i.occurredAt.slice(0, 11);
  const reg = (by: string): TimelineEntry[] => [
    { at: day + '06:41:00', by, text: 'Draf dibuat' },
    { at: day + '07:00:00', by, text: 'Mengajukan laporan.' },
  ];
  const base = D({ patokan: i.location, reporterSeverity: i.severity, suggestedSeverity: i.severity, securityImpact: i.title });
  const specific: Record<string, Partial<IncidentDetail>> = {
    'INS-SEN-2026-0007': {
      story: STORY_ADR07, securityImpact: 'Sekitar 40 m kabel hilang. Panel listrik pompa terbuka.', axes: ['prop'], ops: 'berhenti',
      opsHours: 6, lossIdr: 18_500_000, handledBy: ['bujp'], patokan: 'Sumur ADR-07, sisi panel listrik', lat: -2.98512, lng: 104.04213,
      attachments: [{ name: 'panel-adr07-1.jpg', sizeKb: 3481, caption: 'Panel listrik terbuka' }, { name: 'jalur-kabel-adr07.jpg', sizeKb: 2970, caption: 'Jalur kabel yang terpotong' }],
    },
    'INS-SEN-2026-0005': {
      story: 'Warga menghadang truk logistik di jalan akses SP Batu Ampar. Jalur tertutup, distribusi logistik berhenti lebih dari satu hari.', securityImpact: 'Jalur akses logistik tertutup. Distribusi berhenti.',
      axes: ['prop'], ops: 'berhenti', opsHours: 30, lossIdr: 17_600_000_000, patokan: 'Jalan akses SP Batu Ampar',
    },
    'INS-SEN-2026-0009': {
      story: 'Kabel pompa ADR-07 dipotong, pompa mati.', securityImpact: 'Kabel pompa dipotong.', axes: ['prop'], ops: 'berhenti', opsHours: 5,
      patokan: 'Sumur ADR-07', lat: -2.98512, lng: 104.04213,
    },
  };
  return { ...i, detail: { ...base, ...specific[i.no] }, timeline: i.timeline ?? reg(i.reporter) };
}

export function seedState(): DemoState {
  return {
    role: 'pelapor',
    incidents: ([
      {
        no: 'INS-SEN-2026-0008', title: 'Kebakaran lahan dekat flowline', category: 'Kebakaran',
        location: 'Flowline ADR-03', area: 'Musi Banyuasin · Flowline ADR-03', wk: WK, org: ORG,
        severity: null, occurredAt: '2026-10-28T06:10:00', status: 'draf', pic: null, reporter: 'Budi Santoso',
      },
      {
        no: 'INS-SEN-2026-0006', title: 'Perusakan pagar perimeter terminal', category: 'Perusakan material',
        location: 'Terminal Arunika · pagar utara', area: 'Musi Banyuasin · Terminal Arunika', wk: WK, org: ORG,
        severity: 'sedang', occurredAt: '2026-10-26T22:15:00', status: 'perlu-perbaikan', pic: null,
        reporter: 'Budi Santoso',
      },
      {
        no: 'INS-SEN-2026-0002', title: 'Ancaman bom lewat telepon ke pos jaga', category: 'Ancaman',
        location: 'Pos jaga gerbang utama', area: 'Musi Banyuasin · Pos jaga gerbang utama', wk: WK, org: ORG,
        severity: 'rendah', occurredAt: '2026-10-27T14:05:00', status: 'dalam-penanganan', pic: 'Budi Santoso',
        reporter: 'Rina Lestari', handleDueAt: '2026-11-03T14:05:00',
      },
      {
        no: 'INS-SEN-2026-0007', title: 'Pencurian kabel listrik sumur ADR-07', category: 'Pencurian/Perampokan',
        location: 'Sumur ADR-07 · Musi Banyuasin', area: 'Musi Banyuasin · WK Andalas Darat', wk: WK, org: ORG,
        severity: 'tinggi', occurredAt: '2026-10-28T01:00:00', status: 'review-internal', pic: null,
        reporter: 'Budi Santoso', verifyDueAt: '2026-10-28T08:00:00', late: true,
      },
      {
        no: 'INS-SEN-2026-0009', title: 'Kabel pompa ADR-07 dipotong', category: 'Pencurian/Perampokan',
        location: 'Sumur ADR-07 · Musi Banyuasin', area: 'Musi Banyuasin · WK Andalas Darat', wk: WK, org: ORG,
        severity: 'tinggi', occurredAt: '2026-10-28T02:10:00', status: 'review-internal', pic: null,
        reporter: 'Pesan WhatsApp', verifyDueAt: '2026-10-29T08:34:00', possibleDuplicate: true, source: 'wa', hiddenFor: ['pelapor'],
        timeline: [
          { at: '2026-10-28T08:20:00', by: 'Andi Pratama', text: 'Draf dibuat dari pesan WhatsApp' },
          { at: '2026-10-28T08:34:00', by: 'Andi Pratama', text: 'Mengajukan laporan.' },
        ],
      },
      {
        no: 'INS-SEN-2026-0005', title: 'Penghadangan truk logistik oleh warga', category: 'Blokade area',
        location: 'Jalan akses SP Batu Ampar', area: 'Banyuasin · WK Batu Ampar', wk: 'WK Batu Ampar', org: ORG,
        severity: 'kritis', occurredAt: '2026-10-25T07:40:00', status: 'dalam-penanganan', pic: 'Andi Pratama',
        reporter: 'Andi Pratama', late: true, escalated: true, handleDueAt: '2026-10-26T07:40:00',
      },
      {
        no: 'INS-SEN-2026-0004', title: 'Pencurian solar di tangki T-02', category: 'Pencurian minyak',
        location: 'Terminal Arunika · tangki T-02', area: 'Musi Banyuasin · Terminal Arunika', wk: WK, org: ORG,
        severity: 'sedang', occurredAt: '2026-10-19T03:30:00', status: 'ditutup', pic: 'Andi Pratama',
        reporter: 'Budi Santoso',
      },
      {
        no: 'INS-SEN-2026-0003', title: 'Perusakan CCTV gerbang 2', category: 'Perusakan material',
        location: 'Gerbang 2', area: 'Musi Banyuasin · Gerbang 2', wk: WK, org: ORG,
        severity: 'sedang', occurredAt: '2026-09-20T20:20:00', status: 'ditutup', pic: 'Andi Pratama',
        reporter: 'Rina Lestari',
      },
      {
        no: 'INS-SEN-2026-0010', title: 'Drone tidak dikenal di atas sumur ADR-07', category: 'Lainnya',
        location: 'Sumur ADR-07', area: 'Musi Banyuasin · WK Andalas Darat', wk: WK, org: ORG,
        severity: 'sedang', occurredAt: '2026-10-27T05:30:00', status: 'dalam-penanganan', pic: 'Andi Pratama',
        reporter: 'Rina Lestari', fromKrw: 'KRW-SEN-2026-0045', hiddenFor: ['pelapor'],
        handleDueAt: '2026-11-05T07:00:00', handleDays: 7,
        timeline: [
          { at: '2026-10-27T06:41:00', by: 'Rina Lestari', text: 'Draf dibuat' },
          { at: '2026-10-27T07:00:00', by: 'Rina Lestari', text: 'Mengajukan laporan.' },
          { at: '2026-10-27T09:10:00', by: 'Sari Wulandari', text: 'Menyetujui insiden. PIC penanganan: Andi Pratama.' },
        ],
      },
    ] as Incident[]).map(enrich).map((i) => withHandlingSeed([i])[0]),
    kerawanan: [
      ['0040', 'Pagar perimeter berlubang di sisi timur', 'Perusakan material', 'Terminal Arunika'],
      ['0041', 'Orang tak dikenal sering mengamati gerbang 2', 'Lainnya', 'Gerbang 2'],
      ['0042', 'Lampu sorot sumur ADR-05 mati', 'Lainnya', 'Sumur ADR-05'],
      ['0043', 'Kendaraan tanpa izin parkir dekat flowline', 'Lainnya', 'Flowline ADR-03'],
      ['0044', 'Gembok pintu pompa ADR-07 rusak', 'Perusakan material', 'Sumur ADR-07'],
      ['0045', 'Drone melintas di atas sumur ADR-07', 'Lainnya', 'Sumur ADR-07'],
      ['0046', 'Warga meminta akses jalan tanpa koordinasi', 'Blokade area', 'Jalan akses SP Batu Ampar'],
      ['0047', 'Pagar sisi barat ADR-07 miring dan kabel panel terbuka', 'Pencurian/Perampokan', 'Sumur ADR-07'],
    ].map(([n, title, category, location], i) => ({
      no: `KRW-SEN-2026-${n}`, title, category, location, wk: WK, org: ORG,
      // ASSUMPTION: judul/lokasi KRW-0040..0046 dikarang untuk demo; disesuaikan dengan board Kerawanan di fase 5.
      reporter: i % 2 ? 'Rina Lestari' : 'Budi Santoso', observedAt: `2026-10-${20 + (i % 8)}T09:00:00`,
      raisedTo: n === '0045' ? 'INS-SEN-2026-0010' : undefined,
    })),
    followUps: seedFollowUps(),
    waMessages: seedWaMessages(),
    waDrafts: [],
    waNumbers: seedWaNumbers(),
    waGroups: seedWaGroups(),
    waRules: seedWaRules(),
    waTerms: [],
    config: {
      // Konfigurasi › Tenggat penanganan (nilai contoh, menunggu SKK)
      deadlines: { kritis: 1, tinggi: 3, sedang: 7, rendah: 14, 'sangat-rendah': 14 },
      // Konfigurasi › Matriks keparahan (USD). ASSUMPTION: nilai contoh; diselaraskan dengan CFG-MatriksKeparahan di fase 8.
      lossThresholdsUsd: { rendah: 1_000, sedang: 10_000, tinggi: 100_000, kritis: 1_000_000 },
      kursIdrPerUsd: 16_500,
      history: seedConfigHistory(),
    },
  };
}
