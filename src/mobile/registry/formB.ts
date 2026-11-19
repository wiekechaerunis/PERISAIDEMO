import type { ComponentType } from 'react';
import { MobileReportStep3Page } from '../formB/MobileReportStep3Page';
import { MobileReportStep4Page } from '../formB/MobileReportStep4Page';

/** Form lapor mobile langkah 3–4. Detail insiden (`/insiden/:no`) dipasang lewat dispatcher, bukan di sini. */
export const MOBILE_FORM_B: Record<string, ComponentType> = {
  '/insiden/baru/lampiran': MobileReportStep3Page,
  '/insiden/baru/ringkasan': MobileReportStep4Page,
};
