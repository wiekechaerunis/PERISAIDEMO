import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import type { Slice } from './workflow';
import type { WaDraft } from '../types';
import { emptyDraft } from '@/features/insiden/logic/draft';
import {
  activeLink, createWaDraft, deleteWaDraft, linkMessageToIncident, submitWaDraft, unlinkMessage,
} from './workflow.wa';

const slice = (): Slice => {
  const s = seedState();
  return { incidents: s.incidents, kerawanan: s.kerawanan, config: s.config, followUps: s.followUps, waMessages: s.waMessages, waDrafts: s.waDrafts };
};
const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
};
const msgOf = (s: Slice, id: string) => s.waMessages!.find((m) => m.id === id)!;

const FORM = {
  ...emptyDraft(), hasImpact: 'ya' as const, title: 'Kabel pompa ADR-07 dipotong lagi', date: '2026-10-28', time: '02:00',
  locationName: 'Sumur ADR-07', lat: -2.98512, lng: 104.04213, wk: 'WK Andalas Darat', patokan: 'Pompa sumur ADR-07',
  category: 'Pencurian/Perampokan', securityImpact: 'Kabel listrik pompa ADR-07 dipotong.', axes: ['prop' as const],
  ops: 'berhenti' as const, opsHours: 3, handledBy: ['bujp' as const],
};
const draftOf = (s: Slice, messageId = 'WAM-003') =>
  ok(createWaDraft(s, { messageId, by: 'Budi Santoso', form: FORM, ai: {}, aiState: 'ok' })).state;

describe('workflow.wa · draf', () => {
  it('createWaDraft: pesan Baru menjadi Draf dan idempoten', () => {
    const s1 = draftOf(slice());
    expect(msgOf(s1, 'WAM-003').status).toBe('draf');
    expect(s1.waDrafts).toHaveLength(1);
    const s2 = ok(createWaDraft(s1, { messageId: 'WAM-003', by: 'x', form: FORM, ai: {}, aiState: 'ok' })).state;
    expect(s2.waDrafts).toHaveLength(1);
  });

  it('createWaDraft: pesan yang sudah diproses ditolak', () => {
    const r = createWaDraft(slice(), { messageId: 'WAM-001', by: 'x', form: FORM, ai: {}, aiState: 'ok' });
    expect(r.ok).toBe(false);
  });

  it('deleteWaDraft: draf hilang, pesan kembali Baru dan tetap ada', () => {
    const s1 = draftOf(slice());
    const s2 = ok(deleteWaDraft(s1, 'WAD-003')).state;
    expect(s2.waDrafts).toHaveLength(0);
    expect(msgOf(s2, 'WAM-003')).toMatchObject({ status: 'baru', draftId: undefined });
    expect(deleteWaDraft(s2, 'WAD-003').ok).toBe(false);
  });

  it('submitWaDraft: kemungkinan ganda harus diputuskan; setelah itu jadi insiden wa Menunggu pemeriksaan', () => {
    const s1 = draftOf(slice());
    expect(submitWaDraft(s1, 'WAD-003', 'Budi Santoso')).toMatchObject({ ok: false, reason: 'Putuskan dulu kemungkinan laporan ganda.' });
    const s2: Slice = { ...s1, waDrafts: s1.waDrafts!.map((d): WaDraft => ({ ...d, dupChoice: 'tetap' })) };
    const s3 = ok(submitWaDraft(s2, 'WAD-003', 'Budi Santoso')).state;
    const inc = s3.incidents[0];
    expect(inc).toMatchObject({ source: 'wa', status: 'review-internal', possibleDuplicate: true, reporter: 'Budi Santoso' });
    expect(s3.waDrafts).toHaveLength(0);
    expect(activeLink(msgOf(s3, 'WAM-003'))).toMatchObject({ incidentNo: inc.no, kind: 'laporan' });
  });
});

describe('workflow.wa · tautan', () => {
  it('linkMessageToIncident: entri Dari WhatsApp di Riwayat, foto masuk, pesan Diproses', () => {
    const s = slice();
    const before = s.incidents.find((i) => i.no === 'INS-SEN-2026-0007')!;
    const s1 = ok(linkMessageToIncident(s, 'WAM-002', 'INS-SEN-2026-0007', 'Budi Santoso')).state;
    const i = s1.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!;
    expect(i.timeline!.at(-1)!.text.startsWith('Pesan ditautkan: Rizal (BUJP) di grup SITREP PAM ADR')).toBe(true);
    expect(i.detail!.attachments.length).toBe(before.detail!.attachments.length + 1);
    expect(msgOf(s1, 'WAM-002').status).toBe('diproses');
    expect(activeLink(msgOf(s1, 'WAM-002'))).toMatchObject({ incidentNo: 'INS-SEN-2026-0007', kind: 'tautan' });
  });

  it('linkMessageToIncident: draf pesan ikut dihapus; insiden ditutup ditolak; tidak bisa dua kali', () => {
    const s0 = draftOf(slice());
    const s1 = ok(linkMessageToIncident(s0, 'WAM-003', 'INS-SEN-2026-0007', 'Budi Santoso')).state;
    expect(s1.waDrafts).toHaveLength(0);
    expect(linkMessageToIncident(s1, 'WAM-003', 'INS-SEN-2026-0009', 'x').ok).toBe(false);
    expect(linkMessageToIncident(slice(), 'WAM-002', 'INS-SEN-2026-0004', 'x')).toMatchObject({ ok: false });
  });

  it('unlinkMessage: alasan min. 10 karakter; pesan kembali Baru; entri dan foto tidak dihapus', () => {
    const s1 = ok(linkMessageToIncident(slice(), 'WAM-002', 'INS-SEN-2026-0007', 'Budi Santoso')).state;
    expect(unlinkMessage(s1, 'WAM-002', 'INS-SEN-2026-0007', 'Sari Wulandari', 'Salah')).toMatchObject({ ok: false });
    const s2 = ok(unlinkMessage(s1, 'WAM-002', 'INS-SEN-2026-0007', 'Sari Wulandari', 'Pesan ini tentang pompa ADR-09, bukan ADR-07.')).state;
    const m = msgOf(s2, 'WAM-002');
    expect(m.status).toBe('baru');
    expect(activeLink(m)).toBeUndefined();
    expect(m.links[0]).toMatchObject({ releasedBy: 'Sari Wulandari', releaseReason: 'Pesan ini tentang pompa ADR-09, bukan ADR-07.' });
    const i = s2.incidents.find((x) => x.no === 'INS-SEN-2026-0007')!;
    expect(i.timeline!.some((t) => t.text.startsWith('Pesan ditautkan'))).toBe(true);
    expect(i.timeline!.at(-1)!.text.startsWith('Tautan pesan WhatsApp dilepas')).toBe(true);
    expect(i.detail!.attachments.some((a) => a.name === 'IMG-20261028-WA0031.jpg')).toBe(true);
  });

  it('unlinkMessage: pesan sumber laporan tidak bisa dilepas', () => {
    expect(unlinkMessage(slice(), 'WAM-001', 'INS-SEN-2026-0009', 'Sari Wulandari', 'Alasan yang cukup panjang')).toMatchObject({ ok: false });
  });
});
