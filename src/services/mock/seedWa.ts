import type { WaMessage } from '../types';

/** Teks pesan sumber INS-SEN-2026-0009 (board I20, I23). */
export const WA_TEXT_0009 = 'Lapor, jam 1 malam kabel listrik pompa ADR-07 dipotong org tdk dikenal. Pompa mati. Sdh lapor polsek. Foto terlampir.';

/**
 * Kotak masuk Pemantauan WhatsApp (data demo, INS-05).
 * - WAM-001: pesan sumber INS-SEN-2026-0009 (sudah jadi laporan; board I23).
 * - WAM-002: kabar lanjutan ADR-07 dari grup SITREP PAM ADR (board I24, bahan Tautkan ke insiden).
 * - WAM-003: ASSUMPTION: pesan karangan agar alur draf → kemungkinan ganda (I22) bisa dicoba dari awal.
 */
const GID: Record<string, string> = { 'Pam ADR Area 2': 'G5', 'SITREP PAM ADR': 'G6', 'SITREP PAM ANDALAS': 'G1' };

export function seedWaMessages(): WaMessage[] {
  return withGroupIds([
    {
      id: 'WAM-009', sender: 'Joko', senderRole: 'Danru BUJP', group: 'SITREP PAM ANDALAS', at: '2026-10-28T12:50:00',
      text: 'Lapor ndan, jam 02.30 tadi kabel listrik pompa ADR-05 dipotong orang tak dikenal, sekitar 30 m hilang.',
      bubbles: [
        { at: '2026-10-28T12:51:00', text: 'Panel listrik terbuka, pompa mati kira-kira 5 jam sampai kabel sementara terpasang jam 07.30. Foto kondisi panel terlampir.' },
        { at: '2026-10-28T12:52:00', text: 'Tidak ada korban. Kerugian kira-kira 12 juta. Pelaku belum diketahui, 2 satpam yang jaga malam tidak melihat apa-apa.' },
        { at: '2026-10-28T12:53:00', text: 'Sudah kami lapor ke Polsek Sekayu dan lokasi sudah diamankan Danru BUJP. Mohon petunjuk, ndan.' },
      ],
      photos: [{ id: 'wa9-1', name: 'IMG-20261028-WA0044.jpg', sizeKb: 1980 }, { id: 'wa9-2', name: 'IMG-20261028-WA0045.jpg', sizeKb: 2210 }],
      status: 'baru', priority: true, ruleIds: ['R-ALL', 'R-PRIO'], links: [],
    },
    {
      id: 'WAM-008', sender: 'Rizal', senderRole: 'Danru BUJP', group: 'SITREP PAM ANDALAS', at: '2026-10-28T11:40:00',
      text: 'Satpam memergoki orang memotong pipa flowline, pelaku lari, pipa tidak jadi hilang.',
      photos: [], status: 'baru', priority: true, ruleIds: ['R-ALL', 'R-PRIO'], links: [],
    },
    {
      id: 'WAM-007', sender: 'Joko', senderRole: 'Danru BUJP', group: 'SITREP PAM ANDALAS', at: '2026-10-28T11:12:00',
      text: 'Ada 2 orang mencurigakan di sekitar pagar barat, sudah dihalau.',
      photos: [], status: 'baru', priority: true, ruleIds: ['R-ALL', 'R-PRIO'], links: [],
    },
    {
      id: 'WAM-006', sender: 'Rizal', senderRole: 'Danru BUJP', group: 'SITREP PAM ANDALAS', at: '2026-10-28T06:02:00',
      text: 'LAPSIT Pos 3 06.00 aman terkendali.',
      photos: [], status: 'rutin', ruleIds: ['R-ALL', 'R-LAPSIT'], links: [], handledBy: 'Budi Santoso', handledAt: '2026-10-28T06:30:00',
    },
    {
      id: 'WAM-005', sender: 'Dika', senderRole: 'Satpam internal', group: 'Koordinasi Polsek', at: '2026-10-27T20:10:00',
      text: 'Uji coba grup baru, abaikan.',
      photos: [], status: 'tidak-relevan', irrelevantReason: 'Uji coba', ruleIds: ['R-ALL'], links: [], handledBy: 'Budi Santoso', handledAt: '2026-10-27T20:30:00',
    },
    {
      id: 'WAM-003', sender: 'Joko', senderRole: 'Danru BUJP', group: 'Pam ADR Area 2', at: '2026-10-28T03:05:00',
      text: 'Lapor lagi, jam 2 malam kabel listrik pompa ADR-07 dipotong lagi org tdk dikenal. Pompa mati. Sdh lapor polsek. Foto terlampir.',
      photos: [{ id: 'wa3-1', name: 'IMG-20261028-WA0021.jpg', sizeKb: 1740 }], status: 'baru', ruleIds: ['R-ALL'], links: [],
    },
    {
      id: 'WAM-002', sender: 'Rizal', senderRole: 'BUJP', group: 'SITREP PAM ADR', at: '2026-10-28T10:21:00',
      text: 'Update ADR-07: kabel pengganti sdh dipasang sementara jam 10.15, pompa jalan lagi. Pelaku blm diketahui.',
      photos: [{ id: 'wa2-1', name: 'IMG-20261028-WA0031.jpg', sizeKb: 1620 }], status: 'baru', ruleIds: ['R-ALL'], links: [],
    },
    {
      id: 'WAM-001', sender: 'Joko', senderRole: 'Danru BUJP', group: 'Pam ADR Area 2', at: '2026-10-28T01:32:00', text: WA_TEXT_0009,
      photos: [
        { id: 'wa1-1', name: 'IMG-20261028-WA0012.jpg', sizeKb: 1843 },
        { id: 'wa1-2', name: 'IMG-20261028-WA0013.jpg', sizeKb: 2150 },
      ],
      status: 'diproses', links: [{ incidentNo: 'INS-SEN-2026-0009', kind: 'laporan', by: 'Andi Pratama', at: '2026-10-28T08:34:00' }],
    },
  ]);
}

/** Lengkapi id grup dan nomor dari nama grup (data seed lama hanya menyimpan nama). */
export const withGroupIds = (list: WaMessage[]): WaMessage[] => list.map((m) => ({ ...m, groupId: m.groupId ?? (m.group === 'Koordinasi Polsek' ? 'G3' : GID[m.group] ?? 'G1'), numberId: m.numberId ?? 'N1' }));
