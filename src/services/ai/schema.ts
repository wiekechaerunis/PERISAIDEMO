// Skema hasil ekstraksi Copilot (dipakai server `api/copilot.ts` dan klien). Tanpa impor alias "@/" agar bisa dimuat fungsi serverless.
import { z } from 'zod/v4';

export const SKK_CATEGORIES = [
  'Pencurian/Perampokan', 'Pencurian minyak', 'Pemerasan', 'Blokade area', 'Penyanderaan aset',
  'Penghentian kegiatan/operasi', 'Unjuk rasa', 'Sabotase', 'Perusakan material', 'Kasus tanah', 'Ancaman',
  'Penculikan', 'DTT', 'Kebakaran', 'Kecelakaan kerja', 'Kecelakaan lalu lintas', 'Serangan fisik', 'Serangan data',
  'Lainnya',
] as const;

const found = <T extends z.ZodTypeAny>(value: T) =>
  z
    .object({
      value,
      /** kutipan persis dari cerita yang menjadi dasar saran */
      src: z.string(),
      /** hi = disebut eksplisit; md = disimpulkan, perlu dicek */
      confidence: z.enum(['hi', 'md']),
    })
    .nullable();

export const ExtractionSchema = z.object({
  kind: found(z.enum(['insiden', 'kerawanan'])),
  time: found(z.object({ date: z.string(), time: z.string() })),
  title: found(z.string()),
  patokan: found(z.string()),
  category: found(z.enum(SKK_CATEGORIES)),
  securityImpact: found(z.string()),
  ops: found(z.object({ state: z.enum(['tidak', 'sebagian', 'berhenti']), hours: z.number().nullable() })),
  casualty: found(z.object({ kind: z.enum(['none', 'p3k', 'klinik', 'berat', 'meninggal', 'belum']), count: z.number() })),
  lossIdr: found(z.number()),
  handledBy: found(z.enum(['belum', 'int', 'bujp', 'tni', 'polri'])),
  axes: found(z.array(z.enum(['prop', 'man', 'ling', 'data']))),
  chronology: found(z.string()),
  initialAction: found(z.string()),
  locationName: z.string().nullable(),
  locationMention: z.string().nullable(),
  k3: z.boolean(),
});

export type ExtractionData = z.infer<typeof ExtractionSchema>;
