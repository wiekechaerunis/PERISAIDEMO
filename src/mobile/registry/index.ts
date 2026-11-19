import type { ComponentType } from 'react';
import { MOBILE_LISTS } from './lists';
import { MOBILE_FORM_A } from './formA';
import { MOBILE_FORM_B } from './formB';
import { MOBILE_REVIEW } from './review';
import { MOBILE_HANDLING } from './handling';
import { MOBILE_INCIDENT } from './incident';
import { MOBILE_WHATSAPP } from './whatsapp';

/** Peta kunci rute (pola path di App.tsx) → halaman mobile. Tiap domain memiliki satu berkas registry sendiri. */
export const MOBILE_PAGES: Record<string, ComponentType> = {
  ...MOBILE_LISTS,
  ...MOBILE_FORM_A,
  ...MOBILE_FORM_B,
  ...MOBILE_REVIEW,
  ...MOBILE_HANDLING,
  ...MOBILE_INCIDENT,
  ...MOBILE_WHATSAPP,
};
