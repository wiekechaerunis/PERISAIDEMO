import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { approve } from './workflow';
import { CFG_NOW, matrixVersion, updateDeadlines, updateLossThresholds, type ConfigActor, type DeadlineInput, type LossInput } from './workflow.config';
import { emptyDraft } from '@/features/insiden/logic/draft';
import { suggestedSeverityOf } from '@/features/insiden/logic/submit';

const ADMIN: ConfigActor = { name: 'Rina Hapsari', role: 'admin', roleLabel: 'Admin SKK' };
const PELAPOR: ConfigActor = { name: 'Budi Santoso', role: 'pelapor', roleLabel: 'Pelapor KKKS' };
const A = { by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi' as const, priority: 'tinggi' as const, pic: 'Andi Pratama', picKind: 'perorangan' as const, steps: [] };

const dl = (over: Partial<DeadlineInput> = {}): DeadlineInput => ({ kritis: 1, tinggi: 3, sedang: 7, rendah: 14, 'sangat-rendah': 14, ...over });
const loss = (over: Partial<LossInput> = {}): LossInput => ({
  rendah: 1000, sedang: 10000, tinggi: 100000, kritis: 1000000, effectiveFrom: '2028-01-01', basis: 'Keputusan rapat SKK', ...over,
});

describe('updateDeadlines', () => {
  it('Kritis 1 → 2 menyimpan nilai dan menulis riwayat', () => {
    const c = seedState().config;
    const r = updateDeadlines(c, dl({ kritis: 2 }), ADMIN);
    if (!r.ok) throw new Error(r.reason);
    expect(r.config.deadlines.kritis).toBe(2);
    expect(r.changed).toBe(1);
    expect(r.config.history![0]).toMatchObject({ key: 'tenggat', text: 'Kritis 1 → 2 hari kerja', by: 'Rina Hapsari', role: 'Admin SKK', at: CFG_NOW });
    expect(r.config.history!.length).toBe((c.history ?? []).length + 1);
  });
  it('banyak perubahan dirangkum dalam satu entri', () => {
    const r = updateDeadlines(seedState().config, dl({ kritis: 2, rendah: 10 }), ADMIN);
    if (!r.ok) throw new Error(r.reason);
    expect(r.config.history![0].text).toBe('Kritis 1 → 2, Rendah 14 → 10 hari kerja');
  });
  it('menolak nilai bukan bilangan bulat >= 1 dengan galat per kolom', () => {
    const c = seedState().config;
    for (const bad of [0, -3, 1.5, '', 'abc', '2,5']) {
      const r = updateDeadlines(c, dl({ tinggi: bad }), ADMIN);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.tinggi).toBe('Isi bilangan bulat, minimal 1 hari.');
    }
  });
  it('tanpa perubahan atau bukan Admin SKK: ditolak', () => {
    const c = seedState().config;
    expect(updateDeadlines(c, dl(), ADMIN).ok).toBe(false);
    const r = updateDeadlines(c, dl({ kritis: 2 }), PELAPOR);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Admin SKK/);
  });
  it('mengubah Tinggi jadi 5 lalu approve memberi tenggat +5 hari kerja', () => {
    const s = seedState();
    const r = updateDeadlines(s.config, dl({ tinggi: 5 }), ADMIN);
    if (!r.ok) throw new Error(r.reason);
    const a = approve({ ...s, config: r.config }, 'INS-SEN-2026-0007', A);
    if (!a.ok) throw new Error(a.reason);
    expect(a.state.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!.handleDueAt).toBe('2026-11-04T07:00:00');
  });
});

describe('updateLossThresholds', () => {
  it('versi baru: nilai, nomor versi, tanggal mulai, dasar, dan riwayat', () => {
    const c = seedState().config;
    expect(matrixVersion(c)).toBe(2);
    const r = updateLossThresholds(c, loss({ rendah: 2000, sedang: '20.000' }), ADMIN);
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    expect(r.version).toBe(3);
    expect(r.config.lossThresholdsUsd).toEqual({ rendah: 2000, sedang: 20000, tinggi: 100000, kritis: 1000000 });
    expect(r.config.history![0]).toMatchObject({ key: 'matriks', version: 3, effectiveFrom: '2028-01-01', basis: 'Keputusan rapat SKK' });
    expect(matrixVersion(r.config)).toBe(3);
  });
  it('menolak ambang tidak naik monoton', () => {
    const c = seedState().config;
    const r = updateLossThresholds(c, loss({ sedang: 900 }), ADMIN);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.sedang).toBe('Harus lebih besar dari ambang Rendah.');
    const same = updateLossThresholds(c, loss({ tinggi: 10000 }), ADMIN);
    expect(same.ok).toBe(false);
    if (!same.ok) expect(same.errors.tinggi).toBeDefined();
  });
  it('menolak bukan bilangan bulat >= 1, tanggal kurang dari besok, dan dasar kosong', () => {
    const c = seedState().config;
    const r = updateLossThresholds(c, loss({ rendah: 0, effectiveFrom: '2026-11-18', basis: '  ' }), ADMIN);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.rendah).toBeDefined();
      expect(r.errors.effectiveFrom).toBe('Minimal besok.');
      expect(r.errors.basis).toBe('Dasar perubahan wajib diisi.');
    }
    const noDate = updateLossThresholds(c, loss({ effectiveFrom: '' }), ADMIN);
    if (noDate.ok) throw new Error('harus gagal');
    expect(noDate.errors.effectiveFrom).toBe('Isi tanggal mulai berlaku.');
  });
  it('tanpa perubahan atau bukan Admin SKK: ditolak', () => {
    const c = seedState().config;
    expect(updateLossThresholds(c, loss(), ADMIN).ok).toBe(false);
    expect(updateLossThresholds(c, loss({ rendah: 2000 }), PELAPOR).ok).toBe(false);
  });
  it('mengubah ambang memengaruhi saran keparahan di form lapor (suggestedSeverityOf)', () => {
    const s = seedState();
    const d = { ...emptyDraft(), axes: ['prop' as const], ops: 'tidak' as const, lossIdr: 165_000_000 };
    // 165 jt / 16.500 = USD 10.000 → Sedang dengan ambang contoh
    expect(suggestedSeverityOf(d, s.config)).toBe('sedang');
    const r = updateLossThresholds(s.config, loss({ sedang: 20000, tinggi: 200000, kritis: 2000000 }), ADMIN);
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    expect(suggestedSeverityOf(d, r.config)).toBe('rendah');
  });
});
