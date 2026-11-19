// Seed Pemantauan WhatsApp v2: nomor, grup, aturan. Data fiktif selaras dengan seed insiden (ADR-07, WK Andalas Darat).
import type { WaGroup, WaNumber, WaRule } from '../types';

export const seedWaNumbers = (): WaNumber[] => [
  { id: 'N1', label: 'Posko Andalas', phone: '0812 7000 1111', status: 'terhubung', linkedAt: '2026-10-20T08:00:00', devices: ['Google Chrome (PERISAI)'] },
  { id: 'N2', label: 'Posko Batu Ampar', phone: '0812 7000 2222', status: 'ditangguhkan', linkedAt: '2026-10-10T08:00:00', devices: ['Google Chrome (PERISAI)'], suspendedReason: 'Dihentikan sementara oleh Admin KKKS.' },
];

export const seedWaGroups = (): WaGroup[] => [
  { id: 'G1', numberId: 'N1', name: 'SITREP PAM ANDALAS', monitored: true, wk: 'WK Andalas Darat', area: 'Musi Banyuasin', monitoredSince: '2026-10-20', checkedToday: 13, tags: ['Sitrep harian'], description: 'Laporan situasi tiap 6 jam dari Danru pos 1-5.', membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Danru Pos 1', phone: '+62 813-****-2201' }, { name: 'Danru Pos 2', phone: '+62 813-****-2202' }, { name: 'Kapolsek Sekayu', phone: '+62 821-****-5510' }, { phone: '+62 851-****-8472' }] },
  { id: 'G2', numberId: 'N1', name: 'PAM NATARU 2026', monitored: false, membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Koordinator Nataru', phone: '+62 812-****-3301' }, { name: 'Babinsa Sekayu', phone: '+62 822-****-4410' }, { phone: '+62 877-****-1904' }] },
  { id: 'G3', numberId: 'N1', name: 'Koordinasi Polsek', monitored: true, wk: 'WK Andalas Darat', monitoredSince: '2026-10-21', checkedToday: 8, membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Kapolsek Babat', phone: '+62 821-****-6620' }, { name: 'Kanit Intel', phone: '+62 821-****-6621' }] },
  { id: 'G4', numberId: 'N1', name: 'Keluarga Pos 4', monitored: false, membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Ibu Sari', phone: '+62 856-****-7712' }, { phone: '+62 838-****-9005' }] },
  { id: 'G5', numberId: 'N1', name: 'Pam ADR Area 2', monitored: true, wk: 'WK Andalas Darat', monitoredSince: '2026-10-22', checkedToday: 5, membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Danru ADR 1', phone: '+62 813-****-3101' }, { name: 'Danru ADR 2', phone: '+62 813-****-3102' }, { name: 'Danru ADR 3', phone: '+62 813-****-3103' }] },
  { id: 'G6', numberId: 'N1', name: 'SITREP PAM ADR', monitored: true, wk: 'WK Andalas Darat', monitoredSince: '2026-10-22', checkedToday: 9, membersAt: '2026-10-20T08:00:00',
    members: [{ name: 'Danru BUJP', phone: '+62 813-****-4101' }, { name: 'Petugas Jaga 1', phone: '+62 813-****-4102' }] },
];

/** Aturan bawaan "Semua pesan" aktif dan tidak bisa dihapus; dua aturan contoh. */
export const seedWaRules = (): WaRule[] => [
  {
    id: 'R-ALL', name: 'Semua pesan', enabled: true, builtin: true, priority: false,
    ignore: { startsWith: ['siap', 'ok', 'oke', 'baik', 'sip', 'terima kasih'], maxLen: 20 },
    capture: {},
  },
  {
    id: 'R-PRIO', name: 'Kata kunci prioritas', enabled: true, priority: true, suggestKind: 'insiden',
    ignore: {},
    capture: { containsAny: ['hilang', 'dipotong', 'memotong', 'pencurian', 'kebakaran', 'mencurigakan', 'korban', 'ledakan', 'ancaman'] },
    followUp: { count: 3, minutes: 5 },
  },
  {
    id: 'R-LAPSIT', name: 'LAPSIT rutin', enabled: true, priority: false, suggestKind: 'kerawanan',
    ignore: {},
    capture: { startsWith: ['lapsit', 'laporan situasi'] },
  },
];
