import { describe, expect, it } from 'vitest';
import { suggestSeverity, lossSeverity, type LossThresholds } from './severity';
import { handlingDeadline } from './deadline';
import { typeGuard, storyWarning } from './reportType';
import { formatRupiah, formatWibFull } from './format';

const T: LossThresholds = { rendah: 1_000, sedang: 10_000, tinggi: 100_000, kritis: 1_000_000 };

describe('suggestSeverity', () => {
  it('operasi berhenti → Tinggi, sebagian → Sedang, tidak terganggu → Rendah', () => {
    expect(suggestSeverity({ ops: 'berhenti' }, T)).toBe('tinggi');
    expect(suggestSeverity({ ops: 'sebagian' }, T)).toBe('sedang');
    expect(suggestSeverity({ ops: 'tidak' }, T)).toBe('rendah');
  });
  it('korban: P3K sangat rendah, klinik rendah, luka berat tinggi, meninggal kritis', () => {
    expect(suggestSeverity({ casualties: { p3k: 1 } }, T)).toBe('sangat-rendah');
    expect(suggestSeverity({ casualties: { klinik: 2 } }, T)).toBe('rendah');
    expect(suggestSeverity({ casualties: { berat: 1 } }, T)).toBe('tinggi');
    expect(suggestSeverity({ casualties: { meninggal: 1 } }, T)).toBe('kritis');
  });
  it('belum diketahui saja → tanpa level', () => {
    expect(suggestSeverity({ casualties: { belum: 1 } }, T)).toBeNull();
  });
  it('lingkungan rendah, data sedang', () => {
    expect(suggestSeverity({ environment: true }, T)).toBe('rendah');
    expect(suggestSeverity({ data: true }, T)).toBe('sedang');
  });
  it('mengambil sumbu tertinggi', () => {
    expect(suggestSeverity({ ops: 'sebagian', casualties: { berat: 1 }, data: true }, T)).toBe('tinggi');
  });
  it('kerugian dikonversi kurs dan memakai ambang dari konfigurasi', () => {
    expect(lossSeverity(16_000_000 * 20, 16_000, T)).toBe('sedang');
    expect(lossSeverity(16_000_000 * 20, 16_000, { ...T, sedang: 50_000 })).toBe('rendah');
  });
});

describe('handlingDeadline', () => {
  const cfg = { kritis: 1, tinggi: 3, sedang: 7, rendah: 14, 'sangat-rendah': 14 };
  it('menambah hari sejak registrasi sesuai konfigurasi', () => {
    expect(handlingDeadline('2026-11-18T10:42:00', 'tinggi', cfg)).toBe('2026-11-23T10:42:00');
    expect(handlingDeadline('2026-11-18T10:42:00', 'kritis', { ...cfg, kritis: 2 })).toBe('2026-11-20T10:42:00');
  });
});

describe('pengaman jenis laporan', () => {
  it('Ya → insiden, kerawanan terkunci', () => {
    expect(typeGuard('ya')).toEqual({ kind: 'insiden', lockKerawanan: true, suggestKerawanan: false });
  });
  it('Tidak → kerawanan bertanda Saran', () => {
    expect(typeGuard('tidak').suggestKerawanan).toBe(true);
  });
  it('Belum tahu → insiden tanpa kunci', () => {
    expect(typeGuard('belum')).toEqual({ kind: 'insiden', lockKerawanan: false, suggestKerawanan: false });
  });
  it('peringatan cerita', () => {
    expect(storyWarning('Kabel panel dicuri semalam')).toBe('dicuri');
    expect(storyWarning('Pagar tampak miring')).toBeNull();
  });
});

describe('format id-ID', () => {
  it('Rupiah dan waktu WIB', () => {
    expect(formatRupiah(18_500_000)).toBe('Rp18.500.000');
    expect(formatWibFull('2026-10-28T07:00:00')).toBe('28 Okt 2026, 07:00 WIB');
  });
});
