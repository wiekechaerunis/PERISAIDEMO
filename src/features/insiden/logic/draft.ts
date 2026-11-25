import { create } from 'zustand';
import { demoNow } from '@/services/mock/clock';
import { persist } from 'zustand/middleware';
import type { CasualtyKind, OpsImpact, Severity } from '@/lib/severity';
import type { HasImpactAnswer, ReportKind } from '@/lib/reportType';
import type { HandledBy } from '@/services/ai/types';

export type Axis = 'prop' | 'man' | 'ling' | 'data';

export interface Attachment {
  id: string;
  name: string;
  sizeKb: number;
  /** keterangan singkat (opsional) */
  caption: string;
}

/** Draf laporan Pelapor (langkah 1–4). Satu draf aktif; disimpan di localStorage. */
export interface ReportDraft {
  /** nomor draf setelah Simpan draf (B-1, B-9); kosong = belum tersimpan ("Buat laporan") */
  no?: string;
  /** pembuat draf: hanya dia yang boleh Hapus draf (ADJ-18 butir 5) */
  createdBy?: string;
  /** waktu Simpan draf terakhir (kartu Pengajuan di Ringkasan) */
  savedAt?: string;
  /** langkah 1 · Temuan */
  hasImpact: HasImpactAnswer | null;
  kind: ReportKind;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  locationName: string;
  lat: number | null;
  lng: number | null;
  wk: string;
  patokan: string;
  story: string;
  /** langkah 2 · Kejadian & dampak (insiden) / Detail (kerawanan) */
  category: string | null;
  categoryOther: string;
  jenis: string | null;
  jenisOther: string;
  securityImpact: string;
  axes: Axis[];
  lossIdr: number | null;
  ops: OpsImpact | null;
  opsHours: number | null;
  ongoing: boolean;
  /** jumlah orang per kondisi; kunci hadir = kondisi dipilih. 'belum' tidak bisa digabung dengan lainnya. */
  casualties: Partial<Record<CasualtyKind, number>>;
  envNote: string;
  dataNote: string;
  severity: Severity | null;
  severityManual: boolean;
  severityReason: string;
  handledBy: HandledBy[];
  /** tindakan awal yang sudah dilakukan (mis. P3K, dibawa ke klinik) */
  initialAction: string;
  /** Diperiksa oleh: null = semua Pejabat Berwenang (bawaan) */
  reviewers: string[] | null;
  /** langkah 3 · Lampiran */
  attachments: Attachment[];
  /** field yang diisi dari saran AI Copilot (menampilkan tag "AI") */
  aiFilled: string[];
}

export const emptyDraft = (): ReportDraft => ({
  hasImpact: null, kind: 'insiden', date: '', time: '', title: '', locationName: '', lat: null, lng: null,
  wk: '', patokan: '', story: '', category: null, categoryOther: '', jenis: null, jenisOther: '', securityImpact: '',
  axes: [], lossIdr: null, ops: null, opsHours: null, ongoing: false, casualties: {}, envNote: '', dataNote: '',
  severity: null, severityManual: false, severityReason: '', handledBy: [], initialAction: '', reviewers: null, attachments: [], aiFilled: [],
});

interface DraftStore {
  draft: ReportDraft;
  patch: (p: Partial<ReportDraft>) => void;
  /** tandai field sebagai diisi AI (atau bukan) */
  markAi: (field: string, on: boolean) => void;
  resetDraft: () => void;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      draft: emptyDraft(),
      patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      markAi: (field, on) =>
        set((s) => ({
          draft: {
            ...s.draft,
            aiFilled: on ? Array.from(new Set([...s.draft.aiFilled, field])) : s.draft.aiFilled.filter((f) => f !== field),
          },
        })),
      resetDraft: () => set({ draft: emptyDraft() }),
    }),
    {
      name: 'perisai-insiden-demo/draft/v1',
      version: 1,
      // draf lama belum punya field baru (mis. initialAction): lengkapi dari draf kosong
      migrate: (persisted) => {
        const p = persisted as { draft?: Partial<ReportDraft> };
        return { ...p, draft: { ...emptyDraft(), ...p.draft } } as DraftStore;
      },
    },
  ),
);

/** Waktu kejadian setelah jam demo (B8). */
export const isFutureTime = (date: string, time: string): boolean => `${date}T${time}` > demoNow().slice(0, 16);
