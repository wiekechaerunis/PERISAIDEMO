import { describe, expect, it } from 'vitest';
import { seedWaMessages } from '@/services/mock/seedWa';
import { suggestFromMessage } from './logic/extract';

describe('pesan dummy WAM-009 (beberapa bubble, detail)', () => {
  it('paling atas di daftar, Prioritas, dan mengisi sebagian besar form insiden', async () => {
    const list = seedWaMessages();
    const m = list.find((x) => x.id === 'WAM-009')!;
    expect(m.priority).toBe(true);
    expect(m.bubbles).toHaveLength(3);
    const top = [...list].sort((a, b) => Number(!!b.priority && b.status === 'baru') - Number(!!a.priority && a.status === 'baru') || b.at.localeCompare(a.at))[0];
    expect(top.id).toBe('WAM-009');
    const r = await suggestFromMessage(m);
    expect(r.aiState).toBe('ok');
    const f = r.form;
    expect(f.kind).toBe('insiden');
    expect(f.time).toBe('02:30');
    expect(f.title).toMatch(/kabel/i);
    expect(f.securityImpact).not.toBe('');
    expect(f.patokan).toMatch(/ADR-05/);
    expect(f.category).toBeTruthy();
    expect(f.ops).toBe('berhenti');
    expect(f.opsHours).toBe(5);
    expect(f.lossIdr).toBe(12_000_000);
    expect(f.axes).toContain('prop');
    expect(f.handledBy).toContain('bujp');
    expect(f.attachments).toHaveLength(2);
  });
});
