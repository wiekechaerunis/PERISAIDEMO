// Data penutupan setelah sinkron INS-ADJ: ADJ-14 (Penyebab utama, Penjelasan penyebab, Faktor pendukung, 5 isian wajib)
// dan ADJ-12 (Produksi hilang/LPO).
import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { CLOSURE_REQUIRED, closureCompleteness, requestClosure, saveClosure } from './workflow.handling';
import { lpoCalc, lpoMissing } from '@/features/insiden/components/handling/LpoSection';
import type { Closure } from '../types';

const NO = 'INS-SEN-2026-0007';
const base = (sev: 'tinggi' | 'sedang') => {
  const s = seedState();
  return { ...s, incidents: s.incidents.map((i) => (i.no === NO ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama', severity: sev } : i)) };
};
const filled: Partial<Closure> = {
  actions: 'Kabel diganti.', partners: ['bujp'], cause: 'Celah pengamanan fisik', factors: [],
  evidence: [{ name: 'a.jpg', sizeKb: 1, caption: '' }], result: 'tidak-ada',
};
const fill = (sev: 'tinggi' | 'sedang', p: Partial<Closure> = {}) => {
  const r = saveClosure(base(sev), NO, 'Andi Pratama', { ...filled, ...p });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('ADJ-14', () => {
  it('isian wajib 5 dan Faktor pendukung opsional', () => {
    expect(CLOSURE_REQUIRED.map((r) => r.label)).toEqual(['Ringkasan penanganan', 'Tim terlibat', 'Penyebab utama', 'Bukti penyelesaian', 'Hasil pengamanan']);
    const s = fill('sedang');
    expect(closureCompleteness(s.incidents.find((i) => i.no === NO)!)).toMatchObject({ done: 5, total: 5, complete: true });
    expect(requestClosure(s, NO, 'Andi Pratama').ok).toBe(true);
  });
  it('Tinggi tanpa Penjelasan penyebab ditolak; dengan penjelasan berhasil', () => {
    const r = requestClosure(fill('tinggi'), NO, 'Andi Pratama');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain('Penyebab utama');
    expect(requestClosure(fill('tinggi', { causeDetail: 'Panel di luar jangkauan CCTV.' }), NO, 'Andi Pratama').ok).toBe(true);
  });
});

describe('ADJ-12 · Produksi hilang (LPO)', () => {
  it('minyak 200 bbl/hari, berhenti 6 jam, US$70 → 50 bbl dan US$3.500', () => {
    expect(lpoCalc({ choice: 'ada', kind: 'minyak', normalBblPerDay: 200, stopHours: 6, priceUsd: 70 })).toEqual({ volume: 50, value: 3500 });
  });
  it('Ada tanpa sumber angka atau dokumen menahan Ajukan penutupan; Belum dihitung tidak menahan', () => {
    expect(lpoMissing({ choice: 'ada', kind: 'minyak' })).toEqual(['Sumber angka', 'Dokumen pendukung']);
    const r = requestClosure(fill('sedang', { lpo: { choice: 'ada', kind: 'minyak', normalBblPerDay: 200 } }), NO, 'Andi Pratama');
    expect(r.ok).toBe(false);
    expect(requestClosure(fill('sedang', { lpo: { choice: 'belum' } }), NO, 'Andi Pratama').ok).toBe(true);
  });
});
