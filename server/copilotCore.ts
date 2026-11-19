// Inti AI Copilot sisi server: dipakai `api/copilot.ts` (Vercel) dan middleware dev Vite. API key hanya dibaca di sini.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ExtractionSchema, type ExtractionData } from '../src/services/ai/schema';

export const COPILOT_MODEL = 'claude-opus-5-5';
export const COPILOT_TIMEOUT_MS = 8000;

const SYSTEM = `Kamu AI Copilot untuk form laporan insiden keamanan hulu migas (PERISAI, SKK Migas).
Tugasmu: membaca cerita pelapor lalu mengusulkan isian form. Kamu HANYA menyarankan; pelapor yang memutuskan.

Aturan:
- Isi hanya yang benar-benar tersirat atau tersurat dalam cerita. Jika tidak ada dasarnya, kembalikan null untuk field itu. Jangan mengarang.
- "src" harus kutipan PERSIS (potongan pendek, karakter demi karakter) dari cerita yang menjadi dasar. Jangan merangkum atau menggabungkan potongan terpisah; UI menyembunyikan kutipan yang bukan potongan asli.
- confidence "hi" hanya bila disebut eksplisit; "md" bila disimpulkan atau angkanya perkiraan.
- Jangan menentukan keparahan, PIC, atau keputusan apa pun.
- kind: "insiden" bila ada kerugian, korban, atau operasi terganggu; selain itu "kerawanan".
- time: tanggal dan jam kejadian (WIB). Ubah waktu relatif ("jam 1 malam", "semalam") memakai tanggal referensi yang diberikan; format date YYYY-MM-DD dan time HH:mm 24 jam.
- title: judul singkat (≤ 120 karakter) dalam bahasa Indonesia baku, sentence case, tanpa emoji.
- category: pilih persis satu dari daftar kategori SKK yang diberikan skema.
- lossIdr: kerugian dalam Rupiah (angka penuh, mis. "18,5 juta" menjadi 18500000).
- handledBy: siapa yang sudah menangani (belum/int = security internal/bujp/tni/polri).
- locationName: nama lokasi yang disebut (mis. "Sumur ADR-07") atau null. Jangan menebak koordinat atau wilayah kerja.
- locationMention: nama blok atau WK yang disebut cerita (mis. "Blok Rokan") atau null; dibandingkan UI dengan WK dari titik peta.
- axes: sumbu yang terdampak, urut dari: "prop" (properti atau operasi), "man" (manusia), "ling" (lingkungan pengamanan), "data" (data dan informasi). Hal yang disangkal ("tidak ada kebocoran") bukan dampak.
- casualty: kondisi korban p3k / klinik (dibawa ke klinik atau rumah sakit) / berat / meninggal; "none" bila cerita menyangkal ada korban; jumlah orang dari cerita (bawaan 1).
- chronology: ringkasan kronologi 1–2 kalimat, disusun dari kalimat cerita.
- initialAction: tindakan awal yang sudah dilakukan di lokasi (mis. P3K, dibawa ke klinik), bukan rencana.
- k3: true hanya bila cerita adalah kecelakaan kerja atau K3 (terjepit, terjatuh, tersengat, dan sejenisnya) TANPA unsur keamanan (pencurian, sabotase, ancaman, perusakan, penyerangan, blokade). Dalam kasus itu category tetap "Kecelakaan kerja". Selain itu false.
- Tulis semua teks dalam bahasa Indonesia baku.`;

export function copilotEnabled(env: Record<string, string | undefined>): boolean {
  return !!env.ANTHROPIC_API_KEY;
}

/** Panggil Claude, kembalikan saran terstruktur tervalidasi Zod. Melempar bila gagal/timeout/ditolak. */
export async function extractWithClaude(story: string, nowIso: string, apiKey: string): Promise<ExtractionData> {
  const client = new Anthropic({ apiKey, maxRetries: 0 });
  const response = await client.messages.parse(
    {
      model: COPILOT_MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      // Effort rendah: ekstraksi pendek, latensi harus di bawah batas 8 detik.
      output_config: { effort: 'low', format: zodOutputFormat(ExtractionSchema) },
      messages: [{ role: 'user', content: `Tanggal referensi (hari ini): ${nowIso.slice(0, 10)}.\n\nCerita pelapor:\n${story}` }],
    },
    { timeout: COPILOT_TIMEOUT_MS },
  );
  if (response.stop_reason === 'refusal') throw new Error('refusal');
  if (!response.parsed_output) throw new Error('parse');
  return response.parsed_output;
}
