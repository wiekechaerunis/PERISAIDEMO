import { describe, expect, it } from 'vitest';
import { seedState } from '@/services/mock/seed';
import { DEMO_START } from '@/services/mock/clock';
import { scopedIncidents, visibleIncidents } from './list';
import {
  draftToPeriod, inRange, isIsoDate, kerawananWhen, parsePeriod, periodLabel, periodRange, rangeCaption, validateCustomRange, withPeriod,
  type PeriodPreset,
} from './period';

const NOW = DEMO_START; // 28 Okt 2026 13:00 WIB

describe('periodRange (demoNow 28 Okt 2026 13:00 WIB)', () => {
  it('semua preset', () => {
    expect(periodRange('all', NOW)).toBeNull();
    expect(periodRange('7h', NOW)).toEqual({ from: '2026-10-21', to: '2026-10-28' });
    expect(periodRange('30h', NOW)).toEqual({ from: '2026-09-28', to: '2026-10-28' });
    expect(periodRange('bulan', NOW)).toEqual({ from: '2026-10-01', to: '2026-10-28' });
    expect(periodRange('3b', NOW)).toEqual({ from: '2026-07-28', to: '2026-10-28' });
    expect(periodRange('tahun', NOW)).toEqual({ from: '2026-01-01', to: '2026-10-28' });
  });

  it('batas inklusif: 00:00 hari pertama dan 23:59 hari terakhir masuk, sehari di luar tidak', () => {
    const r = periodRange('7h', NOW);
    expect(inRange('2026-10-21T00:00:00', r)).toBe(true);
    expect(inRange('2026-10-20T23:59:59', r)).toBe(false);
    expect(inRange('2026-10-28T23:59:00', r)).toBe(true);
    expect(inRange('2026-10-29T00:00:00', r)).toBe(false);
    expect(inRange('1999-01-01T00:00:00', null)).toBe(true);
  });

  it('pergantian bulan dan tahun', () => {
    expect(periodRange('7h', '2026-03-03T08:00:00')).toEqual({ from: '2026-02-24', to: '2026-03-03' });
    expect(periodRange('30h', '2026-01-10T08:00:00')).toEqual({ from: '2025-12-11', to: '2026-01-10' });
    expect(periodRange('3b', '2026-02-15T08:00:00')).toEqual({ from: '2025-11-15', to: '2026-02-15' });
    // akhir bulan dipotong: 31 Mei 2026 mundur 3 bulan = 28 Feb (bukan kabisat); 31 Mei 2028 = 29 Feb
    expect(periodRange('3b', '2026-05-31T08:00:00')!.from).toBe('2026-02-28');
    expect(periodRange('3b', '2028-05-31T08:00:00')!.from).toBe('2028-02-29');
    expect(periodRange('bulan', '2026-01-01T00:05:00')).toEqual({ from: '2026-01-01', to: '2026-01-01' });
    expect(periodRange('tahun', '2027-01-01T00:05:00')).toEqual({ from: '2027-01-01', to: '2027-01-01' });
  });

  it('WIB: memakai tanggal dari ISO lokal, bukan zona mesin (23:30 WIB tetap hari itu)', () => {
    expect(periodRange('7h', '2026-10-28T23:30:00')!.to).toBe('2026-10-28');
    expect(periodRange('bulan', '2026-10-31T23:59:00')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(inRange('2026-10-01T00:00:00', periodRange('bulan', '2026-10-31T23:59:00'))).toBe(true);
  });

  it('caption rentang', () => {
    expect(rangeCaption(periodRange('30h', NOW)!)).toBe('28 Sep – 28 Okt 2026');
    expect(rangeCaption({ from: '2026-10-01', to: '2026-10-15' })).toBe('1–15 Okt 2026');
    expect(rangeCaption({ from: '2026-10-15', to: '2026-10-15' })).toBe('15 Okt 2026');
    expect(rangeCaption({ from: '2025-12-28', to: '2026-01-05' })).toBe('28 Des 2025 – 5 Jan 2026');
    expect(periodLabel({ kind: 'preset', preset: '30h' })).toBe('30 hari terakhir');
    expect(periodLabel({ kind: 'custom', from: '2026-10-01', to: '2026-10-15' })).toBe('1–15 Okt 2026');
  });
});

describe('validasi rentang khusus', () => {
  const T = '2026-10-28';
  it('terbalik', () => expect(validateCustomRange('2026-10-15', '2026-10-01', T)).toBe('Tanggal akhir tidak boleh sebelum tanggal awal.'));
  it('masa depan (awal atau akhir)', () => {
    expect(validateCustomRange('2026-10-01', '2026-10-29', T)).toBe('Tanggal tidak boleh melewati hari ini.');
    expect(validateCustomRange('2026-11-01', '', T)).toBe('Tanggal tidak boleh melewati hari ini.');
  });
  it('hari yang sama dan hari ini valid', () => {
    expect(validateCustomRange('2026-10-15', '2026-10-15', T)).toBeNull();
    expect(validateCustomRange('2026-10-28', '2026-10-28', T)).toBeNull();
  });
  it('belum lengkap bukan galat, tetapi belum bisa diterapkan', () => {
    expect(validateCustomRange('2026-10-01', '', T)).toBeNull();
    expect(draftToPeriod({ choice: 'custom', from: '2026-10-01', to: '' }, T)).toBeNull();
    expect(draftToPeriod({ choice: 'custom', from: '2026-10-15', to: '2026-10-01' }, T)).toBeNull();
    expect(draftToPeriod({ choice: 'custom', from: '2026-10-01', to: '2026-10-15' }, T)).toEqual({ kind: 'custom', from: '2026-10-01', to: '2026-10-15' });
    expect(draftToPeriod({ choice: '7h', from: '', to: '' }, T)).toEqual({ kind: 'preset', preset: '7h' });
  });
  it('isIsoDate menolak tanggal mustahil', () => {
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('1-10-2026')).toBe(false);
  });
});

describe('URL ?periode / ?dari&sampai', () => {
  const T = '2026-10-28';
  const p = (q: string) => parsePeriod(new URLSearchParams(q), T);
  it('preset dan rentang khusus terbaca', () => {
    for (const k of ['7h', '30h', 'bulan', '3b', 'tahun']) expect(p('periode=' + k)).toEqual({ kind: 'preset', preset: k });
    expect(p('dari=2026-10-01&sampai=2026-10-15')).toEqual({ kind: 'custom', from: '2026-10-01', to: '2026-10-15' });
  });
  it('nilai tidak valid diabaikan → Semua waktu', () => {
    const all = { kind: 'preset', preset: 'all' };
    for (const q of ['periode=99h', 'periode=all', 'dari=2026-10-15&sampai=2026-10-01', 'dari=2026-10-01&sampai=2026-11-30', 'dari=2026-10-01', 'dari=x&sampai=y', 'dari=2026-02-30&sampai=2026-03-01'])
      expect(p(q)).toEqual(all);
  });
  it('withPeriod mempertahankan parameter lain dan menghapus yang lama', () => {
    const base = new URLSearchParams('tab=kerawanan&periode=7h');
    expect(withPeriod(base, { kind: 'custom', from: '2026-10-01', to: '2026-10-15' }).toString()).toBe('tab=kerawanan&dari=2026-10-01&sampai=2026-10-15');
    expect(withPeriod(base, { kind: 'preset', preset: 'all' }).toString()).toBe('tab=kerawanan');
    expect(withPeriod(new URLSearchParams('dari=2026-10-01&sampai=2026-10-15'), { kind: 'preset', preset: '3b' }).toString()).toBe('periode=3b');
  });
});

describe('data demo per preset', () => {
  const s = seedState();
  const PRESETS: PeriodPreset[] = ['7h', '30h', 'bulan', '3b', 'tahun', 'all'];
  const count = (role: Parameters<typeof scopedIncidents>[1], p: PeriodPreset) =>
    scopedIncidents(s.incidents, role).filter((i) => inRange(i.occurredAt, periodRange(p, NOW))).length;
  it('Pejabat: 7 hari < 30 hari = bulan ini < 3 bulan < tahun berjalan < semua waktu', () => {
    expect(PRESETS.map((p) => count('pejabat', p))).toEqual([7, 8, 8, 9, 10, 11]);
  });
  it('Pelapor dan Pengawas SKK', () => {
    expect(PRESETS.map((p) => count('pelapor', p))).toEqual([4, 5, 5, 6, 7, 8]);
    expect(PRESETS.map((p) => count('pengawas', p))).toEqual([6, 8, 8, 9, 10, 11]);
  });
  it('7 hari terakhir hanya berisi insiden 21–28 Okt', () => {
    const r = periodRange('7h', NOW);
    const rows = scopedIncidents(s.incidents, 'pejabat').filter((i) => inRange(i.occurredAt, r));
    expect(rows.every((i) => i.occurredAt >= '2026-10-21' && i.occurredAt < '2026-10-29')).toBe(true);
  });
  it('30 hari terakhir = isi daftar lama (visibleIncidents), jadi Tugas saya dan mobile tidak berubah', () => {
    for (const role of ['pelapor', 'pejabat', 'pic', 'pengawas'] as const) {
      const r = periodRange('30h', NOW);
      expect(scopedIncidents(s.incidents, role).filter((i) => inRange(i.occurredAt, r)).map((i) => i.no)).toEqual(
        visibleIncidents(s.incidents, role).map((i) => i.no),
      );
    }
  });
  it('kerawanan memakai waktu yang tampil di kolom Waktu diketahui', () => {
    const k = s.kerawanan.find((x) => x.no === 'KRW-SEN-2026-0046')!;
    expect(kerawananWhen(k)).toBe('2026-11-18T02:40:00');
    expect(kerawananWhen({ ...k, no: 'KRW-SEN-2026-0999', observedAt: '2026-10-27T09:00:00' })).toBe('2026-10-27T09:00:00');
  });
});
