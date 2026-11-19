import type { ComponentType } from 'react';
import { MobileWaStep1 } from '../whatsapp/MobileWaStep1';
import { MobileWaStep2 } from '../whatsapp/MobileWaStep2';
import { MobileWaDetail } from '../whatsapp/MobileWaDetail';

/** Insiden dari WhatsApp mobile: M9 Temuan (+ MS04 ?state=ai-gagal), M10 Kejadian, M11 Detail. Langkah 3–4 memakai tampilan desktop. */
export const MOBILE_WHATSAPP: Record<string, ComponentType> = {
  '/insiden/wa/temuan': MobileWaStep1,
  '/insiden/wa/kejadian': MobileWaStep2,
  '/insiden/wa/:no': MobileWaDetail,
};
