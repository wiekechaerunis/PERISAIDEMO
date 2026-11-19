import type { ReportDraft } from './draft';
import { demoNow } from '@/services/mock/clock';
import type { Incident, Kerawanan, ModuleConfig } from '@/services/types';
import { suggestSeverity, type ImpactInput } from '@/lib/severity';


const YEAR = '2026';

/** Kabupaten dari lokasi contoh (pemilih lokasi masih daftar; board I14 menampilkan "Kab. … · WK …"). */
export const siteArea = (name: string): string =>
  ({ 'Sumur ADR-07': 'Kab. Musi Banyuasin', 'Terminal Arunika': 'Kab. Musi Banyuasin', 'Flowline ADR-03': 'Kab. Musi Banyuasin', 'Jalan akses SP Batu Ampar': 'Kab. Banyuasin' })[name] ?? '';

/** Nomor berikutnya untuk awalan (INS-SEN / KRW-SEN): maks yang ada + 1, 4 digit. */
export function nextNumber(prefix: 'INS-SEN' | 'KRW-SEN' | 'TL-SEN', existing: string[]): string {
  const max = existing
    .filter((n) => n.startsWith(`${prefix}-${YEAR}-`))
    .map((n) => parseInt(n.slice(-4), 10))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${YEAR}-${String(max + 1).padStart(4, '0')}`;
}

export function impactInputOf(d: ReportDraft, cfg: ModuleConfig): ImpactInput {
  return {
    ops: d.axes.includes('prop') ? d.ops : null,
    casualties: d.axes.includes('man') ? d.casualties : {},
    environment: d.axes.includes('ling'),
    data: d.axes.includes('data'),
    lossIdr: d.axes.includes('prop') ? (d.lossIdr ?? 0) : 0,
    kursIdrPerUsd: cfg.kursIdrPerUsd,
  };
}

/** Saran keparahan sistem dari draf (Konfigurasi › Matriks keparahan). */
export const suggestedSeverityOf = (d: ReportDraft, cfg: ModuleConfig) =>
  suggestSeverity(impactInputOf(d, cfg), cfg.lossThresholdsUsd);

export const occurredIso = (d: ReportDraft) => `${d.date || demoNow().slice(0, 10)}T${d.time || '00:00'}:00`;

/** Ajukan draf Insiden: masuk Menunggu pemeriksaan, dikirim ke Pejabat Berwenang. */
export function buildIncident(d: ReportDraft, no: string, reporter: string, org: string, cfg: ModuleConfig): Incident {
  const severity = d.severity ?? suggestedSeverityOf(d, cfg);
  const category = d.category === 'Lainnya' && d.categoryOther ? d.categoryOther : (d.category ?? 'Lainnya');
  return {
    no, title: d.title, category, location: d.patokan || d.locationName, area: `${d.locationName} · ${d.wk}`,
    wk: d.wk, org, severity, occurredAt: occurredIso(d), status: 'review-internal', pic: null, reporter,
    // ASSUMPTION: batas pemeriksaan 24 jam sejak diajukan (V11 menampilkan tenggat pemeriksaan).
    verifyDueAt: new Date(new Date(demoNow() + 'Z').getTime() + 24 * 3_600_000).toISOString().slice(0, 19),
    source: 'form',
    detail: {
      story: d.story, securityImpact: d.securityImpact, axes: d.axes, ops: d.ops, opsHours: d.opsHours, ongoing: d.ongoing,
      lossIdr: d.lossIdr, casualties: d.casualties, handledBy: d.handledBy, initialAction: d.initialAction, patokan: d.patokan, lat: d.lat, lng: d.lng,
      attachments: d.attachments.map((a) => ({ name: a.name, sizeKb: a.sizeKb, caption: a.caption })),
      reporterSeverity: severity, severityReason: d.severityReason, suggestedSeverity: suggestedSeverityOf(d, cfg), jenis: d.jenis,
    },
    timeline: [{ at: demoNow(), by: reporter, text: 'Mengajukan laporan.' }],
  };
}

/** Kerawanan langsung tercatat tanpa pemeriksaan. */
export function buildKerawanan(d: ReportDraft, no: string, reporter: string, org: string): Kerawanan {
  return {
    no, title: d.title, category: d.category ?? 'Lainnya', location: d.patokan || d.locationName, wk: d.wk, org,
    reporter, observedAt: occurredIso(d),
  };
}
