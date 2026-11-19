import { describe, expect, it } from 'vitest';
import { seedWaGroups, seedWaNumbers, seedWaRules } from './seedWaMon';
import { evaluate, isFollowUp, normalizeStart, testRule } from './waRules';
import { acceptTerms, createNumber, deleteRule, ingest, markIrrelevant, markRoutine, reopen, scanLink, setGroupMonitor, type WaMon } from './workflow.wamon';
import { seedWaMessages } from './seedWa';

const rules = seedWaRules();
const groups = seedWaGroups();
const base = { groupId: 'G1', sender: 'Joko', kinds: ['teks' as const], at: '2026-10-28T13:00:00' };
const mon = (): WaMon => ({ waMessages: seedWaMessages(), waNumbers: seedWaNumbers(), waGroups: seedWaGroups(), waRules: seedWaRules(), waTerms: [] });

describe('mesin aturan WhatsApp', () => {
  it('"Abaikan bila" diperiksa lebih dulu: salam pendek tidak ditangkap, tapi hanya oleh aturan itu', () => {
    const v = evaluate({ ...base, text: 'siap ndan' }, rules, groups);
    expect(v.captured).toBe(false);
    expect(v.reason).toMatch(/Diabaikan aturan Semua pesan/);
  });
  it('satu aturan cukup untuk menangkap; kata kunci menjadikan Prioritas', () => {
    const v = evaluate({ ...base, text: 'Aki genset Pos 4 hilang, genset mati 3 jam' }, rules, groups);
    expect(v.captured).toBe(true);
    expect(v.priority).toBe(true);
    expect(v.ruleIds).toEqual(expect.arrayContaining(['R-ALL', 'R-PRIO']));
    const r = evaluate({ ...base, text: 'LAPSIT Pos 3 06.00 aman terkendali' }, rules, groups);
    expect(r.captured).toBe(true);
    expect(r.priority).toBe(false);
  });
  it('panjang teks dan diawali (mengabaikan emoji dan format)', () => {
    expect(normalizeStart('🚨 *LAPSIT* pos 3')).toBe('lapsit pos 3');
    const lapsit = { ...rules[2], capture: { startsWith: ['lapsit'] } };
    expect(testRule(lapsit, '*LAPSIT* Pos 3').match).toBe(true);
    const len = { ...rules[0], ignore: {}, capture: { minLen: 30 } };
    expect(evaluate({ ...base, text: 'pendek' }, [len], groups).captured).toBe(false);
    expect(evaluate({ ...base, text: 'x'.repeat(40) }, [len], groups).captured).toBe(true);
  });
  it('nomor sendiri dan grup tidak dipantau tidak ditangkap', () => {
    expect(evaluate({ ...base, text: 'LAPSIT pos 1 aman', fromOwnNumber: true }, rules, groups).captured).toBe(false);
    expect(evaluate({ ...base, groupId: 'G2', text: 'LAPSIT pos 1 aman' }, rules, groups).captured).toBe(false);
  });
  it('pesan lanjutan dalam N pesan dan M menit', () => {
    const prev = { groupId: 'G1', sender: 'Joko', at: '2026-10-28T13:00:00', bubbles: 1 };
    const m = { ...base, text: 'x', kinds: [], at: '2026-10-28T13:04:00' };
    expect(isFollowUp(prev, m, { count: 3, minutes: 5 })).toBe(true);
    expect(isFollowUp(prev, { ...m, at: '2026-10-28T13:07:00' }, { count: 3, minutes: 5 })).toBe(false);
    expect(isFollowUp({ ...prev, bubbles: 3 }, m, { count: 3, minutes: 5 })).toBe(false);
  });
});

describe('workflow Pemantauan WhatsApp', () => {
  it('ingest: pesan no. 2 tidak disimpan; tiga bubble Danru menjadi satu item Prioritas', () => {
    let s = mon();
    const n0 = s.waMessages.length;
    const r0 = ingest(s, { groupId: 'G1', sender: 'Danru BUJP', text: 'siap ndan', at: '2026-10-28T13:00:00' });
    expect(r0.ok && r0.verdict.captured).toBe(false);
    const send = (text: string, at: string, photos?: string[]) => {
      const r = ingest(s, { groupId: 'G1', sender: 'Danru BUJP', text, at, photos });
      if (!r.ok) throw new Error(r.reason);
      s = { ...s, ...r.state };
      return r;
    };
    send('Lapor ndan, aki genset Pos 4 ADR-07 hilang', '2026-10-28T13:01:00');
    const b = send('foto', '2026-10-28T13:02:00', ['genset.jpg']);
    const c = send('kejadian sekitar jam 02.00, genset mati ±3 jam', '2026-10-28T13:03:00');
    expect(b.ok && b.merged).toBe(true);
    expect(c.ok && c.merged).toBe(true);
    expect(s.waMessages.length).toBe(n0 + 1);
    const item = s.waMessages[0];
    expect(item.priority).toBe(true);
    expect(item.bubbles).toHaveLength(2);
  });
  it('Tandai rutin, tidak relevan (Lainnya wajib catatan), dan Buka kembali', () => {
    const s = mon();
    const id = s.waMessages.find((m) => m.status === 'baru')!.id;
    expect(markIrrelevant(s, id, 'Budi Santoso', 'Lainnya').ok).toBe(false);
    const r = markRoutine(s, id, 'Budi Santoso');
    expect(r.ok).toBe(true);
    const s2 = { ...s, ...(r.ok ? r.state : {}) };
    expect(s2.waMessages.find((m) => m.id === id)!.status).toBe('rutin');
    const o = reopen(s2, id, 'Budi Santoso');
    expect(o.ok && o.state.waMessages!.find((m) => m.id === id)!.status).toBe('baru');
  });
  it('pemrosesan ganda: "sudah diproses oleh"', () => {
    const s = mon();
    const m = { ...s.waMessages.find((x) => x.status === 'baru')!, status: 'diproses' as const, handledBy: 'Andi Pratama', handledAt: '2026-10-28T13:00:00' };
    const s2 = { ...s, waMessages: s.waMessages.map((x) => (x.id === m.id ? m : x)) };
    const r = markRoutine(s2, m.id, 'Budi Santoso');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe('Pesan ini sudah diproses oleh Andi Pratama pada 13:00.');
  });
  it('nomor: kuota 3, nomor sudah tertaut, nomor berbeda saat dipindai, lalu Terhubung', () => {
    let s = mon();
    const c = createNumber(s, 'Posko Baru', '0812 7000 3333');
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    s = { ...s, ...c.state };
    expect(createNumber(s, 'Lagi', '0812 7000 4444').ok).toBe(false);
    expect(createNumber(s, 'Dobel', '0812 7000 1111')).toMatchObject({ ok: false, reason: 'Nomor ini sudah tertaut.' });
    expect(scanLink(s, c.id, '0812 7000 9999')).toMatchObject({ ok: false, reason: 'Nomor yang memindai berbeda dengan nomor yang ditautkan.' });
    const ok = scanLink(s, c.id, '0812 7000 3333');
    expect(ok.ok && ok.state.waNumbers!.find((n) => n.id === c.id)!.status).toBe('terhubung');
  });
  it('grup: pantau wajib wilayah kerja; aturan bawaan tidak bisa dihapus; ketentuan tersimpan per pengguna', () => {
    const s = mon();
    expect(setGroupMonitor(s, 'G2', true)).toMatchObject({ ok: false, reason: 'Pilih wilayah kerja untuk grup ini.' });
    expect(setGroupMonitor(s, 'G2', true, 'WK Andalas Darat').ok).toBe(true);
    expect(deleteRule(s, 'R-ALL').ok).toBe(false);
    expect(deleteRule(s, 'R-PRIO').ok).toBe(true);
    const t = acceptTerms(s, 'Dewi Lestari');
    expect(t.ok && t.state.waTerms).toEqual(['Dewi Lestari']);
  });
});
