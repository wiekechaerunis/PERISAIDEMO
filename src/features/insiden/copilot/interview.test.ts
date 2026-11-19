import { describe, expect, it } from 'vitest';
import { emptyDraft, type ReportDraft } from '../logic/draft';
import { extractStory } from '@/services/ai/mock';
import { STORY_FIXTURES } from '@/services/ai/fixtures';
import {
  answerChip, answerText, isFilled, literalQuote, locationMismatch, nextQuestion, progress, slotsFor, summaryOf,
  type Ctx, type SlotKey,
} from './interview';

const d = (p: Partial<ReportDraft> = {}): ReportDraft => ({ ...emptyDraft(), ...p });
const ctx = (draft: ReportDraft, p: Partial<Ctx> = {}): Ctx => ({ draft, ex: null, skipped: [], flags: {}, story: '', ...p });
const parseTime = (t: string) => extractStory(`Kejadian terjadi ${t}`, '2026-11-18T10:00:00').time?.value ?? null;
const rokan = STORY_FIXTURES.find((f) => f.id === 'k3-wellpad-rokan')!.story;

describe('wawancara Copilot · isian wajib', () => {
  it('urutan isian insiden: jenis laporan → kategori → waktu → lokasi → terdampak → kronologi', () => {
    expect(slotsFor(d())).toEqual(['kind', 'category', 'time', 'location', 'axes', 'chronology']);
  });

  it('kerawanan tidak menanyakan yang terdampak', () => {
    expect(slotsFor(d({ kind: 'kerawanan', hasImpact: 'tidak' }))).toEqual(['kind', 'category', 'time', 'location', 'chronology']);
  });

  it('isian per sumbu mengikuti yang terdampak, kategori berjenis menambah isian jenis', () => {
    expect(slotsFor(d({ axes: ['prop', 'man', 'ling', 'data'] }))).toEqual(
      ['kind', 'category', 'time', 'location', 'axes', 'ops', 'rug', 'casualty', 'env', 'data', 'chronology'],
    );
    expect(slotsFor(d({ category: 'Pencurian minyak' }))).toContain('jenis');
  });

  it('progres menghitung isian terisi dan menyisakan yang belum terisi atau ditolak', () => {
    const draft = d({ hasImpact: 'ya', category: 'Ancaman', date: '2026-11-18', time: '09:00' });
    const p = progress(draft, ['location']);
    expect(p).toMatchObject({ filled: 3, total: 6 });
    expect(p.open).toEqual<SlotKey[]>(['axes', 'chronology']);
  });

  it('operasi non-"tidak" belum terisi sebelum jam atau "masih berlangsung" diisi', () => {
    expect(isFilled('ops', d({ ops: 'berhenti' }))).toBe(false);
    expect(isFilled('ops', d({ ops: 'berhenti', opsHours: 6 }))).toBe(true);
    expect(isFilled('ops', d({ ops: 'berhenti', ongoing: true }))).toBe(true);
    expect(isFilled('ops', d({ ops: 'tidak' }))).toBe(true);
  });
});

describe('wawancara Copilot · pertanyaan', () => {
  it('menanyakan satu isian per pesan, mulai dari jenis laporan, dengan chip jawaban cepat', () => {
    const q = nextQuestion(ctx(d()))!;
    expect(q.slot).toBe('kind');
    expect(q.chips.map((c) => c.id)).toEqual(['insiden', 'kerawanan', 'skip']);
  });

  it('pertanyaan berikutnya dihitung dari draf: isian yang diisi di form tidak ditanyakan lagi', () => {
    expect(nextQuestion(ctx(d({ hasImpact: 'ya' })))!.slot).toBe('category');
    expect(nextQuestion(ctx(d({ hasImpact: 'ya', category: 'Ancaman' })))!.slot).toBe('time');
  });

  it('kondisi korban: lima chip sesuai sumbu Manusia', () => {
    const draft = d({ hasImpact: 'ya', category: 'Ancaman', date: '2026-11-18', time: '09:00', lat: 1, lng: 1, axes: ['man'] });
    const q = nextQuestion(ctx(draft, { flags: { axesDone: true } }))!;
    expect(q.slot).toBe('casualty');
    expect(q.chips.map((c) => c.label)).toEqual(['Luka ringan, P3K', 'Dibawa ke klinik atau RS', 'Luka berat atau cacat', 'Meninggal', 'Belum diketahui']);
  });

  it('operasi: setelah memilih berhenti, ditanya berapa jam', () => {
    const draft = d({ hasImpact: 'ya', category: 'Ancaman', date: '2026-11-18', time: '09:00', lat: 1, lng: 1, axes: ['prop'], ops: 'berhenti' });
    const q = nextQuestion(ctx(draft, { flags: { axesDone: true } }))!;
    expect(q.slot).toBe('ops');
    expect(q.text).toMatch(/Berapa jam operasi berhenti/);
  });

  it('selesai (null) bila semua isian terisi atau ditolak', () => {
    const draft = d({
      hasImpact: 'tidak', kind: 'kerawanan', category: 'Ancaman', date: '2026-11-18', time: '09:00', lat: 1, lng: 1, story: 'Cerita', initialAction: 'Dijaga',
    });
    expect(nextQuestion(ctx(draft))).toBeNull();
    expect(nextQuestion(ctx(d({ hasImpact: 'tidak', kind: 'kerawanan' }), { skipped: ['category', 'time', 'location', 'chronology'] }))).toBeNull();
  });

  it('yang terdampak: pilih-banyak, ditanya terus sampai Lanjut', () => {
    const draft = d({ hasImpact: 'ya', category: 'Ancaman', date: '2026-11-18', time: '09:00', lat: 1, lng: 1, axes: ['man'] });
    const q = nextQuestion(ctx(draft))!;
    expect(q.slot).toBe('axes');
    expect(q.chips.find((c) => c.id === 'man')?.pressed).toBe(true);
    expect(q.chips.at(-1)?.id).toBe('done');
    const a = answerChip(q, 'prop', ctx(draft));
    expect(a.toggle).toBe(true);
    expect(a.patch.axes).toEqual(['man', 'prop']);
  });
});

describe('wawancara Copilot · peringatan K3 dan WK', () => {
  const ex = extractStory(rokan);
  const base = d({ hasImpact: 'ya' });

  it('cerita kecelakaan kerja tanpa unsur keamanan menanyakan K3 sebagai ganti kategori', () => {
    const q = nextQuestion(ctx(base, { ex }))!;
    expect(q.slot).toBe('k3');
    expect(q.text).toBe('Ini terdengar seperti kecelakaan kerja. Kategori K3 belum dipastikan masuk PERISAI. Tetap catat?');
    expect(q.chips.map((c) => c.label)).toEqual(['Ya', 'Ubah kategori']);
  });

  it('Ya mencatat Kecelakaan kerja; Ubah kategori menawarkan kategori lain', () => {
    const q = nextQuestion(ctx(base, { ex }))!;
    expect(answerChip(q, 'yes', ctx(base, { ex })).patch.category).toBe('Kecelakaan kerja');
    const ubah = answerChip(q, 'change', ctx(base, { ex }));
    expect(ubah.patch.category).toBeUndefined();
    const next = nextQuestion(ctx(base, { ex, flags: { k3: true } }))!;
    expect(next.slot).toBe('category');
    expect(next.chips.map((c) => c.id)).not.toContain('Kecelakaan kerja');
  });

  it('cerita keamanan (pencurian) tidak memicu peringatan K3', () => {
    const kabel = extractStory(STORY_FIXTURES[0].story);
    expect(kabel.k3).toBe(false);
    expect(nextQuestion(ctx(base, { ex: kabel }))!.slot).toBe('category');
  });

  it('blok di cerita beda dengan WK titik peta: peringatan dengan dua chip', () => {
    const draft = d({ hasImpact: 'ya', category: 'Kecelakaan kerja', date: '2026-11-18', time: '09:00', lat: -2.98512, lng: 104.04213, wk: 'WK Andalas Darat' });
    const q = nextQuestion(ctx(draft, { ex, flags: { k3: true } }))!;
    expect(q.slot).toBe('wk');
    expect(q.text).toBe('Cerita menyebut Blok Rokan, titik di peta masuk WK Andalas Darat. Mana yang benar?');
    expect(q.chips).toHaveLength(2);
    expect(nextQuestion(ctx(draft, { ex, flags: { k3: true, wk: true } }))!.slot).not.toBe('wk');
  });

  it('locationMismatch', () => {
    expect(locationMismatch('Blok Rokan', 'WK Andalas Darat')).toBe(true);
    expect(locationMismatch('WK Andalas Darat', 'WK Andalas Darat')).toBe(false);
    expect(locationMismatch('Blok Rokan', '')).toBe(false);
    expect(locationMismatch(null, 'WK Andalas Darat')).toBe(false);
  });
});

describe('wawancara Copilot · jawaban', () => {
  const q = (slot: SlotKey, draft = d()) => {
    const full = { ...d({ hasImpact: 'ya', category: 'Ancaman', date: '2026-11-18', time: '09:00', lat: 1, lng: 1, axes: ['prop', 'man'] }), ...draft };
    const c = ctx(full, { flags: { axesDone: true } });
    return { c, question: { ...nextQuestion(c)!, slot } };
  };

  it('chip korban mengisi kondisi dengan 1 orang; Belum diketahui mengisi opsi "belum"', () => {
    const { c, question } = q('casualty');
    expect(answerChip(question, 'klinik', c).patch.casualties).toEqual({ klinik: 1 });
    expect(answerChip(question, 'belum', c).patch.casualties).toEqual({ belum: 0 });
  });

  it('Lewati menolak isian tanpa mengisi apa pun', () => {
    const { c, question } = q('casualty');
    expect(answerChip(question, 'skip', c)).toEqual({ patch: {}, skip: 'casualty' });
  });

  it('jawaban ketikan: jam, durasi operasi, kerugian, kronologi, tindakan awal', () => {
    const t = (slot: SlotKey, text: string, draft?: Partial<ReportDraft>) => { const x = q(slot, d(draft)); return answerText(x.question, text, x.c, parseTime); };
    expect(t('time', 'jam 9 pagi')?.patch).toEqual({ date: '2026-11-18', time: '09:00' });
    expect(t('time', 'nanti saja')).toBeNull();
    expect(t('ops', 'sekitar 6 jam', { ops: 'berhenti' })?.patch.opsHours).toBe(6);
    expect(t('rug', 'kira-kira 18,5 juta')?.patch.lossIdr).toBe(18_500_000);
    expect(t('rug', 'Rp 1.500.000')?.patch.lossIdr).toBe(1_500_000);
    expect(t('rug', 'belum tahu')).toBeNull();
    expect(t('chronology', 'Kejadian bermula saat penggantian valve')?.patch.story).toBe('Kejadian bermula saat penggantian valve');
    expect(t('action', 'P3K lalu ke klinik')?.patch.initialAction).toBe('P3K lalu ke klinik');
  });

  it('ringkasan penutup menandai isian yang dilewati', () => {
    const rows = summaryOf(d({ hasImpact: 'tidak', kind: 'kerawanan', category: 'Ancaman' }), ['time']);
    expect(rows.find((r) => r.slot === 'category')?.value).toBe('Ancaman');
    expect(rows.find((r) => r.slot === 'time')).toMatchObject({ value: 'Dilewati', skipped: true });
  });
});

describe('kutipan "dari cerita"', () => {
  it('hanya potongan teks asli (huruf asli cerita dipertahankan)', () => {
    expect(literalQuote('sumur adr-07', 'Kabel di Sumur ADR-07 dipotong.')).toBe('Sumur ADR-07');
    expect(literalQuote('Sumur ADR-07 … Panel listrik', 'Kabel di Sumur ADR-07 dipotong.')).toBeNull();
    expect(literalQuote('', 'cerita')).toBeNull();
  });
});
