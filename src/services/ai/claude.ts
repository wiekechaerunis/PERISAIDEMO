// Adapter `claude`: memanggil fungsi serverless /api/copilot (API key hanya di server). Gagal/timeout 8 detik → melempar,
// UI menampilkan state "AI Copilot sedang tidak tersedia" (board S19) dengan opsi pindah ke mode contoh.
import { demoNow } from '@/services/mock/clock';
import type { AiService, Extraction } from './types';
import { ExtractionSchema } from './schema';

import { mockAi } from './mock';

export const CLAUDE_TIMEOUT_MS = 8000;

export const claudeAi: AiService = {
  async extract(story, opts): Promise<Extraction> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CLAUDE_TIMEOUT_MS + 500);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, now: opts?.now ?? demoNow() }),
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error(`ai ${res.status}`);
      const body = (await res.json()) as { extraction?: unknown };
      const parsed = ExtractionSchema.safeParse(body.extraction);
      if (!parsed.success) throw new Error('schema');
      return parsed.data;
    } finally {
      clearTimeout(timer);
    }
  },
  isOutOfScope: mockAi.isOutOfScope,
};
