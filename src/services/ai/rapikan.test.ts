import { describe, expect, it } from 'vitest';
import { MIN_TIDY, rapikan, sameFacts } from './rapikan';

describe('rapikan (mock AI)', () => {
  it('merapikan contoh Ringkasan dan mempertahankan fakta', () => {
    const r = rapikan('kabel 40m diganti, pompa nyala lg 29 okt jam 16.10. udh lapor polisi. gembok panel ganti yg anti potong');
    expect(r.ok).toBe(true);
    expect(r.suggestion).toBe('Kabel 40 m diganti dan pompa menyala lagi pada 29 Okt pukul 16.10. Laporan polisi sudah dibuat. Gembok panel diganti dengan tipe anti potong.');
  });
  it('menolak usulan yang mengubah angka', () => {
    const r = rapikan('pagar sisi panel cuma 1,5 m');
    expect(r.ok).toBe(false);
    expect(r.suggestion).toBe('');
    expect(sameFacts('pagar 1,5 m', 'Pagar 1,2 m.')).toBe(false);
  });
  it('batas minimal 20 karakter', () => {
    expect(MIN_TIDY).toBe(20);
  });
});
