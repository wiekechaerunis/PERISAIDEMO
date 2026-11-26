import { describe, expect, it } from 'vitest';
import { INC } from './dashboard';

describe('data demo Dashboard', () => {
  it('nomor insiden unik, termasuk area tambahan milik KKKS yang sudah ada (BJE di tjb dan jbi)', () => {
    const ids = (INC as unknown[][]).map((r) => String(r[0]));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const bje = (INC as unknown[][]).filter((r) => String(r[0]).startsWith('INS-BJE-'));
    expect(bje.filter((r) => r[1] === 'jbi').map((r) => r[0])).toEqual(['INS-BJE-2026-0007', 'INS-BJE-2026-0008', 'INS-BJE-2026-0009', 'INS-BJE-2026-0010']);
  });
});
