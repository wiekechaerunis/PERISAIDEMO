import { describe, expect, it } from 'vitest';
import { addWorkingDays } from './workdays';

describe('addWorkingDays', () => {
  it('Rabu 28 Okt 2026 07:00 + 3 hari kerja = Senin 2 Nov 2026 07:00', () => {
    expect(addWorkingDays('2026-10-28T07:00:00', 3, [])).toBe('2026-11-02T07:00:00');
  });
  it('+ 10 hari kerja = 11 Nov 2026', () => {
    expect(addWorkingDays('2026-10-28T07:00:00', 10, [])).toBe('2026-11-11T07:00:00');
  });
  it('melewati libur nasional dari kalender', () => {
    expect(addWorkingDays('2026-12-23T07:00:00', 2, ['2026-12-24', '2026-12-25'])).toBe('2026-12-29T07:00:00');
  });
  it('contoh konfigurasi: registrasi 18 Nov 2026', () => {
    const r = '2026-11-18T10:42:00';
    expect([1, 3, 7, 14].map((n) => addWorkingDays(r, n, []).slice(0, 10))).toEqual(['2026-11-19', '2026-11-23', '2026-11-27', '2026-12-08']);
  });
});
