import { create } from 'zustand';
import { demoNow } from '@/services/mock/clock';
import { persist } from 'zustand/middleware';
import type { CasualtyKind, OpsImpact, Severity } from '@/lib/severity';
import type { HasImpactAnswer, ReportKind } from '@/lib/reportType';
import type { HandledBy } from '@/services/ai/types';

export type Axis = 'prop' | 'man' | 'ling' | 'data';
export type InfoSource = 'langsung' | 'pihak-lain';
export const INFO_SOURCE_LABEL: Record<InfoSource, string> = { langsung: 'Temuan langsung', 'pihak-lain': 'Laporan pihak lain' };
/** Nilai "Belum diketahui" untuk Sebaran dampak dan Data & informasi (B-11). */
export const UNKNOWN = 'Belum diketahui';

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
  /** Sumber informasi (B-3): Temuan langsung / Laporan pihak lain; dari WhatsApp otomatis pihak lain */
  infoSource: InfoSource | null;
  /** langkah 2 · Kejadian & dampak (insiden) / Detail (kerawanan) */
  category: string | null;
  categoryOther: string;
  jenis: string | null;
  jenisOther: string;
  securityImpact: string;
  axes: Axis[];
  lossIdr: number | null;
  /** B-11: centang "Belum diketahui, masih dihitung" (isian kerugian nonaktif) */
  lossUnknown: boolean;
  ops: OpsImpact | null;
  /** B-11: chip "Belum diketahui" pada Kondisi operasi (durasi disembunyikan) */
  opsUnknown: boolean;
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
  /** B-12: chip Lainnya pada "Sudah ada yang menangani?"; null = tidak dipilih, string = isian Sebutkan (maks. 50) */
  handledOther: string | null;
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
  wk: '', patokan: '', story: '', infoSource: null, category: null, categoryOther: '', jenis: null, jenisOther: '', securityImpact: '',
  axes: [], lossIdr: null, lossUnknown: false, ops: null, opsUnknown: false, opsHours: null, ongoing: false, casualties: {}, envNote: '', dataNote: '',
  severity: null, severityManual: false, severityReason: '', handledBy: [], handledOther: null, initialAction: '', reviewers: null, attachments: [], aiFilled: [],
});

interface DraftStore {
  draft: ReportDraft;
  /** salinan JSON draf saat terakhir disimpan/dimuat; beda = ada perubahan belum disimpan (B-9) */
  baseline: string;
  /** tandai isi sekarang sebagai tersimpan */
  markSaved: () => void;
  /** muat draf (dari insiden tersimpan atau kosong) sebagai titik awal tanpa perubahan */
  load: (d: ReportDraft) => void;
  patch: (p: Partial<ReportDraft>) => void;
  /** tandai field sebagai diisi AI (atau bukan) */
  markAi: (field: string, on: boolean) => void;
  resetDraft: () => void;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      draft: emptyDraft(),
      baseline: JSON.stringify(emptyDraft()),
      markSaved: () => set((s) => ({ baseline: JSON.stringify(s.draft) })),
      load: (d) => set({ draft: d, baseline: JSON.stringify(d) }),
      patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      markAi: (field, on) =>
        set((s) => ({
          draft: {
            ...s.draft,
            aiFilled: on ? Array.from(new Set([...s.draft.aiFilled, field])) : s.draft.aiFilled.filter((f) => f !== field),
          },
        })),
      resetDraft: () => set({ draft: emptyDraft(), baseline: JSON.stringify(emptyDraft()) }),
    }),
    {
      name: 'perisai-insiden-demo/draft/v1',
      version: 2,
      // draf lama belum punya field baru (mis. initialAction): lengkapi dari draf kosong
      migrate: (persisted) => {
        const p = persisted as { draft?: Partial<ReportDraft> };
        const draft = { ...emptyDraft(), ...p.draft };
        return { ...p, draft, baseline: JSON.stringify(draft) } as DraftStore;
      },
    },
  ),
);

/** Waktu kejadian setelah jam demo (B8). */
export const isFutureTime = (date: string, time: string): boolean => `${date}T${time}` > demoNow().slice(0, 16);

/** Ada perubahan yang belum disimpan lewat Simpan draf (B-9). */
export const isDirty = (s: { draft: ReportDraft; baseline: string }) => JSON.stringify(s.draft) !== s.baseline;

/** Dampak yang ditandai "Belum diketahui" pada sumbu terpilih (B-11, ADJ-07). */
export function unknownImpacts(d: ReportDraft): string[] {
  const out: string[] = [];
  if (d.axes.includes('prop') && d.lossUnknown) out.push('kerugian');
  if (d.axes.includes('prop') && d.opsUnknown) out.push('kondisi operasi');
  if (d.axes.includes('man') && 'belum' in d.casualties) out.push('kondisi korban');
  if (d.axes.includes('ling') && d.envNote === UNKNOWN) out.push('sebaran dampak');
  if (d.axes.includes('data') && d.dataNote === UNKNOWN) out.push('besar data bocor');
  return out;
}
