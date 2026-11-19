import type { AiService } from './types';
import { mockAi } from './mock';
import { claudeAi } from './claude';

/**
 * Adapter AI aktif. Bawaan `mock` (deterministik, tanpa jaringan). Bila server melaporkan ANTHROPIC_API_KEY terpasang
 * (GET /api/copilot → { enabled: true }), dipakai adapter `claude`. `forceMockAi()` memaksa mock (tombol "Pakai mode contoh").
 */
let mode: 'mock' | 'claude' | null = null;
let forcedMock = false;

async function detect() {
  try {
    const r = await fetch('/api/copilot');
    const j = (await r.json()) as { enabled?: boolean };
    mode = j.enabled ? 'claude' : 'mock';
  } catch {
    mode = 'mock';
  }
}

export const ai: AiService = {
  async extract(story, opts) {
    if (!mode) await detect();
    return mode === 'claude' && !forcedMock ? claudeAi.extract(story, opts) : mockAi.extract(story, opts);
  },
  isOutOfScope: (m) => mockAi.isOutOfScope(m),
};

/** Pakai mode contoh (mock) untuk sisa sesi, mis. setelah AI gagal. */
export const forceMockAi = () => {
  forcedMock = true;
};
/** Apakah adapter `claude` sedang aktif (untuk menampilkan opsi mode contoh pada state gagal). */
export const claudeActive = () => mode === 'claude' && !forcedMock;

export type { AiService, Extraction } from './types';
