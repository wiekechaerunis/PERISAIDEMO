// ADJ-11: cek laporan ganda saat ajukan ulang hanya bila lokasi, waktu kejadian, atau kategori berubah.
import { describe, expect, it } from 'vitest';
import { seedState } from '@/services/mock/seed';
import { draftFromIncident } from '../components/detail/detailLogic';
import { changedFields, similarOnResubmit } from './resubmit';

const s = seedState();
const prev = s.incidents.find((i) => i.no === 'INS-SEN-2026-0006')!; // Perlu perbaikan

describe('ajukan ulang (ADJ-11)', () => {
  it('hanya mengubah kronologi: tidak ada field pemicu, dialog ganda tidak muncul', () => {
    const d = { ...draftFromIncident(prev), story: 'Kronologi diperjelas.' };
    expect(changedFields(prev, d)).toEqual([]);
  });
  it('mengubah lokasi/waktu/kategori memicu cek ulang; kecocokan yang sudah diputus tidak ditanyakan lagi', () => {
    const d = { ...draftFromIncident(prev), category: 'Pencurian/Perampokan', date: '2026-10-28', time: '01:30', wk: 'WK Andalas Darat' };
    expect(changedFields(prev, d)).toEqual(expect.arrayContaining(['waktu kejadian', 'kategori']));
    const all = similarOnResubmit(prev.no, d, s.incidents);
    expect(all.map((x) => x.no)).toContain('INS-SEN-2026-0007');
    expect(similarOnResubmit(prev.no, d, s.incidents, ['INS-SEN-2026-0007']).map((x) => x.no)).not.toContain('INS-SEN-2026-0007');
  });
});
