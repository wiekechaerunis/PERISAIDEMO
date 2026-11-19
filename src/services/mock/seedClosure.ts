// Insiden demo untuk layar Pejabat (P22..P34). seed.ts tidak diubah; gabungkan lewat addIncident atau seedState bila diinginkan.
import type { Incident } from '../types';
import { EMPTY_DETAIL } from '@/features/insiden/components/detail/detailLogic';
import { ORG } from './seed';

/** "Sekarang" di layar Pejabat insiden berjalan (selaras tanggal board P22/P24: ditutup 30 Okt 09:40). */
export const CLOSURE_NOW = '2026-10-30T09:40:00';
export const CLOSURE_DEMO_NO = 'INS-SEN-2026-0012';

/** Insiden Pencurian kabel ADR-07, status Minta ditutup, data penutupan lengkap (board P22). */
export function closureDemoIncident(over: Partial<Incident> = {}): Incident {
  return {
    no: CLOSURE_DEMO_NO, title: 'Pencurian kabel listrik sumur ADR-07', category: 'Pencurian/Perampokan',
    location: 'Sumur ADR-07 · Musi Banyuasin', area: 'Musi Banyuasin · WK Andalas Darat', wk: 'WK Andalas Darat', org: ORG,
    severity: 'tinggi', occurredAt: '2026-10-28T01:00:00', status: 'minta-ditutup', pic: 'Andi Pratama', picKind: 'perorangan',
    reporter: 'Budi Santoso', handleDueAt: '2026-11-02T07:00:00', priority: 'tinggi',
    detail: {
      ...EMPTY_DETAIL,
      story: 'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Panel listrik terbuka, pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta.',
      securityImpact: 'Sekitar 40 m kabel listrik pompa di sumur ADR-07 dicuri. Panel listrik pompa ditemukan terbuka.',
      axes: ['prop'], ops: 'berhenti', opsHours: 6, lossIdr: 18_500_000, handledBy: ['bujp'],
      patokan: 'Sumur ADR-07, sisi panel listrik', lat: -2.98512, lng: 104.04213,
      attachments: [
        { name: 'panel-adr07-1.jpg', sizeKb: 3481, caption: 'Panel listrik terbuka' },
        { name: 'jalur-kabel-adr07.jpg', sizeKb: 2970, caption: 'Jalur kabel yang terpotong' },
        { name: 'kabel-adr07-wa.jpg', sizeKb: 1843, caption: 'Dari WhatsApp · INS-SEN-2026-0009' },
      ],
      reporterSeverity: 'tinggi', suggestedSeverity: 'tinggi',
    },
    timeline: [
      { at: '2026-10-28T07:00:00', by: 'Budi Santoso', text: 'Mengajukan laporan.' },
      { at: '2026-10-28T13:10:00', by: 'Sari Wulandari', text: 'Menggabungkan INS-SEN-2026-0009 ke insiden ini. Kejadian sama.' },
      { at: '2026-10-28T13:20:00', by: 'Sari Wulandari', text: 'Menyetujui insiden. PIC penanganan: Andi Pratama.' },
      { at: '2026-10-29T10:02:00', by: 'Budi Santoso', text: 'Pesan ditautkan: Joko (Danru BUJP) di grup Pam ADR Area 2, 09.48: "Pagar sisi panel sudah ditambal sementara, patroli ditambah 1 regu."' },
    ],
    handling: {
      notes: [
        { at: '2026-10-29T08:30:00', by: 'Andi Pratama', text: 'Tim BUJP dan Polsek di lokasi. Area panel diberi garis pembatas.' },
        { at: '2026-10-29T09:15:00', by: 'Andi Pratama', text: 'Lapor ke Polsek Sungai Lilin. Nomor laporan LP/B/112/X/2026.' },
        { at: '2026-10-29T16:40:00', by: 'Andi Pratama', text: 'Kabel pengganti 40 m terpasang. Pompa menyala lagi pukul 16.10.' },
      ],
      noteFiles: {
        '2026-10-29T09:15:00': ['laporan-polisi.pdf'],
        '2026-10-29T10:02:00': ['tambal-pagar.jpg'],
        '2026-10-29T16:40:00': ['pompa-menyala.jpg'],
      },
      directives: [],
      // Isi kanonik: sama dengan tindak lanjut INS-SEN-2026-0007 di modul Tindak Lanjut.
      followUps: [
        { id: 'tl-1', tl: 'TL-SEN-2026-0034', tlStatus: 'dikembalikan', title: 'Pasang lampu sorot di gerbang ADR-07', dueAt: '2026-11-03T17:00:00', status: 'dikerjakan', owner: 'Rudi Hartono' },
        { id: 'tl-2', tl: 'TL-SEN-2026-0039', tlStatus: 'berjalan', title: 'Pasang gembok anti potong di panel ADR-07', dueAt: '2026-11-05T17:00:00', status: 'dikerjakan', owner: 'Dedi Kurniawan' },
        { id: 'tl-3', tl: 'TL-SEN-2026-0041', tlStatus: 'belum-dimulai', title: 'Perbaiki pagar sisi panel ADR-07 dengan panel beton', dueAt: '2026-11-06T17:00:00', status: 'belum-dimulai', owner: 'Rudi Hartono' },
      ],
      closure: {
        partners: ['bujp', 'polri'], casualtiesFinal: {}, lossFinalIdr: 21_400_000, opsHoursFinal: 6,
        cause: 'Celah pengamanan fisik', causeDetail: 'Panel listrik berada di luar jangkauan CCTV dan pagar sisi panel rendah.',
        factors: ['Lemahnya pengawasan malam', 'Celah pagar'], actions: 'Kabel diganti, laporan polisi dibuat.',
        outcome: 'Kabel 40 m diganti, pompa menyala 29 Okt 16.10. Laporan polisi dibuat. Gembok panel diganti tipe anti potong.',
        summary: 'Kabel 40 m diganti, pompa menyala 29 Okt 16.10. Laporan polisi dibuat. Gembok panel diganti tipe anti potong.',
        partnerNames: ['PT Garda Nusantara Sejahtera (BUJP)', 'Polres Musi Banyuasin (Polri)'],
        evidence: [{ name: 'pompa-menyala.jpg', sizeKb: 2100, caption: 'Pompa menyala' }, { name: 'berita-acara-penggantian.pdf', sizeKb: 640, caption: 'Berita acara' }],
        contracts: [{ partner: 'PT Garda Nusantara Sejahtera', ref: 'KTR-2026-0014' }, { partner: 'Polres Musi Banyuasin', ref: 'PKS-2025-0031' }],
        requestedAt: '2026-10-30T09:00:00', requestedBy: 'Andi Pratama',
        claims: [{ text: 'gembok panel sudah diganti', followUpTitle: 'Pasang gembok anti potong di panel ADR-07' }],
        aiRestoredAt: '2026-10-29T16:10:00',
        aiSteps: [
          { at: '2026-10-29T09:15:00', text: 'Dilaporkan ke Polsek Sungai Lilin (LP/B/112/X/2026).', source: 'Catatan PIC' },
          { at: '2026-10-29T10:02:00', text: 'Pagar sisi panel ditambal sementara. Patroli ditambah 1 regu.', source: 'Pesan WhatsApp ditautkan Budi', orig: 'Isi asli: pesan Joko (Danru BUJP) di grup Pam ADR Area 2 + tambal-pagar.jpg ·' },
          { at: '2026-10-29T16:40:00', text: 'Kabel pengganti 40 m terpasang. Pompa menyala lagi.', source: 'Catatan PIC' },
        ],
      },
    },
    ...over,
  };
}
