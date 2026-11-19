import { describe, expect, it } from 'vitest';
import { extractStory, mockAi } from './mock';
import { ExtractionSchema } from './schema';
import { IN_SCOPE_MESSAGES, OUT_OF_SCOPE_MESSAGES, STORY_FIXTURES } from './fixtures';
import { literalQuote } from '@/features/insiden/copilot/interview';

describe('AI Copilot · cerita dummy (mock)', () => {
  for (const fx of STORY_FIXTURES) {
    describe(`${fx.id}: ${fx.intent}`, () => {
      const x = extractStory(fx.story);
      const e = fx.expect;

      it('hasil lolos skema Zod (sama yang divalidasi untuk adapter claude)', () => {
        expect(ExtractionSchema.safeParse(x).success).toBe(true);
      });
      if (e.kind) it('jenis laporan', () => {
        expect(x.kind?.value).toBe(e.kind);
      });
      if (e.empty) {
        it('tidak mengarang saran', () => {
          expect([x.kind, x.time, x.title, x.patokan, x.category, x.securityImpact, x.ops, x.casualty, x.lossIdr, x.handledBy, x.axes, x.chronology, x.initialAction].every((v) => v === null)).toBe(true);
        });
        return;
      }
      if (e.category) it('kategori', () => expect(x.category?.value).toBe(e.category));
      if (e.time) it('jam kejadian', () => expect(x.time?.value.time).toBe(e.time));
      if (e.date) it('tanggal kejadian', () => expect(x.time?.value.date).toBe(e.date));
      if (e.title) it('judul', () => expect(x.title?.value).toBe(e.title));
      if (e.locationName) it('nama lokasi', () => expect(x.locationName).toBe(e.locationName));
      if (e.ops) it('kondisi operasi', () => expect(x.ops?.value).toEqual(e.ops));
      if (e.casualty) it('korban', () => expect(x.casualty?.value.kind).toBe(e.casualty));
      if (e.lossIdr) it('kerugian', () => expect(x.lossIdr?.value).toBe(e.lossIdr));
      if (e.handledBy) it('sudah menangani', () => expect(x.handledBy?.value).toBe(e.handledBy));
      if (e.k3 !== undefined) it('peringatan K3', () => expect(x.k3).toBe(e.k3));
      if (e.locationMention) it('blok/WK yang disebut cerita', () => expect(x.locationMention).toBe(e.locationMention));
      if (e.axes) it('yang terdampak', () => expect(x.axes?.value).toEqual(e.axes));
      if (e.initialAction) it('tindakan awal', () => expect(x.initialAction?.value).toContain(e.initialAction));
      it('K3 hanya muncul bila tidak ada unsur keamanan', () => expect(x.k3).toBe(e.k3 ?? false));
      it('setiap saran menyertakan kutipan sumber yang merupakan potongan cerita asli', () => {
        for (const f of [x.kind, x.time, x.title, x.patokan, x.category, x.securityImpact, x.ops, x.casualty, x.lossIdr, x.handledBy, x.axes, x.chronology, x.initialAction]) {
          if (f) expect(literalQuote(f.src, fx.story), `kutipan "${f.src}"`).not.toBeNull();
        }
      });
    });
  }
});

describe('AI Copilot · pesan di luar cakupan', () => {
  it.each(OUT_OF_SCOPE_MESSAGES)('ditolak: %s', (m) => expect(mockAi.isOutOfScope(m)).toBe(true));
  it.each(IN_SCOPE_MESSAGES)('diproses sebagai tambahan cerita: %s', (m) => expect(mockAi.isOutOfScope(m)).toBe(false));
});
