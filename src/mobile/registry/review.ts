import type { ComponentType } from 'react';
import { MobileReviewPage } from '../review/MobileReviewPage';

/** Review/pemeriksaan Pejabat mobile (board MV2, MV2m, MV3, MV4, MV4b, MV5, MV6). */
export const MOBILE_REVIEW: Record<string, ComponentType> = {
  '/insiden/:no/review': MobileReviewPage,
};
