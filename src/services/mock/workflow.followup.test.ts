import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import type { DecisionResult } from './workflow';
import {
  addArahanFollowUp, addFollowUp, addWorkingDays, cancelFollowUp, changeFollowUpDue, reassignFollowUp, startFollowUp, approveDone, cancelForMerge, isOnTime, returnFollowUp, submitDone, verifierOf, withdrawSubmission, workingDaysBetween,
} from './workflow.followup';
import { followUpDirective } from './workflow.closure';
import { closureDemoIncident, CLOSURE_DEMO_NO } from './seedClosure';

const base = () => {
  const s = seedState();
  return { ...s, incidents: s.incidents.map((i) => (i.no === 'INS-SEN-2026-0007' ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama' } : i)) };
};
const st = (r: DecisionResult) => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const fu = (r: DecisionResult, no: string) => st(r).followUps!.find((f) => f.no === no)!;
const NO = 'TL-SEN-2026-0041';
const add = { incidentNo: 'INS-SEN-2026-0007', action: 'Tambah CCTV', pic: 'Rudi Hartono', dueDate: '2026-11-06', by: 'Andi Pratama' };

describe('workflow tindak lanjut', () => {
  it('addFollowUp: nomor berikutnya, status Belum dimulai, riwayat insiden; validasi wajib', () => {
    const r = addFollowUp(base(), add);
    const n = fu(r, 'TL-SEN-2026-0046');
    expect(n).toMatchObject({ status: 'belum-dimulai', pic: 'Rudi Hartono', dueAt: '2026-11-06T17:00:00', source: 'manual', createdBy: 'Andi Pratama' });
    expect(st(r).incidents.find((i) => i.no === add.incidentNo)?.timeline?.at(-1)?.text).toContain('TL-SEN-2026-0046');
    expect(addFollowUp(base(), { ...add, action: '  ' }).ok).toBe(false);
    expect(addFollowUp(base(), { ...add, pic: '' }).ok).toBe(false);
    expect(addFollowUp(base(), { ...add, dueDate: '' }).ok).toBe(false);
    expect(addFollowUp(base(), { ...add, dueDate: '2026-10-01' }).ok).toBe(false);
    expect(addFollowUp(base(), { ...add, action: 'x'.repeat(301) }).ok).toBe(false);
    expect(addFollowUp(seedState(), add).ok).toBe(false); // 0007 masih Menunggu pemeriksaan
  });

  it('submitDone hanya oleh PIC TL; withdrawSubmission mengembalikan ke berjalan', () => {
    expect(submitDone(base(), NO, 'Andi Pratama').ok).toBe(false);
    const r = submitDone(base(), NO, 'Rudi Hartono', 'Selesai.');
    expect(fu(r, NO)).toMatchObject({ status: 'menunggu-verifikasi', completionNote: 'Selesai.', submittedAt: '2026-11-05T09:12:00' });
    expect(submitDone(st(r), NO, 'Rudi Hartono').ok).toBe(false);
    expect(withdrawSubmission(base(), NO, 'Rudi Hartono').ok).toBe(false);
    expect(fu(withdrawSubmission(st(r), NO, 'Rudi Hartono'), NO)).toMatchObject({ status: 'berjalan', submittedAt: undefined });
  });

  it('approveDone: hanya PIC insiden, final tanpa buka kembali, tanggal selesai = tanggal pengajuan', () => {
    const s = st(submitDone(base(), NO, 'Rudi Hartono'));
    expect(approveDone(s, NO, 'Rudi Hartono').ok).toBe(false);
    const r = approveDone(s, NO, 'Andi Pratama');
    expect(fu(r, NO)).toMatchObject({ status: 'selesai', verifiedBy: 'Andi Pratama', finishedAt: '2026-11-05T09:12:00' });
    expect(submitDone(st(r), NO, 'Rudi Hartono').ok).toBe(false);
    expect(returnFollowUp(st(r), NO, 'Andi Pratama', 'Alasan yang cukup panjang').ok).toBe(false);
  });

  it('returnFollowUp: alasan minimal 10 karakter; PIC bisa mengajukan lagi', () => {
    const s = st(submitDone(base(), NO, 'Rudi Hartono'));
    expect(returnFollowUp(s, NO, 'Andi Pratama', 'pendek').ok).toBe(false);
    const r = returnFollowUp(s, NO, 'Andi Pratama', 'Foto belum jelas dari jalan akses');
    expect(fu(r, NO)).toMatchObject({ status: 'dikembalikan', returnReason: 'Foto belum jelas dari jalan akses', returnedBy: 'Andi Pratama' });
    expect(fu(submitDone(st(r), NO, 'Rudi Hartono'), NO).status).toBe('menunggu-verifikasi');
  });

  it('cancelForMerge membatalkan hanya tindak lanjut berjalan milik insiden anak', () => {
    const s = base();
    const r = cancelForMerge(s, 'INS-SEN-2026-0007', 'INS-SEN-2026-0003');
    const all = st(r).followUps!;
    expect(all.filter((f) => f.incidentNo === 'INS-SEN-2026-0007' && f.status === 'dibatalkan').map((f) => f.no).sort()).toEqual(['TL-SEN-2026-0034', 'TL-SEN-2026-0039', 'TL-SEN-2026-0041']);
    expect(all.find((f) => f.no === NO)?.cancelledBy).toBe('Sistem');
    const done = st(approveDone(st(submitDone(s, NO, 'Rudi Hartono')), NO, 'Andi Pratama'));
    expect(st(cancelForMerge(done, 'INS-SEN-2026-0007', 'X')).followUps!.find((f) => f.no === NO)?.status).toBe('selesai');
  });

  it('verifier = pemberi tugas; hari kerja dan tepat waktu', () => {
    const s = base();
    expect(verifierOf(s.followUps![2], { ...s.incidents[0], pic: 'Sari Wulandari' })).toBe('Andi Pratama');
    expect(verifierOf(s.followUps![2], undefined)).toBe('Andi Pratama');
    expect(addWorkingDays('2026-10-30T16:05:00', 5)).toBe('2026-11-06');
    expect(workingDaysBetween('2026-11-05T09:12:00', '2026-11-06T17:00:00')).toBe(1);
    expect(workingDaysBetween('2026-11-05', '2026-11-04')).toBe(-1);
    expect(isOnTime({ ...s.followUps![2], submittedAt: '2026-11-05T09:12:00' })).toBe(true);
    expect(isOnTime({ ...s.followUps![2], submittedAt: '2026-11-07T09:12:00' })).toBe(false);
  });

  it('followUpDirective membuat TL nyata bersumber arahan SKK', () => {
    const i0 = closureDemoIncident({ status: 'dalam-penanganan' });
    i0.handling!.directives = [{ at: '2026-10-30T10:05:00', by: 'Hendra Wijaya', text: 'Koordinasikan patroli.' }];
    const r = followUpDirective({ ...seedState(), incidents: [i0] }, CLOSURE_DEMO_NO, 'Sari Wulandari', 0);
    const n = st(r).followUps![0];
    expect(n).toMatchObject({ incidentNo: CLOSURE_DEMO_NO, action: 'Koordinasikan patroli.', source: 'arahan-skk', sourceLabel: 'Hendra Wijaya', status: 'belum-dimulai' });
    expect(n.no).toBe('TL-SEN-2026-0046');
  });

  it('Arahan SKK: sumber, pemberi tugas = pembuat, validasi tanggal dan wajib isi', () => {
    const a = { date: '2026-10-27', channel: 'Rapat', giver: 'Bambang Sutrisno · Kepala Divisi Pengamanan, SKK Migas', action: 'Perketat patroli', pic: 'Joko Susilo', dueDate: '2026-11-07', by: 'Sari Wulandari' };
    const r = addArahanFollowUp(base(), a);
    expect(st(r).followUps![0]).toMatchObject({ no: 'TL-SEN-2026-0046', sourceKind: 'arahan', source: 'arahan-skk', status: 'belum-dimulai', createdBy: 'Sari Wulandari', incidentNo: '' });
    expect(addArahanFollowUp(base(), { ...a, date: '2026-12-01' }).ok).toBe(false);
    expect(addArahanFollowUp(base(), { ...a, channel: 'Telepon' }).ok).toBe(false);
    expect(addArahanFollowUp(base(), { ...a, giver: 'x'.repeat(121) }).ok).toBe(false);
    expect(addArahanFollowUp(base(), { ...a, dueDate: '2026-11-01' }).ok).toBe(false);
  });

  it('Mulai kerjakan, catatan pertama memulai otomatis, ubah tenggat, ganti PIC, batalkan', () => {
    const s0 = base();
    expect(fu(startFollowUp(s0, NO, 'Rudi Hartono'), NO).status).toBe('berjalan');
    expect(startFollowUp(s0, NO, 'Orang Lain').ok).toBe(false);
    const d = changeFollowUpDue(s0, NO, 'Andi Pratama', '2026-11-12', 'Vendor mundur jadwal.');
    expect(fu(d, NO)).toMatchObject({ dueAt: '2026-11-12T17:00:00', dueAtOriginal: '2026-11-06T17:00:00' });
    expect(changeFollowUpDue(s0, NO, 'Andi Pratama', '2026-11-12', 'pendek').ok).toBe(false);
    expect(changeFollowUpDue(s0, NO, 'Rudi Hartono', '2026-11-12', 'Alasan cukup panjang').ok).toBe(false);
    expect(fu(reassignFollowUp(s0, NO, 'Andi Pratama', 'Joko Susilo', 'Rudi sedang cuti.'), NO).pic).toBe('Joko Susilo');
    const c = cancelFollowUp(s0, NO, 'Andi Pratama', 'Sudah dikerjakan pihak lain.');
    expect(fu(c, NO)).toMatchObject({ status: 'dibatalkan', cancelledBy: 'Andi Pratama' });
    expect(cancelFollowUp(st(c), NO, 'Andi Pratama', 'Sudah dikerjakan pihak lain.').ok).toBe(false);
  });
});

describe('Diperiksa sendiri (TLJ-01)', () => {
  it('pembuat sekaligus PIC: ajukan selesai langsung Selesai tanpa pemeriksaan kedua', () => {
    const r1 = addFollowUp(base(), { ...add, pic: 'Andi Pratama' });
    const no = 'TL-SEN-2026-0046';
    const r = submitDone(st(r1), no, 'Andi Pratama');
    expect(fu(r, no)).toMatchObject({ status: 'selesai', verifiedBy: 'Andi Pratama' });
  });
});
