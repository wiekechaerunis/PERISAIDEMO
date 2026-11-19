// Data penanganan contoh untuk halaman kerja PIC (PS1: INS-0005 lewat tenggat dengan catatan). Tidak masuk seed.ts;
// panggil `withHandlingSeed(incidents)` di seedState bila ingin data ini ada di store.
import type { Incident } from '../types';

const PATCH: Record<string, (i: Incident) => Incident> = {
  'INS-SEN-2026-0005': (i) => ({
    ...i,
    timeline: [
      { at: '2026-10-25T07:50:00', by: 'Andi Pratama', text: 'Mengajukan laporan.' },
      { at: '2026-10-25T09:00:00', by: 'Sari Wulandari', text: 'Menyetujui insiden. PIC penanganan: Andi Pratama.' },
    ],
    handling: {
      notes: [{ at: '2026-10-25T15:20:00', by: 'Andi Pratama', text: 'Mediasi dengan kepala desa dan Polsek. Dua truk sudah lewat, dua masih tertahan.' }],
      directives: [],
    },
  }),
};

export const withHandlingSeed = (list: Incident[]): Incident[] => list.map((i) => PATCH[i.no]?.(i) ?? i);
