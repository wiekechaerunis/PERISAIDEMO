// ADJ-07: Perbarui dampak selama penanganan, konfirmasi penurunan level, Koreksi data setelah ditutup.
import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { correctClosedData, resolveLevelChange, updateImpact, type ImpactPatch } from './workflow.impact';

const NO = 'INS-SEN-2026-0010'; // Dalam penanganan, Sedang
const s0 = seedState();
const inc = (s: typeof s0) => s.incidents.find((i) => i.no === NO)!;
const base = (): ImpactPatch => {
  const d = inc(s0).detail!;
  return { ops: d.ops, opsHours: d.opsHours, ongoing: d.ongoing, casualties: { ...d.casualties }, lossIdr: d.lossIdr, reason: 'Info baru dari lapangan.' };
};

describe('Perbarui dampak (ADJ-07)', () => {
  it('alasan wajib minimal 10 karakter', () => {
    const r = updateImpact(s0, NO, 'Andi Pratama', { ...base(), casualties: { meninggal: 1 }, reason: 'singkat' }, false);
    expect(r.ok).toBe(false);
  });
  it('PIC menambah korban meninggal: level naik ke Kritis langsung, SKK diberi tahu, tenggat tidak lebih lama', () => {
    const before = inc(s0);
    const r = updateImpact(s0, NO, 'Andi Pratama', { ...base(), casualties: { meninggal: 1 } }, false);
    if (!r.ok) throw new Error(r.reason);
    const i = inc(r.state as typeof s0);
    expect(i.severity).toBe('kritis');
    expect(i.skkNotified).toBe(true);
    expect(i.levelChange).toMatchObject({ dir: 'up', from: before.severity, to: 'kritis' });
    expect(i.handleDueAt! <= before.handleDueAt!).toBe(true);
    expect(i.timeline!.some((t) => t.text.startsWith('Memperbarui dampak') && t.text.includes('→'))).toBe(true);
    // Pejabat mengembalikan ke level sebelumnya dengan alasan
    const back = resolveLevelChange(r.state, NO, 'Sari Wulandari', false, 'Korban ternyata bukan akibat insiden ini.');
    if (!back.ok) throw new Error(back.reason);
    expect(inc(back.state as typeof s0).severity).toBe(before.severity);
  });
  it('saran turun oleh PIC: level tetap sampai Pejabat mengonfirmasi; oleh Pejabat langsung berubah', () => {
    const p = { ...base(), ops: 'tidak' as const, opsHours: null, casualties: {}, lossIdr: null };
    const r = updateImpact(s0, NO, 'Andi Pratama', p, false);
    if (!r.ok) throw new Error(r.reason);
    const i = inc(r.state as typeof s0);
    if (i.levelChange) {
      expect(i.severity).toBe(inc(s0).severity);
      expect(i.levelChange.dir).toBe('down');
      const ok = resolveLevelChange(r.state, NO, 'Sari Wulandari', true);
      if (!ok.ok) throw new Error(ok.reason);
      expect(inc(ok.state as typeof s0).severity).toBe(i.levelChange.to);
    }
    const pj = updateImpact(s0, NO, 'Sari Wulandari', p, true);
    if (!pj.ok) throw new Error(pj.reason);
    expect(inc(pj.state as typeof s0).levelChange).toBeUndefined();
  });
});

describe('Koreksi data setelah ditutup (ADJ-07 butir 8, PD3)', () => {
  it('status tetap Ditutup dan Riwayat mencatat sebelum → sesudah', () => {
    const closed = { ...s0, incidents: s0.incidents.map((i) => (i.no === NO ? { ...i, status: 'ditutup' as const, handling: { ...i.handling!, closure: { ...(i.handling?.closure ?? { partners: [], casualtiesFinal: {}, lossFinalIdr: 21_400_000, opsHoursFinal: null, cause: '', actions: '', outcome: '' }), lossFinalIdr: 21_400_000 } } } : i)) };
    const r = correctClosedData(closed, NO, 'Sari Wulandari', 23_900_000, 'Tagihan vendor keluar 6 Nov.');
    if (!r.ok) throw new Error(r.reason);
    const i = inc(r.state as typeof s0);
    expect(i.status).toBe('ditutup');
    expect(i.handling?.closure?.lossFinalIdr).toBe(23_900_000);
    expect(i.timeline!.at(-1)!.text).toMatch(/^Koreksi data: Kerugian final Rp.*21\.400\.000 → Rp.*23\.900\.000/);
  });
});
