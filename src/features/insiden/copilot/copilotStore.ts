import { create } from 'zustand';
import type { Extraction } from '@/services/ai/types';
import type { Flags, SlotKey } from './interview';
import type { Suggestion, SuggestionKey } from './suggestions';

export type Phase = 'idle' | 'rec' | 'proc' | 'ready' | 'err' | 'weak';
export type SuggestionState = 'on' | 'off';

/** Satu gelembung percakapan: pesan pelapor, catatan/pertanyaan AI yang sudah terjawab, atau sekelompok kartu saran. */
export type ThreadItem =
  | { from: 'me'; text: string; voice?: boolean }
  | { from: 'ai'; text: string }
  | { from: 'ai'; text: string; cards: Suggestion[]; ex: Extraction };

/** Percakapan Copilot untuk satu draf laporan. Hanya memori (hilang saat muat ulang), isian form ada di draft store. */
interface CopilotStore {
  phase: Phase;
  /** gabungan cerita yang sudah dikirim */
  story: string;
  messages: ThreadItem[];
  /** pembacaan cerita terbaru */
  extraction: Extraction | null;
  status: Partial<Record<SuggestionKey, SuggestionState>>;
  /** jawaban pertanyaan lanjutan per langkah (hanya dipakai Copilot mobile; desktop memakai wawancara di interview.ts) */
  followUp: Partial<Record<1 | 2, 'a' | 'b'>>;
  /** isian wajib yang ditolak atau dilewati pengguna */
  skipped: SlotKey[];
  /** pengecekan yang sudah dijawab (K3, WK, yang terdampak) */
  flags: Flags;
  oos: boolean;
  /** penyebab state `weak`: cerita belum cukup, atau suara kurang jelas (board S21) */
  weakKind: 'short' | 'noisy';
  set: (p: Partial<Omit<CopilotStore, 'set' | 'reset'>>) => void;
  reset: (keepOn?: boolean) => void;
}

const initial = {
  phase: 'idle' as Phase,
  story: '',
  messages: [] as ThreadItem[],
  extraction: null,
  status: {},
  followUp: {},
  skipped: [] as SlotKey[],
  flags: {} as Flags,
  oos: false,
  weakKind: 'short' as 'short' | 'noisy',
};

export const useCopilotStore = create<CopilotStore>()((set) => ({
  ...initial,
  set: (p) => set(p),
  // Mulai ulang: riwayat dan saran belum dipilih dihapus; saran yang sudah Dipakai tetap tercatat.
  reset: (keepOn = true) =>
    set((s) => ({
      ...initial,
      status: keepOn ? Object.fromEntries(Object.entries(s.status).filter(([, v]) => v === 'on')) : {},
    })),
}));
