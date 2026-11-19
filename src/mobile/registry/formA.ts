import type { ComponentType } from 'react';
import { MobileReportStep1Page } from '../formA/MobileReportStep1Page';
import { MobileReportStep2Page } from '../formA/MobileReportStep2Page';

/** Form lapor mobile langkah 1–2 + AI Copilot layar penuh: kunci rute → komponen halaman mobile. */
export const MOBILE_FORM_A: Record<string, ComponentType> = {
  '/insiden/baru/temuan': MobileReportStep1Page,
  '/insiden/baru/kejadian': MobileReportStep2Page,
};
