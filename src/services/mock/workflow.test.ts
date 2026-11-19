import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { approve, cancelIncident, makeKerawanan, mergeInto, requestRevision, withdraw } from './workflow';

const A = { by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi' as const, priority: 'tinggi' as const, pic: 'Andi Pratama', picKind: 'perorangan' as const, steps: [] };

describe('workflow insiden', () => {
  it('Setujui: status, PIC, dan tenggat dari konfigurasi', () => {
    const s = seedState();
    const r = approve(s, 'INS-SEN-2026-0007', A);
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!;
    expect(i.status).toBe('dalam-penanganan');
    expect(i.pic).toBe('Andi Pratama');
    expect(i.handleDueAt).toBe('2026-11-02T07:00:00'); // Tinggi = 3 hari dari DEMO_NOW
  });
  it('mengubah tenggat di konfigurasi memengaruhi tenggat insiden baru', () => {
    const s = seedState();
    s.config.deadlines.tinggi = 5;
    const r = approve(s, 'INS-SEN-2026-0007', A);
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!.handleDueAt).toBe('2026-11-04T07:00:00');
  });
  it('keparahan beda dari pelapor wajib beralasan', () => {
    const r = approve(seedState(), 'INS-SEN-2026-0007', { ...A, severity: 'sedang' });
    expect(r.ok).toBe(false);
  });
  it('sudah diputus penyetuju lain', () => {
    const s = seedState();
    const r = approve(s, 'INS-SEN-2026-0007', A);
    if (!r.ok) throw new Error();
    expect(approve(r.state, 'INS-SEN-2026-0007', A)).toEqual({ ok: false, reason: 'Sudah diputus penyetuju lain.' });
  });
  it('minta revisi dan batalkan butuh alasan', () => {
    expect(requestRevision(seedState(), 'INS-SEN-2026-0007', 'x', ' ').ok).toBe(false);
    const r = cancelIncident(seedState(), 'INS-SEN-2026-0007', 'x', 'Salah kirim');
    expect(r.ok && r.state.incidents.find((i) => i.no === 'INS-SEN-2026-0007')!.status).toBe('dibatalkan');
  });
  it('gabung memindahkan 0009 ke 0007', () => {
    const r = mergeInto(seedState(), 'INS-SEN-2026-0009', 'INS-SEN-2026-0007', 'x', 'Kejadian sama');
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0009')!;
    expect(i.status).toBe('digabung');
    expect(i.mergedInto).toBe('INS-SEN-2026-0007');
  });
  it('Jadikan kerawanan: alasan wajib, SKK diberi tahu bila Tinggi', () => {
    expect(makeKerawanan(seedState(), 'INS-SEN-2026-0007', 'x', '').ok).toBe(false);
    const r = makeKerawanan(seedState(), 'INS-SEN-2026-0007', 'x', 'Tidak ada kerugian');
    if (!r.ok) throw new Error();
    expect(r.skkNotified).toBe(true);
    expect(r.state.incidents.some((i) => i.no === 'INS-SEN-2026-0007')).toBe(false);
    expect(r.state.kerawanan[0].no).toBe('KRW-SEN-2026-0048');
  });
  it('Tarik kembali: Menunggu pemeriksaan jadi Draf dan tercatat; tidak bisa bila sudah diproses', () => {
    const r = withdraw(seedState(), 'INS-SEN-2026-0007', 'Budi Santoso');
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!;
    expect(i.status).toBe('draf');
    expect(i.verifyDueAt).toBeUndefined();
    expect(i.timeline?.at(-1)?.text).toBe('Menarik kembali laporan');
    expect(withdraw(r.state, 'INS-SEN-2026-0007', 'Budi Santoso').ok).toBe(false);
  });
});
