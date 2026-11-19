import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import {
  addProgress, linkNewIncident, raiseErrors, raiseToIncident, resolveKerawanan, submitAsIncident, suggestRaiseSeverity,
  type RaiseInput, type SubmitInput,
} from './workflow.kerawanan';

const NO = 'KRW-SEN-2026-0047';
const base: SubmitInput = {
  by: 'Sari Wulandari', category: 'Pencurian/Perampokan', securityImpact: 'Pagar dijebol dan kabel panel pompa ±10 m hilang. Pompa masih menyala.',
  axes: ['prop'], ops: 'tidak', opsHours: null, ongoing: false, lossIdr: 4_500_000, casualties: {}, envNote: 'Setempat', dataNote: 'Data terbatas',
  severity: 'rendah', reason: 'Saat dicek ulang pukul 09:50, pagar ternyata dijebol dan kabel panel pompa ±10 m hilang.',
};
const raise: RaiseInput = { ...base, picKind: 'perorangan', pic: 'Andi Pratama', title: 'Pagar sisi barat sumur ADR-07 roboh, kabel panel hilang' };

describe('workflow kerawanan · setelah tercatat', () => {
  it('resolveKerawanan: KRW-0047 mengikuti board (waktu diketahui, tercatat, lokasi)', () => {
    const r = resolveKerawanan(seedState().kerawanan.find((k) => k.no === NO)!);
    expect(r.observedAt).toBe('2026-11-18T07:20:00');
    expect(r.recordedAt).toBe('2026-11-18T07:32:00');
    expect(r.location).toBe('Sumur ADR-07');
    expect(r.title).toBe('Pagar sisi barat sumur ADR-07 roboh');
    expect(r.kind).toBe('Kondisi rawan');
  });

  it('saran keparahan: properti tanpa gangguan = Rendah, operasi berhenti = Tinggi, tanpa dampak = Sangat rendah', () => {
    const cfg = seedState().config;
    expect(suggestRaiseSeverity(base, cfg)).toBe('rendah');
    expect(suggestRaiseSeverity({ ...base, ops: 'berhenti' }, cfg)).toBe('tinggi');
    expect(suggestRaiseSeverity({ ...base, axes: [] }, cfg)).toBe('sangat-rendah');
  });

  it('Naikkan: INS-SEN-2026-0011 langsung Dalam penanganan dengan PIC, tenggat dari konfigurasi, satu catatan', () => {
    const r = raiseToIncident(seedState(), NO, raise);
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents.find((x) => x.no === 'INS-SEN-2026-0011')!;
    expect(i.status).toBe('dalam-penanganan');
    expect(i.pic).toBe('Andi Pratama');
    expect(i.fromKrw).toBe(NO);
    expect(i.title).toBe('Pagar sisi barat sumur ADR-07 roboh, kabel panel hilang');
    expect(i.severity).toBe('rendah');
    expect(i.handleDueAt).toBe('2026-12-08T10:42:00'); // Rendah = 14 hari dari 18 Nov 10:42
    expect(i.verifiedBy).toBe('Sari Wulandari');
    expect(i.skkNotified).toBeFalsy();
    expect(r.state.kerawanan.find((k) => k.no === NO)!.raisedTo).toBe('INS-SEN-2026-0011');
    expect(r.state.kerawanan).toHaveLength(seedState().kerawanan.length); // tidak diduplikasi
  });

  it('Naikkan Tinggi memberi tahu SKK dan memakai tenggat Tinggi', () => {
    const r = raiseToIncident(seedState(), NO, { ...raise, severity: 'tinggi', severityReason: 'Kabel jalur utama pompa.' });
    if (!r.ok) throw new Error(r.reason);
    expect(r.skkNotified).toBe(true);
    expect(r.state.incidents[0].handleDueAt).toBe('2026-11-23T10:42:00');
    expect(r.state.incidents[0].officialSeverityReason).toBe('Kabel jalur utama pompa.');
  });

  it('validasi: keparahan beda saran wajib beralasan, alasan >= 10 karakter, PIC wajib, hanya sekali', () => {
    const s = seedState();
    expect(raiseToIncident(s, NO, { ...raise, severity: 'sedang' }).ok).toBe(false);
    expect(raiseToIncident(s, NO, { ...raise, reason: 'Pendek' }).ok).toBe(false);
    expect(raiseToIncident(s, NO, { ...raise, pic: '' }).ok).toBe(false);
    expect(raiseToIncident(s, NO, { ...raise, axes: [] }).ok).toBe(false);
    const r = raiseToIncident(s, NO, raise);
    if (!r.ok) throw new Error();
    expect(raiseToIncident(r.state, NO, raise)).toEqual({ ok: false, reason: 'Kerawanan ini sudah dinaikkan jadi INS-SEN-2026-0011.' });
    expect(raiseToIncident(s, 'KRW-SEN-2026-9999', raise).ok).toBe(false);
  });

  it('raiseErrors: operasi terganggu butuh durasi, korban butuh pilihan', () => {
    const e = raiseErrors({ ...base, ops: 'berhenti', axes: ['prop', 'man'] }, 'tinggi', false);
    expect(e.opsHours).toBeTruthy();
    expect(e.casualties).toBeTruthy();
  });

  it('Ajukan: Menunggu pemeriksaan tanpa PIC, kerawanan tertaut', () => {
    const r = submitAsIncident(seedState(), NO, { ...base, by: 'Budi Santoso' });
    if (!r.ok) throw new Error(r.reason);
    const i = r.state.incidents[0];
    expect(i.no).toBe('INS-SEN-2026-0011');
    expect(i.status).toBe('review-internal');
    expect(i.pic).toBeNull();
    expect(i.verifyDueAt).toBe('2026-11-19T10:42:00');
    expect(i.fromKrw).toBe(NO);
    expect(r.state.kerawanan.find((k) => k.no === NO)!.raisedTo).toBe(i.no);
  });

  it('Tambah perkembangan: Makin rawan menandai worsening; tanpa tanda tidak; teks wajib; tidak setelah dinaikkan', () => {
    const s = seedState();
    expect(addProgress(s, NO, { by: 'Budi Santoso', text: ' ', worsening: true }).ok).toBe(false);
    const a = addProgress(s, 'KRW-SEN-2026-0044', { by: 'Budi Santoso', text: 'Jejak motor masuk.', worsening: false });
    if (!a.ok) throw new Error();
    expect(a.state.kerawanan.find((k) => k.no === 'KRW-SEN-2026-0044')!.worsening).toBeFalsy();
    const b = addProgress(a.state, 'KRW-SEN-2026-0044', { by: 'Budi Santoso', text: 'Tiga orang terlihat.', worsening: true });
    if (!b.ok) throw new Error();
    const k = b.state.kerawanan.find((x) => x.no === 'KRW-SEN-2026-0044')!;
    expect(k.worsening).toBe(true);
    expect(k.progress).toHaveLength(2);
    expect(addProgress(s, 'KRW-SEN-2026-0045', { by: 'x', text: 'y', worsening: false }).ok).toBe(false); // 0045 sudah jadi INS-0010
  });

  it('linkNewIncident: menautkan insiden baru ke kerawanan pemicu tanpa mengubahnya jadi Dinaikkan', () => {
    const s = seedState();
    const r = linkNewIncident(s, NO, 'INS-SEN-2026-0006', 'Sari Wulandari');
    if (!r.ok) throw new Error();
    expect(r.state.incidents.find((i) => i.no === 'INS-SEN-2026-0006')!.fromKrw).toBe(NO);
    expect(r.state.kerawanan.find((k) => k.no === NO)!.raisedTo).toBeUndefined();
  });
});
