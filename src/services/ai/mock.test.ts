import { describe, expect, it } from 'vitest';
import { extractStory, mockAi } from './mock';

const STORY =
  'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Panel listrik terbuka, pompa mati kira-kira 6 jam. Tidak ada korban. Kerugian kira-kira 18,5 juta. Yang jaga malam itu dari Garda Nusantara.';

describe('extractStory (cerita demo I12/I13)', () => {
  const x = extractStory(STORY);
  it('mengenali insiden, waktu, judul, patokan', () => {
    expect(x.kind?.value).toBe('insiden');
    expect(x.time?.value).toEqual({ date: '2026-10-28', time: '01:00' });
    expect(x.title?.value).toBe('Pencurian kabel listrik sumur ADR-07');
    expect(x.patokan?.value).toBe('Sumur ADR-07, sisi panel listrik');
  });
  it('mengisi kategori, dampak, operasi, korban, kerugian, penanganan', () => {
    expect(x.category?.value).toBe('Pencurian/Perampokan');
    expect(x.securityImpact?.value).toBe('Sekitar 40 m kabel hilang. Panel listrik pompa terbuka.');
    expect(x.ops?.value).toEqual({ state: 'berhenti', hours: 6 });
    expect(x.casualty?.value.kind).toBe('none');
    expect(x.lossIdr?.value).toBe(18_500_000);
    expect(x.handledBy?.value).toBe('bujp');
  });
  it('cerita terlalu pendek tidak menghasilkan saran', () => {
    expect(extractStory('Ada yang aneh.').title).toBeNull();
  });
  it('pertanyaan di luar cakupan dikenali', () => {
    expect(mockAi.isOutOfScope('Eh, minggu lalu di ADR-05 ada kejadian kayak gini juga nggak? Pelakunya siapa ya?')).toBe(true);
    expect(mockAi.isOutOfScope('pompanya mati 6 jam')).toBe(false);
  });
});
