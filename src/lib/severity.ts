export type Severity = 'sangat-rendah' | 'rendah' | 'sedang' | 'tinggi' | 'kritis';
export const SEVERITIES: Severity[] = ['sangat-rendah', 'rendah', 'sedang', 'tinggi', 'kritis'];
export const SEV_LABEL: Record<Severity, string> = {
  'sangat-rendah': 'Sangat rendah',
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
};
export const SEV_EQUIV: Record<Severity, string> = {
  'sangat-rendah': 'Insignificant',
  rendah: 'Minor',
  sedang: 'Moderate',
  tinggi: 'Significant',
  kritis: 'Catastrophic',
};
/** class Tag dari bundle.css/ins.css; ASSUMPTION: s-vlow untuk Sangat rendah dicek saat paritas visual. */
export const SEV_TAG_CLS: Record<Severity, string> = {
  'sangat-rendah': 's-vlow',
  rendah: 's-low',
  sedang: 's-med',
  tinggi: 's-high',
  kritis: 's-crit',
};
export const SEV_DOT: Record<Severity, string> = {
  'sangat-rendah': 'var(--ink-subtle)',
  rendah: 'var(--sev-low-dot)',
  sedang: 'var(--sev-medium-dot)',
  tinggi: 'var(--sev-high-dot)',
  kritis: 'var(--sev-critical-dot)',
};
export const sevRank = (s: Severity) => SEVERITIES.indexOf(s);
export const isHighOrCritical = (s?: Severity | null) => s === 'tinggi' || s === 'kritis';

export type OpsImpact = 'tidak' | 'sebagian' | 'berhenti';
export type CasualtyKind = 'p3k' | 'klinik' | 'berat' | 'meninggal' | 'belum';

export interface ImpactInput {
  ops?: OpsImpact | null;
  casualties?: Partial<Record<CasualtyKind, number>>;
  environment?: boolean;
  data?: boolean;
  /** kerugian dalam Rupiah, dikonversi memakai kurs pada tanggal kejadian */
  lossIdr?: number;
  kursIdrPerUsd?: number;
}

/** Ambang kerugian (USD) dari Konfigurasi › Matriks keparahan. Nilai contoh, menunggu SKK. */
export interface LossThresholds {
  /** batas bawah USD tiap level; kerugian >= batas menghasilkan level itu */
  rendah: number;
  sedang: number;
  tinggi: number;
  kritis: number;
}

const CASUALTY_SEV: Record<Exclude<CasualtyKind, 'belum'>, Severity> = {
  p3k: 'sangat-rendah',
  klinik: 'rendah',
  berat: 'tinggi',
  meninggal: 'kritis',
};
const OPS_SEV: Record<OpsImpact, Severity> = { tidak: 'rendah', sebagian: 'sedang', berhenti: 'tinggi' };

export function lossSeverity(lossIdr: number, kurs: number, t: LossThresholds): Severity | null {
  if (!lossIdr || !kurs) return null;
  const usd = lossIdr / kurs;
  if (usd >= t.kritis) return 'kritis';
  if (usd >= t.tinggi) return 'tinggi';
  if (usd >= t.sedang) return 'sedang';
  if (usd >= t.rendah) return 'rendah';
  return 'sangat-rendah';
}

/** Saran keparahan = sumbu dampak tertinggi. null bila belum ada dasar (mis. korban "belum diketahui" saja). */
export function suggestSeverity(input: ImpactInput, t: LossThresholds): Severity | null {
  const cands: Severity[] = [];
  if (input.ops) cands.push(OPS_SEV[input.ops]);
  for (const [k, n] of Object.entries(input.casualties ?? {}) as [CasualtyKind, number][]) {
    if (k !== 'belum' && n > 0) cands.push(CASUALTY_SEV[k]);
  }
  if (input.environment) cands.push('rendah');
  if (input.data) cands.push('sedang');
  const loss = lossSeverity(input.lossIdr ?? 0, input.kursIdrPerUsd ?? 0, t);
  if (loss) cands.push(loss);
  if (cands.length === 0) return null;
  return cands.reduce((a, b) => (sevRank(b) > sevRank(a) ? b : a));
}
