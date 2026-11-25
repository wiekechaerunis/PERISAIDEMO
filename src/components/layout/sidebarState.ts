import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Sidebar lebar (240 px) atau ciut (72 px, ikon saja). Disimpan per peramban. */
interface SidebarState {
  mini: boolean;
  toggle: () => void;
}

export const useSidebar = create<SidebarState>()(
  persist((set) => ({ mini: false, toggle: () => set((s) => ({ mini: !s.mini })) }), { name: 'perisai-insiden-demo/sidebar/v1' }),
);
