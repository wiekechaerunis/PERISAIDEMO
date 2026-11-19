import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { closureDemoIncident, CLOSURE_DEMO_NO as NO, CLOSURE_NOW } from './seedClosure';
import { changeDueDate, closeIncident, dueErrors, followUpDirective, reassignPic, reopen, returnToPic } from './workflow.closure';
import type { DecisionResult } from './workflow';

const base = () => ({ ...seedState(), incidents: [closureDemoIncident(), ...seedState().incidents] });
const get = (r: DecisionResult) => {
  if (!r.ok) throw new Error(r.reason);
  return r.state.incidents.find((i) => i.no === NO)!;
};
const ok = { confirmedContracts: true, at: CLOSURE_NOW };

describe('workflow penutupan', () => {
  it('Tutup: status Ditutup, closedAt/closedBy, tindak lanjut dilanjutkan, SKK diberi tahu', () => {
    const r = closeIncident(base(), NO, 'Sari Wulandari', ok);
    const i = get(r);
    expect(i.status).toBe('ditutup');
    expect(i.handling?.closure?.closedAt).toBe(CLOSURE_NOW);
    expect(i.handling?.closure?.closedBy).toBe('Sari Wulandari');
    expect(i.handling?.followUps?.every((f) => f.status !== 'dibatalkan')).toBe(true);
    expect(r.ok && r.skkNotified).toBe(true);
  });
  it('Tutup: kontrak harus dikonfirmasi; membatalkan tindak lanjut butuh alasan', () => {
    expect(closeIncident(base(), NO, 'x', { ...ok, confirmedContracts: false }).ok).toBe(false);
    expect(closeIncident(base(), NO, 'x', { ...ok, followUp: 'batal' }).ok).toBe(false);
    const i = get(closeIncident(base(), NO, 'x', { ...ok, followUp: 'batal', cancelReason: 'Tidak relevan lagi' }));
    expect(i.handling?.followUps?.every((f) => f.status === 'dibatalkan')).toBe(true);
  });
  it('Kembalikan ke PIC: alasan wajib, status kembali Dalam penanganan', () => {
    expect(returnToPic(base(), NO, 'x', ' ').ok).toBe(false);
    const i = get(returnToPic(base(), NO, 'x', 'Lampirkan berita acara resmi'));
    expect(i.status).toBe('dalam-penanganan');
    expect(i.handling?.closure?.returnReason).toBe('Lampirkan berita acara resmi');
  });
  it('Ganti PIC: alasan wajib, tenggat tetap', () => {
    expect(reassignPic(base(), NO, 'x', { pic: 'Dedi Kurniawan', picKind: 'perorangan', reason: '' }).ok).toBe(false);
    const i = get(reassignPic(base(), NO, 'x', { pic: 'Dedi Kurniawan', picKind: 'perorangan', reason: 'Andi cuti' }));
    expect(i.pic).toBe('Dedi Kurniawan');
    expect(i.handleDueAt).toBe('2026-11-02T07:00:00');
  });
  it('Ubah tenggat: tidak boleh sebelum hari ini, alasan minimal 10 karakter', () => {
    expect(dueErrors('2026-10-27', 'Polsek', CLOSURE_NOW)).toEqual({ date: 'Pilih tenggat setelah hari ini.', reason: 'Tulis alasan minimal 10 karakter.' });
    expect(changeDueDate(base(), NO, 'x', '2026-10-27', 'Penyelidikan Polsek 2 minggu', CLOSURE_NOW).ok).toBe(false);
    const i = get(changeDueDate(base(), NO, 'x', '2026-11-14', 'Penyelidikan Polsek 2 minggu', CLOSURE_NOW));
    expect(i.handleDueAt).toBe('2026-11-14T07:00:00');
  });
  it('Buka kembali: hanya sampai 30 hari sejak ditutup', () => {
    const closed = get(closeIncident(base(), NO, 'x', ok));
    const s = { ...base(), incidents: [closed] };
    expect(reopen(s, NO, 'x', 'Kabel dicuri lagi', '2026-11-29T09:00:00').ok).toBe(true);
    expect(reopen(s, NO, 'x', 'Kabel dicuri lagi', '2026-12-01T09:00:00').ok).toBe(false);
    const r = reopen(s, NO, 'x', 'Kabel dicuri lagi', '2026-11-10T09:00:00');
    expect(get(r).status).toBe('dalam-penanganan');
    expect(get(r).handling?.reopenedAt).toBe('2026-11-10T09:00:00');
  });
  it('Jadikan arahan tindak lanjut menandai directive.followUp', () => {
    const i0 = closureDemoIncident({ status: 'dalam-penanganan' });
    i0.handling!.directives = [{ at: '2026-10-30T10:05:00', by: 'Hendra Wijaya', text: 'Koordinasikan patroli.' }];
    const r = followUpDirective({ ...seedState(), incidents: [i0] }, NO, 'x', 0);
    expect(get(r).handling?.directives[0].followUp).toBe(true);
    expect(r.ok && followUpDirective(r.state, NO, 'x', 0).ok).toBe(false);
  });
});
