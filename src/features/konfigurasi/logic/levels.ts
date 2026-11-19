import { SEVERITIES, SEV_EQUIV, SEV_LABEL, SEV_TAG_CLS, type Severity } from '@/lib/severity';
import { formatNumber } from '@/lib/format';
import type { ConfigChange, ModuleConfig } from '@/services/types';

/** "Rp16,5 jt", "Rp1,65 M", atau Rupiah penuh di bawah 1 juta. */
export function rupiahCompact(n: number): string {
  const t = (x: number) => String(Number(x.toFixed(2))).replace('.', ',');
  if (n >= 1e9) return `Rp${t(n / 1e9)} M`;
  if (n >= 1e6) return `Rp${t(n / 1e6)} jt`;
  return `Rp${formatNumber(Math.round(n))}`;
}

/** Definisi tetap per level (board CFG-MatriksKeparahan): jam operasi berhenti dan korban terberat tidak bisa diubah di sini. */
export const LEVEL_FIXED: Record<Severity, { n: string; op: string; opn: string; kb: string }> = {
  'sangat-rendah': { n: '1', op: 'Tidak terganggu', opn: '0', kb: 'Tidak ada / P3K' },
  rendah: { n: '2', op: '< 2 jam', opn: '0', kb: 'Perawatan medis' },
  sedang: { n: '3', op: '2 – < 6 jam', opn: '2', kb: 'Tidak bisa kerja penuh' },
  tinggi: { n: '4', op: '≥ 6 jam', opn: '6', kb: 'Tidak bisa bekerja / cacat' },
  kritis: { n: '5', op: '≥ 72 jam', opn: '72', kb: 'Meninggal' },
};

export type Bounds = Record<'rendah' | 'sedang' | 'tinggi' | 'kritis', number | null>;

export interface LevelRow {
  sev: Severity;
  n: string;
  l: string;
  alt: string;
  tag: string;
  usd: string;
  min: string;
  rp: string;
  op: string;
  opn: string;
  kb: string;
}

/** Baris tabel matriks dari ambang (USD) dan kurs. `null` pada ambang = belum valid (draf). */
export function levelRows(t: Bounds, kurs: number): LevelRow[] {
  const u = (v: number | null) => (v === null ? '—' : formatNumber(v));
  const r = (v: number | null) => (v === null ? '—' : rupiahCompact(v * kurs));
  const lo: Record<Severity, number | null> = { 'sangat-rendah': 0, rendah: t.rendah, sedang: t.sedang, tinggi: t.tinggi, kritis: t.kritis };
  return SEVERITIES.map((sev, i) => {
    const next = SEVERITIES[i + 1] as Severity | undefined;
    const hi = next ? lo[next] : null;
    let usd: string;
    let rp: string;
    if (sev === 'sangat-rendah') { usd = `< ${u(hi)}`; rp = `< ${r(hi)}`; }
    else if (next) { usd = `${u(lo[sev])} – < ${u(hi)}`; rp = `${r(lo[sev])} – < ${r(hi)}`; }
    else { usd = `≥ ${u(lo[sev])}`; rp = `≥ ${r(lo[sev])}`; }
    const f = LEVEL_FIXED[sev];
    return { sev, n: f.n, l: SEV_LABEL[sev], alt: SEV_EQUIV[sev], tag: `p-tag ${SEV_TAG_CLS[sev]}`, usd, min: u(lo[sev]), rp, op: f.op, opn: f.opn, kb: f.kb };
  });
}

const history = (c: ModuleConfig) => c.history ?? [];
const byTime = (a: ConfigChange, b: ConfigChange) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0);

/** Riwayat tenggat penanganan, terbaru di depan. */
export const tenggatHistory = (c: ModuleConfig) => history(c).filter((h) => h.key === 'tenggat').sort(byTime);
/** Versi matriks, terbaru di depan. */
export const matrixVersions = (c: ModuleConfig) =>
  history(c).filter((h) => h.key === 'matriks').sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

/** Tanggal sehari sebelum `iso` (YYYY-MM-DD), untuk akhir masa berlaku versi lama. */
export function dayBefore(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
