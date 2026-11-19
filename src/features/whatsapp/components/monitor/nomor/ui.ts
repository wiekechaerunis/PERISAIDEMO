// Penyakelar dialog Tautkan nomor. Tombol "Tautkan nomor" di header halaman (papan V2-20) cukup memanggil
// `useNomorUi.getState().openLink()`; NomorTab membuka dialognya.
import { create } from 'zustand';

interface NomorUi { linkOpen: boolean; openLink: () => void; closeLink: () => void }
export const useNomorUi = create<NomorUi>((set) => ({
  linkOpen: false,
  openLink: () => set({ linkOpen: true }),
  closeLink: () => set({ linkOpen: false }),
}));
