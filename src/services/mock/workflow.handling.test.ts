import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { approve } from './workflow';
import { closureDone, escalate, requestClosure, respondStep, saveClosure, saveNote, takeOver } from './workflow.handling';

const NO = 'INS-SEN-2026-0007';
const A = { by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi' as const, priority: 'tinggi' as const, pic: 'Andi Pratama', picKind: 'perorangan' as const, steps: ['Ganti kabel dan pastikan pengamanan panel.'] };

function handling(kind: 'perorangan' | 'grup' = 'perorangan') {
  const r = approve(seedState(), NO, { ...A, picKind: kind, pic: kind === 'grup' ? 'Tim Pengamanan ADR Area 2' : 'Andi Pratama' });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
const get = (s: ReturnType<typeof handling>) => s.incidents.find((i) => i.no === NO)!;
const full = {
  actions: 'Kabel diganti.', partners: ['bujp' as const], partnerNames: ['PT Garda Nusantara Sejahtera · BUJP'], cause: 'Celah pengamanan fisik',
  factors: ['Celah pagar'], evidence: [{ name: 'pompa-menyala.jpg', sizeKb: 2100, caption: '' }], result: 'tidak-ada' as const,
};

describe('workflow penanganan PIC', () => {
  it('Simpan catatan menambah notes dan timeline; catatan kosong ditolak', () => {
    const s = handling();
    expect(saveNote(s, NO, 'Andi Pratama', '  ').ok).toBe(false);
    const r = saveNote(s, NO, 'Andi Pratama', 'Gembok diganti.');
    if (!r.ok) throw new Error(r.reason);
    const i = get(r.state);
    expect(i.handling?.notes).toEqual([{ at: '2026-10-28T13:00:00', by: 'Andi Pratama', text: 'Gembok diganti.' }]);
    expect(i.timeline?.at(-1)?.text).toBe('Menambah catatan penanganan.');
  });

  it('tidak bisa menangani insiden yang belum dalam penanganan', () => {
    expect(saveNote(seedState(), NO, 'Andi Pratama', 'x').ok).toBe(false);
  });

  it('Ambil alih grup: anggota pertama menang, yang kedua ditolak', () => {
    const s = handling('grup');
    const r = takeOver(s, NO, 'Dedi Kurniawan');
    if (!r.ok) throw new Error(r.reason);
    expect(get(r.state).handling?.takenBy).toBe('Dedi Kurniawan');
    expect(takeOver(r.state, NO, 'Andi Pratama')).toEqual({ ok: false, reason: 'Sudah diambil alih Dedi Kurniawan.' });
    expect(takeOver(handling(), NO, 'Andi Pratama').ok).toBe(false);
    expect(takeOver(s, NO, 'Orang Lain').ok).toBe(false);
  });

  it('Eskalasi butuh alasan; berhasil menandai escalated', () => {
    const s = handling();
    expect(escalate(s, NO, 'Andi Pratama', { to: 'pejabat', name: 'Rudi Hartono', reason: ' ' }).ok).toBe(false);
    const r = escalate(s, NO, 'Andi Pratama', { to: 'pejabat', name: 'Rudi Hartono', reason: 'Butuh keputusan pengadaan.' });
    if (!r.ok) throw new Error(r.reason);
    const i = get(r.state);
    expect(i.escalated).toBe(true);
    expect(i.handling).toMatchObject({ escalatedTo: 'pejabat', escalationReason: 'Butuh keputusan pengadaan.' });
  });

  it('draf penutupan tersimpan bertahap; Minta ditutup ditolak bila belum lengkap', () => {
    let s = handling();
    const a = saveClosure(s, NO, 'Andi Pratama', { actions: 'Kabel diganti.' });
    if (!a.ok) throw new Error(a.reason);
    s = a.state;
    expect(closureDone(get(s).handling?.closure)).toBe(1);
    const bad = requestClosure(s, NO, 'Andi Pratama');
    expect(bad.ok).toBe(false);
    expect(get(s).status).toBe('dalam-penanganan');
  });

  it('Minta ditutup lengkap: status minta-ditutup dan requestedAt terisi', () => {
    const a = saveClosure(handling(), NO, 'Andi Pratama', full);
    if (!a.ok) throw new Error(a.reason);
    const r = requestClosure(a.state, NO, 'Andi Pratama');
    if (!r.ok) throw new Error(r.reason);
    const i = get(r.state);
    expect(i.status).toBe('minta-ditutup');
    expect(i.handling?.closure?.requestedAt).toBe('2026-10-28T13:00:00');
    expect(requestClosure(r.state, NO, 'Andi Pratama').ok).toBe(false);
  });

  it('respondStep mencatat done / ignored dan bisa dibatalkan', () => {
    const step = 'Ganti kabel dan pastikan pengamanan panel.';
    const d = respondStep(handling(), NO, step, 'done');
    if (!d.ok) throw new Error();
    expect(get(d.state).handling?.stepsDone).toEqual([step]);
    const g = respondStep(d.state, NO, step, 'ignored');
    if (!g.ok) throw new Error();
    expect(get(g.state).handling).toMatchObject({ stepsDone: [], stepsIgnored: [step] });
    const u = respondStep(g.state, NO, step, null);
    if (!u.ok) throw new Error();
    expect(get(u.state).handling?.stepsIgnored).toEqual([]);
  });
});
