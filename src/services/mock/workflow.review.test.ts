import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { resolveDuplicate, setJenis } from './workflow';

describe('workflow review (tambahan)', () => {
  it('resolveDuplicate menghapus tanda ganda dan mencatat jejak', () => {
    const r = resolveDuplicate(seedState(), 'INS-SEN-2026-0009', 'Sari', null);
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0009')!;
    expect(i.possibleDuplicate).toBe(false);
    expect(i.status).toBe('review-internal');
    expect(i.timeline!.at(-1)!.text).toContain('terpisah');
    const t = resolveDuplicate(seedState(), 'INS-SEN-2026-0009', 'Sari', 'INS-SEN-2026-0007');
    expect(t.ok && t.state.incidents.find((x) => x.no === 'INS-SEN-2026-0009')!.timeline!.at(-1)!.text).toContain('INS-SEN-2026-0007');
  });
  it('resolveDuplicate ditolak bila sudah diputus', () => {
    expect(resolveDuplicate(seedState(), 'INS-SEN-2026-0004', 'Sari', null).ok).toBe(false);
  });
  it('setJenis mengubah jenis di detail', () => {
    const r = setJenis(seedState(), 'INS-SEN-2026-0004', 'Tapping');
    expect(r.ok && r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0004')!.detail!.jenis).toBe('Tapping');
    expect(setJenis(seedState(), 'NOPE', 'x').ok).toBe(false);
  });
});
