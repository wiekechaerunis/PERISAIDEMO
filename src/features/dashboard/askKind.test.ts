import { describe, expect, it } from 'vitest';
import { askKind } from './askKind';

describe('askKind (Tanya data, kata kunci)', () => {
  it('mengenali 4 jenis pertanyaan demo, saran, dan tidak dikenali', () => {
    expect(askKind('')).toBe('saran');
    expect(askKind('insiden Kritis di Sumbagsel bulan Juni')).toBe('kritis');
    expect(askKind('KKKS dengan kerugian terbesar')).toBe('kkks');
    expect(askKind('WK dengan insiden terbanyak')).toBe('kkks');
    expect(askKind('pencurian Maret vs Juni')).toBe('banding');
    expect(askKind('insiden lewat tenggat')).toBe('telat');
    expect(askKind('kebakaran kilang bulan depan')).toBe('tidakpaham');
  });
});
