import { afterEach, describe, expect, it, vi } from 'vitest';
import { claudeAi } from './claude';
import { ExtractionSchema } from './schema';
import { extractStory } from './mock';

const STORY =
  'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta.';

afterEach(() => vi.unstubAllGlobals());

const okFetch = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: async () => body });

describe('adapter claude (klien)', () => {
  it('menerima respons yang lolos skema Zod', async () => {
    const extraction = extractStory(STORY); // bentuknya sama dengan skema
    vi.stubGlobal('fetch', okFetch({ extraction }));
    const r = await claudeAi.extract(STORY);
    expect(r.title?.value).toBe(extraction.title?.value);
    expect(fetch).toHaveBeenCalledWith('/api/copilot', expect.objectContaining({ method: 'POST' }));
  });

  it('respons yang tidak sesuai skema ditolak (UI menampilkan state gagal)', async () => {
    vi.stubGlobal('fetch', okFetch({ extraction: { title: 123 } }));
    await expect(claudeAi.extract(STORY)).rejects.toThrow();
  });

  it('galat server (502) ditolak', async () => {
    vi.stubGlobal('fetch', okFetch({ error: 'ai' }, false, 502));
    await expect(claudeAi.extract(STORY)).rejects.toThrow('ai 502');
  });

  it('timeout membatalkan permintaan', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_u: string, init: { signal: AbortSignal }) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('abort'))))),
    );
    const p = claudeAi.extract(STORY);
    const assertion = expect(p).rejects.toThrow('abort');
    await vi.advanceTimersByTimeAsync(9000);
    await assertion;
    vi.useRealTimers();
  });
});

describe('skema ekstraksi', () => {
  it('hasil mock cerita demo lolos ExtractionSchema', () => {
    expect(ExtractionSchema.safeParse(extractStory(STORY)).success).toBe(true);
  });
  it('kategori di luar 19 daftar SKK ditolak', () => {
    const x = extractStory(STORY);
    const bad = { ...x, category: { value: 'Pencurian kabel', src: 'x', confidence: 'hi' } };
    expect(ExtractionSchema.safeParse(bad).success).toBe(false);
  });
});
