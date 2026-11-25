// Menu ⋯ per baris (B-15) dan aturan draf (ADJ-18).
import { describe, expect, it } from 'vitest';
import { seedState } from '@/services/mock/seed';
import { deleteDraft } from '@/services/mock/workflow';
import { canCreateReport } from '@/lib/rbac';
import { rowHref, rowMenu } from './list';

const S = seedState();
const inc = (no: string) => S.incidents.find((i) => i.no === no)!;
const labels = (no: string, role: Parameters<typeof rowMenu>[1]) => rowMenu(inc(no), role).map((m) => m.label);

describe('menu ⋯ per baris (B-15)', () => {
  it('Pelapor: draf sendiri → Lanjutkan draf + Hapus draf (merah)', () => {
    expect(labels('INS-SEN-2026-0008', 'pelapor')).toEqual(['Lanjutkan draf', 'Hapus draf']);
    expect(rowMenu(inc('INS-SEN-2026-0008'), 'pelapor')[1].danger).toBe(true);
  });
  it('Pelapor: Menunggu pemeriksaan → Batalkan pengajuan; Perlu perbaikan → Lihat catatan + Perbaiki', () => {
    expect(labels('INS-SEN-2026-0007', 'pelapor')).toEqual(['Batalkan pengajuan']);
    expect(labels('INS-SEN-2026-0006', 'pelapor')).toEqual(['Lihat catatan pemeriksa', 'Perbaiki laporan']);
    expect(labels('INS-SEN-2026-0002', 'pelapor')).toEqual(['Tangani insiden']);
  });
  it('Pejabat: aksi per status; draf hanya Lihat (ADJ-18)', () => {
    expect(labels('INS-SEN-2026-0007', 'pejabat')).toEqual(['Periksa laporan']);
    expect(labels('INS-SEN-2026-0005', 'pejabat')).toEqual(['Ganti PIC', 'Ubah tenggat']);
    expect(labels('INS-SEN-2026-0004', 'pejabat')).toEqual(['Buka kembali']);
    expect(labels('INS-SEN-2026-0008', 'pejabat')).toEqual(['Lihat draf']);
  });
  it('SKK tanpa ⋯; baris tanpa aksi tanpa ⋯', () => {
    expect(labels('INS-SEN-2026-0007', 'pengawas')).toEqual([]);
    expect(labels('INS-SEN-2026-0004', 'pelapor')).toEqual([]);
  });
});

describe('draf (ADJ-18)', () => {
  it('maker membuka draf di form mode Ubah; non-maker ke detail', () => {
    expect(rowHref(inc('INS-SEN-2026-0008'), 'pelapor')).toBe('/insiden/INS-SEN-2026-0008/ubah');
    expect(rowHref(inc('INS-SEN-2026-0008'), 'pejabat')).toBe('/insiden/INS-SEN-2026-0008');
  });
  it('Buat laporan hanya untuk role aktif maker', () => {
    expect(canCreateReport('pelapor')).toBe(true);
    expect(canCreateReport('pejabat')).toBe(false);
    expect(canCreateReport('admin-kkks')).toBe(false);
  });
  it('Hapus draf hanya pembuat', () => {
    expect(deleteDraft(S, 'INS-SEN-2026-0008', 'Rina Lestari').ok).toBe(false);
    const r = deleteDraft(S, 'INS-SEN-2026-0008', 'Budi Santoso');
    expect(r.ok && r.state.incidents.some((i) => i.no === 'INS-SEN-2026-0008')).toBe(false);
  });
});
