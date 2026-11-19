// Regresi temuan uji e2e (B1, B2, B3, B5, B7, B8): satu sumber untuk ringkasan penutupan, status TL, tenggat, sisa waktu, dan jam demo.
import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import type { DecisionResult } from './workflow';
import { closureCompleteness, closureSummary, saveClosure } from './workflow.handling';
import { addEvidence } from './workflow.followup';

const st = (r: DecisionResult) => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('B1 · ringkasan penanganan satu sumber', () => {
  it('isian PIC (actions) terbaca sebagai 6/6 dan Ringkasan oleh semua layar', () => {
    let s: ReturnType<typeof seedState> = seedState();
    const no = 'INS-SEN-2026-0007';
    s = { ...s, incidents: s.incidents.map((i) => (i.no === no ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama' } : i)) };
    const patches = [
      { actions: 'Kabel diganti dan pompa menyala.' },
      { partners: ['bujp' as const] },
      { cause: 'Pencurian kabel' },
      { factors: ['Celah pagar'] },
      { evidence: [{ name: 'a.jpg', sizeKb: 1, caption: '' }] }, { result: 'tidak-ada' as const },
    ];
    for (const p of patches) s = { ...s, ...st(saveClosure(s, no, 'Andi Pratama', p as never)) };
    const i = s.incidents.find((x) => x.no === no)!;
    expect(closureCompleteness(i)).toMatchObject({ done: 6, total: 6, complete: true, missing: [] });
    expect(closureSummary(i.handling?.closure)).toBe('Kabel diganti dan pompa menyala.');
  });
});

describe('B2 · unggah bukti tidak mengubah status TL', () => {
  it('Belum dimulai tetap Belum dimulai setelah unggah', () => {
    const s = seedState();
    const f = s.followUps.find((x) => x.status === 'belum-dimulai' && x.pic === 'Rudi Hartono')!;
    const r = st(addEvidence(s, f.no, 'Rudi Hartono', { name: 'bukti.jpg', sizeKb: 10 }));
    const after = r.followUps!.find((x) => x.no === f.no)!;
    expect(after.status).toBe('belum-dimulai');
    expect(after.evidence.length).toBe(f.evidence.length + 1);
  });
});

describe('B7 · jam demo tunggal dan B8 · waktu kejadian', () => {
  it('demoNow default 28 Okt 2026 13:00 dan Copilot membaca "jam 1 malam tadi" relatif ke jam demo', async () => {
    const { demoNow, resetDemoClock } = await import('./clock');
    const { localIso } = await import('@/features/insiden/copilot/interview');
    const { extractStory } = await import('@/services/ai/mock');
    resetDemoClock();
    expect(demoNow()).toBe('2026-10-28T13:00:00');
    expect(localIso()).toBe('2026-10-28T13:00:00');
    const r = extractStory('Jam 1 malam tadi kabel ADR-07 dipotong, pompa mati 6 jam.', localIso());
    expect(r.time?.value).toEqual({ date: '2026-10-28', time: '01:00' });
  });
  it('isFutureTime menolak waktu setelah demoNow', async () => {
    const { isFutureTime } = await import('@/features/insiden/logic/draft');
    expect(isFutureTime('2026-11-19', '01:00')).toBe(true);
    expect(isFutureTime('2026-10-28', '12:59')).toBe(false);
  });
  it('caption tenggat memakai handleDays (3, atau 10 bila diubah)', async () => {
    const { handleDaysOf } = await import('@/lib/deadline');
    expect(handleDaysOf({ handleDays: 3, handleDueAt: '2026-11-02T07:00:00' }, '2026-10-28T07:00:00')).toBe(3);
    expect(handleDaysOf({ handleDays: 10 }, '2026-10-28T07:00:00')).toBe(10);
    expect(handleDaysOf({ handleDueAt: '2026-11-02T07:00:00' }, '2026-10-28T07:00:00')).toBe(3);
  });
});

describe('B5 · sisa waktu satu fungsi', () => {
  it('0007 di jam demo: "sisa 2 hari" untuk Pejabat (dueRemaining) dan PIC (dueIndicator)', async () => {
    const { resetDemoClock } = await import('./clock');
    const { remainingLabel } = await import('@/lib/deadline');
    const { dueRemaining } = await import('@/features/insiden/logic/closure');
    const { dueIndicator } = await import('@/features/insiden/logic/list');
    resetDemoClock();
    const due = '2026-11-02T07:00:00';
    expect(remainingLabel(due).text).toBe('sisa 2 hari');
    expect(dueRemaining(due, '2026-10-28T13:00:00').text).toBe('sisa 2 hari');
    expect(dueIndicator(due).text).toBe('sisa 2 hari');
    expect(remainingLabel('2026-10-28T08:00:00').text).toBe('lewat 5 jam');
  });
});

describe('Kartu Pengerjaan · aturan status', () => {
  it('catatan progres pertama: Belum dimulai → Dikerjakan dengan entri riwayat "Mulai dikerjakan"', async () => {
    const { addFollowUpNote } = await import('./workflow.followup');
    const s = seedState();
    const f = s.followUps!.find((x) => x.status === 'belum-dimulai' && x.pic === 'Rudi Hartono')!;
    const r = st(addFollowUpNote(s, f.no, 'Rudi Hartono', 'Mulai survei lokasi.'));
    const after = r.followUps!.find((x) => x.no === f.no)!;
    expect(after.status).toBe('berjalan');
    expect(after.history.some((h) => h.text === 'Mulai dikerjakan.')).toBe(true);
  });
  it('tarik pengajuan: kembali Dikerjakan dan bukti bisa diubah lagi', async () => {
    const { submitDone, withdrawSubmission, removeEvidence } = await import('./workflow.followup');
    let s = seedState();
    const f = s.followUps!.find((x) => x.status === 'berjalan' && x.pic === 'Rudi Hartono')!;
    s = { ...s, ...st(submitDone(s, f.no, 'Rudi Hartono', 'Selesai.')) };
    expect(s.followUps!.find((x) => x.no === f.no)!.status).toBe('menunggu-verifikasi');
    expect(removeEvidence(s, f.no, 'Rudi Hartono', f.evidence[0].name).ok).toBe(false);
    s = { ...s, ...st(withdrawSubmission(s, f.no, 'Rudi Hartono')) };
    expect(s.followUps!.find((x) => x.no === f.no)!.status).toBe('berjalan');
    expect(removeEvidence(s, f.no, 'Rudi Hartono', f.evidence[0].name).ok).toBe(true);
  });
});

describe('Data penutupan 6 isian · proses hukum', () => {
  it('5/6 bila Hasil pengamanan kosong; 6/6 bila dipilih', async () => {
    const { closureCompleteness, saveClosure } = await import('./workflow.handling');
    let s: ReturnType<typeof seedState> = seedState();
    const no = 'INS-SEN-2026-0007';
    s = { ...s, incidents: s.incidents.map((i) => (i.no === no ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama' } : i)) };
    for (const p of [{ actions: 'Kabel diganti.' }, { partners: ['bujp' as const] }, { cause: 'Pencurian kabel' }, { factors: ['Celah pagar'] }, { evidence: [{ name: 'a.jpg', sizeKb: 1, caption: '' }] }]) {
      s = { ...s, ...st(saveClosure(s, no, 'Andi Pratama', p as never)) };
    }
    expect(closureCompleteness(s.incidents.find((i) => i.no === no)!)).toMatchObject({ done: 5, total: 6, complete: false, missing: ['Hasil pengamanan'] });
    s = { ...s, ...st(saveClosure(s, no, 'Andi Pratama', { result: 'tidak-ada' })) };
    expect(closureCompleteness(s.incidents.find((i) => i.no === no)!).complete).toBe(true);
  });
  it('Waktu operasi pulih ditolak sebelum kejadian atau setelah jam demo', async () => {
    const { restoredAtError } = await import('./workflow.handling');
    expect(restoredAtError('2026-10-28T00:30', '2026-10-28T01:00:00', '2026-10-28T13:00:00')).toMatch(/sebelum waktu kejadian/);
    expect(restoredAtError('2026-10-29T16:10', '2026-10-28T01:00:00', '2026-10-28T13:00:00')).toMatch(/setelah waktu sekarang/);
    expect(restoredAtError('2026-10-28T07:00', '2026-10-28T01:00:00', '2026-10-28T13:00:00')).toBeNull();
    expect(restoredAtError(undefined, '2026-10-28T01:00:00')).toBeNull();
  });
  it('Perbarui proses hukum: status insiden dan waktu penutupan tetap, Riwayat bertambah satu', async () => {
    const { updateLegalProcess } = await import('./workflow.handling');
    const { CLOSURE_DEMO_NO, closureDemoIncident } = await import('./seedClosure');
    const { closeIncident } = await import('./workflow.closure');
    let s: ReturnType<typeof seedState> = seedState();
    s = { ...s, incidents: [closureDemoIncident(), ...s.incidents] };
    s = { ...s, ...st(closeIncident(s, CLOSURE_DEMO_NO, 'Sari Wulandari', { confirmedContracts: true, followUp: 'lanjut' })) };
    const before = s.incidents.find((i) => i.no === CLOSURE_DEMO_NO)!;
    const n = before.timeline?.length ?? 0;
    s = { ...s, ...st(updateLegalProcess(s, CLOSURE_DEMO_NO, 'Sari Wulandari', { status: 'penyidikan', lpNo: 'LP/B/412/X/2026' })) };
    const after = s.incidents.find((i) => i.no === CLOSURE_DEMO_NO)!;
    expect(after.status).toBe('ditutup');
    expect(after.handling?.closure?.closedAt).toBe(before.handling?.closure?.closedAt);
    expect(after.handling?.closure?.legal).toMatchObject({ status: 'penyidikan', updatedBy: 'Sari Wulandari' });
    expect(after.timeline?.length).toBe(n + 1);
    expect(after.timeline?.at(-1)?.text).toBe('Proses hukum diperbarui: Dilaporkan ke polisi → Penyidikan');
  });
});
