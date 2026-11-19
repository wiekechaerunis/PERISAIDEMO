// Aturan murni layar Review/pemeriksaan Pejabat Berwenang (board V12, V13, V21, VS1, VS5).
import { demoNow } from '@/services/mock/clock';
import type { Incident, Priority } from '@/services/types';
import { STATUS_LABEL } from '@/services/types';

import { PIC_GROUPS, PIC_PEOPLE } from '@/services/mock/workflow';
import { SEV_LABEL, SEV_TAG_CLS, type Severity } from '@/lib/severity';
import { formatRupiah } from '@/lib/format';
import { KAT, KAT_LAIN, KB } from '../components/step2Data';

export const MIN_REASON = 10;
export const MAX_REASON = 500;

export interface ReviewForm {
  category: string;
  /** isian "Sebutkan kategori" bila kategori = Lainnya */
  categoryOther: string;
  jenis: string | null;
  severity: Severity;
  reason: string;
  priority: Priority;
  picKind: 'perorangan' | 'grup';
  person: string;
  group: string;
  /** teks saran langkah yang dipilih dari panel bahan pertimbangan */
  steps: string[];
}

const KAT_LABELS = KAT.map((k) => k[1]);

export function initialForm(i: Incident, picKind: 'perorangan' | 'grup' = 'perorangan'): ReviewForm {
  const known = KAT_LABELS.includes(i.category);
  const severity = i.severity ?? i.detail?.suggestedSeverity ?? 'sedang';
  return {
    category: known ? i.category : KAT_LAIN,
    categoryOther: known ? '' : i.category,
    jenis: i.detail?.jenis ?? null,
    severity,
    reason: '',
    priority: severity === 'tinggi' || severity === 'kritis' ? 'tinggi' : 'normal',
    picKind,
    person: PIC_PEOPLE[0].name,
    group: PIC_GROUPS[0].name,
    steps: [],
  };
}

export const officialCategory = (f: ReviewForm) => (f.category === KAT_LAIN && f.categoryOther.trim() ? f.categoryOther.trim() : f.category);
export const picName = (f: ReviewForm) => (f.picKind === 'grup' ? f.group : f.person);
export const severityChanged = (f: ReviewForm, i: Incident) => f.severity !== i.severity;

export interface ReviewErrors {
  reason?: string;
  categoryOther?: string;
}
export function reviewErrors(f: ReviewForm, i: Incident): ReviewErrors {
  const e: ReviewErrors = {};
  if (severityChanged(f, i) && f.reason.trim().length < MIN_REASON) e.reason = `Tulis alasan perubahan keparahan, minimal ${MIN_REASON} karakter.`;
  if (f.category === KAT_LAIN && !f.categoryOther.trim()) e.categoryOther = 'Sebutkan kategori kejadian.';
  return e;
}

/** Penjelasan di bawah "Keparahan resmi": "Menurut pelapor: Tinggi · saran sistem: Tinggi (setara Significant), karena …". */
export function severityHelp(i: Incident, equiv: (s: Severity) => string): string {
  const d = i.detail;
  const rep = d?.reporterSeverity ?? i.severity;
  let t = `Menurut pelapor: ${rep ? SEV_LABEL[rep] : 'belum ada'}`;
  if (d?.suggestedSeverity) {
    const why: string[] = [];
    if (d.ops === 'berhenti') why.push(d.opsHours ? `operasi berhenti ${d.opsHours} jam` : 'operasi berhenti');
    else if (d.ops === 'sebagian') why.push('operasi terganggu sebagian');
    for (const [k, n] of Object.entries(d.casualties) as [string, number][]) {
      const kb = KB.find((x) => x[0] === k);
      if (kb && n > 0) why.push(kb[3]);
    }
    if (d.lossIdr) why.push(`kerugian ${formatRupiah(d.lossIdr)}`);
    t += ` · saran sistem: ${SEV_LABEL[d.suggestedSeverity]} (setara ${equiv(d.suggestedSeverity)})${why.length ? `, karena ${why.join(', ')}` : ''}`;
  }
  return t;
}

const MS = { min: 60_000, h: 3_600_000 };
const at = (iso: string) => new Date(iso + 'Z').getTime();

export interface DeadlineInfo {
  late: boolean;
  /** "sisa 18 jam" atau "Lewat 5 jam" */
  text: string;
}
/** Hitung batas pemeriksaan terhadap demoNow() (waktu demo tetap). */
export function deadlineInfo(due: string, now = demoNow()): DeadlineInfo {
  const diff = at(due) - at(now);
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / MS.h);
  const unit = hours >= 1 ? `${hours} jam` : `${Math.max(1, Math.floor(abs / MS.min))} menit`;
  return diff < 0 ? { late: true, text: `Lewat ${unit}` } : { late: false, text: `sisa ${unit}` };
}
/** Waktu "lewat 5 jam" untuk state demo ?state=lewat-batas. */
export const lateDemoDue = (now = demoNow()) => new Date(at(now) - 5 * MS.h).toISOString().slice(0, 19);

// ---- kemungkinan ganda ----

export interface DupCandidate {
  no: string;
  title: string;
  who: string;
  status: string;
  dist: string;
  dt: string;
  sevCls: string;
  sevLabel: string;
  /** false bila Ditutup: tidak bisa digabung/ditautkan */
  linkable: boolean;
}

function meters(a: Incident, b: Incident): number | null {
  const p = a.detail, q = b.detail;
  if (p?.lat == null || p.lng == null || q?.lat == null || q.lng == null) return null;
  const R = 6_371_000, r = Math.PI / 180;
  const dLat = (q.lat - p.lat) * r, dLng = (q.lng - p.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * r) * Math.cos(q.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const distText = (a: Incident, b: Incident): string => {
  const m = meters(a, b);
  if (m == null) return a.location === b.location ? 'Lokasi sama' : 'Lokasi berbeda';
  if (m < 10) return 'Lokasi sama';
  return m >= 1000 ? `${(m / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km` : `${Math.round(m)} m`;
};
export function gapText(a: Incident, b: Incident): string {
  const mins = Math.round(Math.abs(at(a.occurredAt) - at(b.occurredAt)) / MS.min);
  if (mins < 1) return '0 menit';
  if (mins < 60) return `${mins} menit`;
  if (mins >= 48 * 60) return `${Math.round(mins / 1440)} hari`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
}

/** Insiden lain berkategori sama di WK yang sama, kejadian ≤3 hari berdekatan; yang paling dekat dulu. */
export function duplicateCandidates(target: Incident, all: Incident[]): DupCandidate[] {
  const near = (c: Incident) => Math.abs(at(c.occurredAt) - at(target.occurredAt)) <= 72 * MS.h;
  return all
    .filter((c) => c.no !== target.no && c.category === target.category && c.wk === target.wk && near(c) && !['draf', 'digabung', 'dibatalkan'].includes(c.status))
    .sort((a, b) => (meters(target, a) ?? 1e9) - (meters(target, b) ?? 1e9) || Math.abs(at(a.occurredAt) - at(target.occurredAt)) - Math.abs(at(b.occurredAt) - at(target.occurredAt)))
    .map((c) => ({
      no: c.no, title: c.title, who: c.reporter, status: STATUS_LABEL[c.status], dist: distText(target, c), dt: gapText(target, c),
      sevCls: c.severity ? SEV_TAG_CLS[c.severity] : 't-draft', sevLabel: c.severity ? SEV_LABEL[c.severity] : '—', linkable: c.status !== 'ditutup',
    }));
}

export const approveToast = (no: string, steps: number, pic: string) =>
  `Insiden ${no} disetujui.${steps > 0 ? ` ${steps} saran langkah dikirim ke ${pic}.` : ''}`;
