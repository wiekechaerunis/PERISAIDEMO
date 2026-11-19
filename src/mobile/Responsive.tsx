import type { ReactNode } from 'react';
import { useIsMobile } from './useIsMobile';
import { MOBILE_PAGES } from './registry';

/** Pilih halaman desktop atau mobile (dari registry per domain) menurut lebar viewport. */
export function Responsive({ routeKey, desktop }: { routeKey: string; desktop: ReactNode }) {
  const mobile = useIsMobile();
  const Page = MOBILE_PAGES[routeKey];
  return mobile && Page ? <Page /> : <>{desktop}</>;
}
