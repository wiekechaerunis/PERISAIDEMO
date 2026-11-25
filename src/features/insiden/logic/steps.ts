import type { ReportKind } from '@/lib/reportType';

// B-2: stepper Waktu & lokasi / Dampak / Lampiran / Ringkasan
export const STEPS_INSIDEN = ['Waktu & lokasi', 'Dampak', 'Lampiran', 'Ringkasan'];
export const STEPS_KERAWANAN = ['Temuan', 'Detail & lampiran'];
export const stepsOf = (kind: ReportKind) => (kind === 'insiden' ? STEPS_INSIDEN : STEPS_KERAWANAN);

/** Rute langkah form lapor. */
export const STEP_ROUTES = {
  temuan: '/insiden/baru/temuan',
  kejadian: '/insiden/baru/kejadian',
  lampiran: '/insiden/baru/lampiran',
  ringkasan: '/insiden/baru/ringkasan',
  detailKerawanan: '/insiden/baru/detail',
} as const;
