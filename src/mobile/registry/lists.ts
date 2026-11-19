import type { ComponentType } from 'react';
import { MobileIncidentListPage } from '../lists/MobileIncidentListPage';

/** Kunci rute → halaman mobile (daftar per peran: M1, M12, MP1, MV1, MK1, MS08–MS12). */
export const MOBILE_LISTS: Record<string, ComponentType> = {
  '/insiden': MobileIncidentListPage,
};
