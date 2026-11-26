import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Sidebar lebar (240 px) atau ciut (72 px, ikon saja). Disimpan per peramban.
 *  `drawer` = laci navigasi di atas konten untuk tablet dan mobile (tidak disimpan). */
interface SidebarState {
  mini: boolean;
  drawer: boolean;
  toggle: () => void;
  setDrawer: (open: boolean) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      mini: false,
      drawer: false,
      toggle: () => set((s) => ({ mini: !s.mini })),
      setDrawer: (drawer) => set({ drawer }),
    }),
    { name: 'perisai-insiden-demo/sidebar/v1', partialize: (s) => ({ mini: s.mini }) },
  ),
);

/** Titik henti DS (D11): mobile < 768 · tablet 768–1279 · desktop ≥ 1280. */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
const bpNow = (): Breakpoint => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1279px)').matches) return 'tablet';
  return 'desktop';
};
const subscribe = (cb: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const qs = ['(max-width: 767px)', '(max-width: 1279px)'].map((q) => window.matchMedia(q));
  qs.forEach((q) => q.addEventListener('change', cb));
  return () => qs.forEach((q) => q.removeEventListener('change', cb));
};
export const useBreakpoint = () => useSyncExternalStore(subscribe, bpNow, () => 'desktop' as Breakpoint);
