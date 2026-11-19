import { describe, expect, it } from 'vitest';
import type { FollowUp } from '@/services/types';
import { boardMoves } from './followups';

const fu = (p: Partial<FollowUp>): FollowUp => ({
  no: 'TL-SEN-2026-0001', incidentNo: 'INS-SEN-2026-0007', action: 'Tindakan', pic: 'Rudi Hartono', dueAt: '2026-11-09T17:00:00',
  status: 'belum-dimulai', createdBy: 'Andi Pratama', createdAt: '2026-11-01T09:00:00', source: 'manual', evidence: [], notes: [], history: [], ...p,
} as FollowUp);

describe('boardMoves (Papan, TLJ-01 P-10)', () => {
  it('PIC: Belum dimulai ke Dikerjakan; Dikerjakan ke Menunggu pemeriksaan; tarik pengajuan', () => {
    expect(boardMoves(fu({}), 'Rudi Hartono').map((m) => [m.to, m.act])).toEqual([['berjalan', 'mulai']]);
    expect(boardMoves(fu({ status: 'berjalan' }), 'Rudi Hartono').map((m) => m.act)).toEqual(['ajukan']);
    expect(boardMoves(fu({ status: 'menunggu-verifikasi' }), 'Rudi Hartono').map((m) => m.act)).toEqual(['tarik']);
  });
  it('pemeriksa: Menunggu pemeriksaan ke Selesai atau Dikerjakan', () => {
    expect(boardMoves(fu({ status: 'menunggu-verifikasi' }), 'Andi Pratama').map((m) => [m.to, m.act])).toEqual([['selesai', 'setujui'], ['berjalan', 'kembalikan']]);
  });
  it('tidak boleh: kembali ke Belum dimulai, memindah Selesai atau Dibatalkan, kartu orang lain', () => {
    expect(boardMoves(fu({ status: 'selesai' }), 'Rudi Hartono')).toEqual([]);
    expect(boardMoves(fu({ status: 'selesai' }), 'Andi Pratama')).toEqual([]);
    expect(boardMoves(fu({ status: 'dibatalkan' }), 'Andi Pratama')).toEqual([]);
    expect(boardMoves(fu({ status: 'berjalan' }), 'Andi Pratama')).toEqual([]);
    expect(boardMoves(fu({ status: 'berjalan' }), 'Rudi Hartono').some((m) => m.to === 'belum-dimulai')).toBe(false);
  });
});
