import { describe, expect, it, vi } from 'vitest';
import { extractStory } from '../src/services/ai/mock';

const parse = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse };
  },
}));

import { COPILOT_MODEL, COPILOT_TIMEOUT_MS, copilotEnabled, extractWithClaude } from './copilotCore';

const STORY = 'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong, sekitar 40 m hilang. Tidak ada korban.';

describe('copilotCore (server)', () => {
  it('copilotEnabled mengikuti ANTHROPIC_API_KEY', () => {
    expect(copilotEnabled({})).toBe(false);
    expect(copilotEnabled({ ANTHROPIC_API_KEY: 'sk-x' })).toBe(true);
  });

  it('memanggil Claude dengan model, effort rendah, format Zod dan timeout 8 detik', async () => {
    parse.mockResolvedValueOnce({ stop_reason: 'end_turn', parsed_output: extractStory(STORY) });
    const r = await extractWithClaude(STORY, '2026-10-28T13:00:00', 'sk-test');
    expect(r.kind?.value).toBe('insiden');
    const [params, opts] = parse.mock.calls[0];
    expect(params.model).toBe(COPILOT_MODEL);
    expect(params.output_config.effort).toBe('low');
    expect(params.output_config.format).toBeTruthy();
    expect(params.messages[0].content).toContain('2026-10-28');
    expect(opts.timeout).toBe(COPILOT_TIMEOUT_MS);
  });

  it('penolakan (refusal) dan keluaran tak terurai melempar galat', async () => {
    parse.mockResolvedValueOnce({ stop_reason: 'refusal', parsed_output: null });
    await expect(extractWithClaude(STORY, '2026-10-28T13:00:00', 'k')).rejects.toThrow('refusal');
    parse.mockResolvedValueOnce({ stop_reason: 'end_turn', parsed_output: null });
    await expect(extractWithClaude(STORY, '2026-10-28T13:00:00', 'k')).rejects.toThrow('parse');
  });
});
