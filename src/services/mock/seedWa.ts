import type { WaMessage } from '../types';

/** Teks pesan sumber INS-SEN-2026-0009 (board I20, I23). */
export const WA_TEXT_0009 = 'Lapor, jam 1 malam kabel listrik pompa ADR-07 dipotong org tdk dikenal. Pompa mati. Sdh lapor polsek. Foto terlampir.';

/**
 * Kotak masuk Pemantauan WhatsApp (data demo, INS-05).
 * - WAM-001: pesan sumber INS-SEN-2026-0009 (sudah jadi laporan; board I23).
 * - WAM-002: kabar lanjutan ADR-07 dari grup SITREP PAM ADR (board I24, bahan Tautkan ke insiden).
 * - WAM-003: ASSUMPTION: pesan karangan agar alur draf → kemungkinan ganda (I22) bisa dicoba dari awal.
 */
export function seedWaMessages(): WaMessage[] {
  return [
    {
      id: 'WAM-003', sender: 'Joko', senderRole: 'Danru BUJP', group: 'Pam ADR Area 2', at: '2026-10-28T03:05:00',
      text: 'Lapor lagi, jam 2 malam kabel listrik pompa ADR-07 dipotong lagi org tdk dikenal. Pompa mati. Sdh lapor polsek. Foto terlampir.',
      photos: [{ id: 'wa3-1', name: 'IMG-20261028-WA0021.jpg', sizeKb: 1740 }], status: 'baru', links: [],
    },
    {
      id: 'WAM-002', sender: 'Rizal', senderRole: 'BUJP', group: 'SITREP PAM ADR', at: '2026-10-28T10:21:00',
      text: 'Update ADR-07: kabel pengganti sdh dipasang sementara jam 10.15, pompa jalan lagi. Pelaku blm diketahui.',
      photos: [{ id: 'wa2-1', name: 'IMG-20261028-WA0031.jpg', sizeKb: 1620 }], status: 'baru', links: [],
    },
    {
      id: 'WAM-001', sender: 'Joko', senderRole: 'Danru BUJP', group: 'Pam ADR Area 2', at: '2026-10-28T01:32:00', text: WA_TEXT_0009,
      photos: [
        { id: 'wa1-1', name: 'IMG-20261028-WA0012.jpg', sizeKb: 1843 },
        { id: 'wa1-2', name: 'IMG-20261028-WA0013.jpg', sizeKb: 2150 },
      ],
      status: 'diproses', links: [{ incidentNo: 'INS-SEN-2026-0009', kind: 'laporan', by: 'Andi Pratama', at: '2026-10-28T08:34:00' }],
    },
  ];
}
