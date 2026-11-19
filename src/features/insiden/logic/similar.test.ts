import { describe, expect, it } from 'vitest';
import { seedState } from '@/services/mock/seed';
import { historyIncidents } from '@/services/mock/seedHistory';
import type { Incident } from '@/services/types';
import { findSimilar, similarDots, similarPatterns, similarPools, similarStats, similarSteps } from './similar';

const seed = seedState().incidents;
const target = seed.find((i) => i.no === 'INS-SEN-2026-0007')!;
const hist = historyIncidents();
const strict7 = hist.slice(0, 7);

describe('insiden serupa', () => {
  it('seed riwayat: 7 kasus di WK Andalas Darat dalam 18 bulan, 2 lainnya hanya masuk 36 bulan', () => {
    const p = similarPools(target, [...seed, ...hist]);
    expect(p.strict).toHaveLength(7);
    expect(p.wide).toHaveLength(9);
  });

  it('≥3 kasus: tampil penuh dengan median sesuai board', () => {
    const r = findSimilar(target, [...seed, ...hist]);
    expect(r.mode).toBe('full');
    expect(r.scope).toBe('wk-18');
    expect(r.cases).toHaveLength(7);
    const s = Object.fromEntries(similarStats(r.cases).map((x) => [x.key, x]));
    expect(s.ops.value).toBe('14 jam');
    expect(s.ops.note).toBe('median · 7 kasus');
    expect(s.loss.value).toBe('Rp16,8 jt');
    expect(s.loss.note).toBe('median · 5 kasus');
    expect(s.days.value).toBe('2,5 hari');
  });

  it('pola, langkah, dan titik peta cocok dengan board', () => {
    const cases = findSimilar(target, hist).cases;
    expect(similarPatterns(cases).map((p) => [p.key, p.count])).toEqual([['night', 5], ['remote', 6], ['panel', 4], ['cut', 3]]);
    expect(similarSteps(cases).map((s) => s.count)).toEqual([6, 7, 2, 4]);
    const dots = similarDots(cases);
    expect(dots).toHaveLength(7);
    expect(dots[0]).toMatchObject({ x: 172, y: 78 });
    expect(dots.filter((d) => d.tags.includes('cut'))).toHaveLength(3);
  });

  it('<3 di WK sendiri: cakupan diperluas ke 36 bulan dan seluruh WK; masih <3 menjadi "few"', () => {
    const lama = hist[8]; // Rimau, Nov 2024
    const r = findSimilar(target, [strict7[0], strict7[1], lama]);
    expect(r.mode).toBe('full'); // 3 kasus setelah diperluas
    expect(r.scope).toBe('org-36');
    const few = findSimilar(target, [strict7[0], lama]);
    expect(few.mode).toBe('few');
    expect(few.cases).toHaveLength(2);
  });

  it('0 kasus: "none"; insiden terbatas, digabung, atau kategori lain tidak dihitung', () => {
    const noisy: Incident[] = [
      { ...strict7[0], restricted: true },
      { ...strict7[1], mergedInto: 'INS-SEN-2026-0001' },
      { ...strict7[2], category: 'Ancaman' },
      { ...strict7[3], status: 'dalam-penanganan' },
      { ...strict7[4], org: 'PT Lain' },
    ];
    expect(findSimilar(target, noisy).mode).toBe('none');
    expect(findSimilar(target, []).cases).toHaveLength(0);
  });

  it('force demo: ?rec=none dan ?rec=few; ?rec=few memakai 2 kasus rujukan di luar 18 bulan', () => {
    expect(findSimilar(target, hist, 'none').mode).toBe('none');
    const few = findSimilar(target, hist, 'few');
    expect(few.mode).toBe('few');
    expect(few.cases.map((c) => c.no)).toEqual(['INS-SEN-2025-0012', 'INS-SEN-2024-0377']);
  });
});
