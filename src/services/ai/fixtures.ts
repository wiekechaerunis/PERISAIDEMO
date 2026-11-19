// Cerita dummy untuk menguji AI Copilot (mock dan adapter claude). Tiap skenario memuat cerita pelapor dan isian yang HARUS dihasilkan;
// field yang tidak disebut di `expect` tidak diperiksa. Dipakai tes `copilotStories.test.ts` dan bisa ditempel manual ke kotak Copilot.
import type { CasualtyKind, OpsImpact } from '@/lib/severity';

export interface StoryExpect {
  kind?: 'insiden' | 'kerawanan';
  category?: string;
  time?: string; // HH:mm
  date?: string; // YYYY-MM-DD
  title?: string;
  locationName?: string;
  ops?: { state: OpsImpact; hours: number | null };
  casualty?: CasualtyKind | 'none';
  lossIdr?: number;
  handledBy?: 'bujp' | 'tni' | 'polri' | 'int';
  /** tidak ada saran sama sekali (cerita belum cukup) */
  empty?: true;
  /** kecelakaan kerja/K3 tanpa unsur keamanan */
  k3?: boolean;
  /** nama blok/WK yang disebut di cerita */
  locationMention?: string;
  /** sumbu yang terdampak, berurutan */
  axes?: string[];
  /** potongan yang harus ada di tindakan awal */
  initialAction?: string;
}

export interface StoryFixture {
  id: string;
  /** apa yang diuji */
  intent: string;
  story: string;
  expect: StoryExpect;
}

export const STORY_FIXTURES: StoryFixture[] = [
  {
    id: 'kabel-adr07',
    intent: 'Skenario demo utama (board I12/I13): insiden Tinggi, operasi berhenti 6 jam, kerugian 18,5 juta, BUJP',
    story:
      'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Panel listrik terbuka, pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta. Yang jaga malam itu dari Garda Nusantara.',
    expect: {
      kind: 'insiden', category: 'Pencurian/Perampokan', time: '01:00', date: '2026-10-28', title: 'Pencurian kabel listrik sumur ADR-07',
      locationName: 'Sumur ADR-07', ops: { state: 'berhenti', hours: 6 }, casualty: 'none', lossIdr: 18_500_000, handledBy: 'bujp',
    },
  },
  {
    id: 'pagar-roboh',
    intent: 'Kerawanan: kondisi rawan tanpa kerugian, korban, atau gangguan operasi (pagar roboh)',
    story:
      'Jam 7 pagi pagar sisi barat sumur ADR-07 roboh sepanjang 6 m setelah hujan deras. Tidak ada korban dan tidak ada kerugian. Sudah dipasang garis pembatas sementara.',
    expect: { kind: 'kerawanan', category: 'Perusakan material', time: '07:00', locationName: 'Sumur ADR-07', casualty: 'none' },
  },
  {
    id: 'blokade-warga',
    intent: 'Blokade oleh warga: operasi terganggu sebagian 5 jam, "kemarin" dihitung sehari sebelum hari ini, negasi "tidak ada yang luka"',
    story:
      'Kemarin jam 3 sore sekitar 40 warga menghadang truk logistik di jalan akses SP Batu Ampar. Truk tertahan 5 jam sehingga operasi terganggu sebagian. Tidak ada yang luka. Polsek sudah datang.',
    expect: {
      kind: 'insiden', category: 'Blokade area', time: '15:00', date: '2026-10-27', locationName: 'Jalan akses SP Batu Ampar',
      ops: { state: 'sebagian', hours: 5 }, casualty: 'none', handledBy: 'polri',
    },
  },
  {
    id: 'korban-luka-berat',
    intent: 'Korban luka berat (keparahan Tinggi), kategori Serangan fisik',
    story: 'Jam 11 malam satpam jaga di gerbang 2 dipukul orang tak dikenal, luka berat dan dibawa ke rumah sakit. Pelaku kabur.',
    expect: { kind: 'insiden', category: 'Serangan fisik', time: '23:00', casualty: 'berat' },
  },
  {
    id: 'solar-tangki',
    intent: 'Pencurian minyak dengan kerugian dan penanganan TNI',
    story:
      'Jam 3 pagi solar di tangki T-02 Terminal Arunika berkurang sekitar 2.000 liter, diduga dicuri lewat selang. Kerugian sekitar 30 juta. Sudah dilaporkan ke TNI.',
    expect: { kind: 'insiden', category: 'Pencurian minyak', time: '03:00', lossIdr: 30_000_000, handledBy: 'tni' },
  },
  {
    id: 'ancaman-telepon',
    intent: 'Ancaman tanpa dampak: kerawanan, jam dengan titik ("14.05")',
    story: 'Jam 14.05 pos jaga gerbang utama menerima telepon yang mengancam akan ada bom. Tidak ada korban dan tidak ada kerugian, operasi normal.',
    expect: { kind: 'kerawanan', category: 'Ancaman', time: '14:05', casualty: 'none' },
  },
  {
    id: 'k3-wellpad-rokan',
    intent:
      'Kecelakaan kerja tanpa unsur keamanan (peringatan K3), "tadi pagi jam 9", blok yang disebut cerita (Blok Rokan) beda dengan WK titik peta, korban dibawa ke klinik, tidak ada kebocoran',
    story:
      'Tadi pagi sekitar jam 9, di area wellpad Blok Rokan, pekerja kami namanya Budi tangannya terjepit saat mengganti valve. Jarinya memar dan sedikit berdarah. Langsung kami beri P3K dan dibawa ke klinik lapangan. Tidak ada kebocoran.',
    expect: {
      kind: 'insiden', category: 'Kecelakaan kerja', time: '09:00', date: '2026-10-28', locationName: 'Wellpad Blok Rokan',
      casualty: 'klinik', k3: true, locationMention: 'Blok Rokan', axes: ['man'], initialAction: 'P3K',
    },
  },
  {
    id: 'ambigu',
    intent: 'Cerita terlalu pendek: tidak boleh mengarang saran (state "tanpa saran", S23)',
    story: 'Ada yang aneh di pos jaga.',
    expect: { empty: true },
  },
];

/** Pertanyaan di luar cakupan (board I12o): harus ditolak sopan, bukan diproses sebagai cerita. */
export const OUT_OF_SCOPE_MESSAGES = [
  'Eh, minggu lalu di ADR-05 ada kejadian kayak gini juga nggak? Pelakunya siapa ya?',
  'Tolong buka laporan lain yang mirip.',
  'Siapa pelaku pencurian kemarin?',
];

/** Pesan lanjutan yang BUKAN di luar cakupan (menambah cerita). */
export const IN_SCOPE_MESSAGES = ['Pompanya sudah menyala lagi jam 8 pagi', 'Kerugian sekitar 20 juta', 'Yang jaga tadi dari TNI'];
