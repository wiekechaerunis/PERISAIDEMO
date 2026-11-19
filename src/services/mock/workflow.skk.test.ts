import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { closureDemoIncident, CLOSURE_DEMO_NO } from './seedClosure';
import { approveClosureBySkk, giveDirective, MSG_DIRECTIVE_EMPTY, MSG_DIRECTIVE_STATUS, rejectClosureBySkk } from './workflow.skk';

const NO = 'INS-SEN-2026-0005';
const ok = (r: ReturnType<typeof giveDirective>) => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('workflow SKK', () => {
  it('Beri arahan: menambah arahan dan entri timeline, status/PIC/tenggat tetap', () => {
    const s = seedState();
    const before = s.incidents.find((i) => i.no === NO)!;
    const i = ok(giveDirective(s, NO, 'Hendra Wijaya', '  Koordinasikan dengan Polres.  ')).incidents.find((x) => x.no === NO)!;
    expect(i.handling?.directives).toHaveLength(1);
    expect(i.handling?.directives[0]).toMatchObject({ by: 'Hendra Wijaya', text: 'Koordinasikan dengan Polres.' });
    expect(i.timeline?.at(-1)?.text).toBe('Arahan SKK: Koordinasikan dengan Polres.');
    expect([i.status, i.pic, i.handleDueAt]).toEqual([before.status, before.pic, before.handleDueAt]);
  });
  it('arahan kosong ditolak, insiden ditutup tidak menerima arahan', () => {
    expect(giveDirective(seedState(), NO, 'x', '   ')).toEqual({ ok: false, reason: MSG_DIRECTIVE_EMPTY });
    expect(giveDirective(seedState(), 'INS-SEN-2026-0004', 'x', 'a')).toEqual({ ok: false, reason: MSG_DIRECTIVE_STATUS });
    expect(giveDirective(seedState(), NO, 'x', 'a'.repeat(1001)).ok).toBe(false);
  });
  it('persetujuan penutupan SKK: setujui menutup, kembalikan butuh alasan', () => {
    const s = seedState();
    s.incidents = [closureDemoIncident(), ...s.incidents];
    const closed = approveClosureBySkk(s, CLOSURE_DEMO_NO, 'Hendra Wijaya');
    if (!closed.ok) throw new Error(closed.reason);
    const i = closed.state.incidents.find((x) => x.no === CLOSURE_DEMO_NO)!;
    expect(i.status).toBe('ditutup');
    expect(i.handling?.closure?.closedBy).toBe('Hendra Wijaya');
    expect(rejectClosureBySkk(s, CLOSURE_DEMO_NO, 'x', ' ').ok).toBe(false);
    const back = rejectClosureBySkk(s, CLOSURE_DEMO_NO, 'x', 'Bukti kurang');
    expect(back.ok && back.state.incidents.find((x) => x.no === CLOSURE_DEMO_NO)!.status).toBe('dalam-penanganan');
    expect(approveClosureBySkk(seedState(), NO, 'x').ok).toBe(false);
  });
});
