import type { Incident, IncidentStatus } from '@/services/types';
import type { Severity } from '@/lib/severity';
import { DASH_CASUALTIES, jamKejadian } from '@/data/dashboardIncidentMeta';

// Klik titik insiden / baris insiden di peta membuka halaman Detail insiden aplikasi (masukan PM 25 Nov).
// Data dashboard (106 insiden demo) belum semuanya ada di data aplikasi. Insiden yang belum ada dibuat sekali
// dari data dashboard (ID, judul, kategori, level, status, tanggal, lokasi, WK, KKKS) dengan meminjam isi detail
// insiden contoh yang statusnya sama, lalu dibuka di /insiden/<ID>. PRODUKSI: dashboard dan detail membaca sumber yang sama.

export type IncInfo = {
  id?: string;
  t: string;
  lv: string;
  st?: string;
  cat?: string;
  tgl?: string;
  late?: boolean;
  site?: string;
  area?: string;
  wk?: string;
  kk?: string;
};

const SEV: Record<string, Severity> = { 'Sangat rendah': 'sangat-rendah', Rendah: 'rendah', Sedang: 'sedang', Tinggi: 'tinggi', Kritis: 'kritis' };
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const statusOf = (st?: string): IncidentStatus =>
  st?.startsWith('Ditutup') ? 'ditutup' : st?.startsWith('Menunggu penutupan') ? 'minta-ditutup' : 'dalam-penanganan';

const dateOf = (tgl?: string, jam = '09:00'): string | null => {
  const m = tgl?.match(/^(\d{1,2}) (\w+)/);
  const mi = m ? MO.indexOf(m[2]) : -1;
  if (!m || mi < 0) return null;
  return `2026-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}T${jam}:00`;
};

const addDays = (iso: string, d: number) => {
  const t = new Date(iso);
  t.setDate(t.getDate() + d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}T09:00:00`;
};

const addMinutes = (iso: string, m: number) => {
  const t = new Date(iso);
  t.setMinutes(t.getMinutes() + m);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}:00`;
};

/** Insiden aplikasi untuk ID dashboard: yang sudah ada dipakai apa adanya, selain itu dibuat dari data dashboard. */
export function incidentFromDashboard(info: IncInfo & { id: string }, all: Incident[]): Incident | null {
  const status = statusOf(info.st);
  const tpl = all.find((i) => i.status === status && i.detail) ?? all.find((i) => i.status === 'dalam-penanganan' && i.detail);
  if (!tpl) return null;
  // jam kejadian dan korban sama dengan kartu Tabel insiden (src/data/dashboardIncidentMeta.ts)
  const at = dateOf(info.tgl, jamKejadian(info.id)) ?? tpl.occurredAt;
  const kb = DASH_CASUALTIES[info.id];
  const place = info.site ?? info.area ?? tpl.location;
  return {
    ...tpl,
    no: info.id,
    title: info.t,
    category: info.cat || tpl.category,
    location: place,
    area: [info.area, place].filter(Boolean).join(' · ') || tpl.area,
    wk: info.wk ?? tpl.wk,
    org: info.kk ?? tpl.org,
    severity: SEV[info.lv] ?? tpl.severity,
    occurredAt: at,
    status,
    handleDueAt: addDays(at, 7),
    late: !!info.late,
    restricted: false,
    hiddenFor: undefined,
    mergedInto: undefined,
    possibleDuplicate: false,
    source: 'form',
    detail: tpl.detail
      ? {
          ...tpl.detail,
          securityImpact: info.t,
          story: info.t,
          patokan: place,
          reporterSeverity: SEV[info.lv] ?? tpl.detail.reporterSeverity,
          suggestedSeverity: SEV[info.lv] ?? tpl.detail.suggestedSeverity,
          casualties: kb ? { ...kb.pelapor } : {},
          axes: kb ? [...new Set([...tpl.detail.axes, 'man' as const])] : tpl.detail.axes.filter((a) => a !== 'man'),
        }
      : tpl.detail,
    handling: tpl.handling?.closure
      ? { ...tpl.handling, closure: { ...tpl.handling.closure, casualtiesFinal: kb ? { ...(kb.pic ?? kb.pelapor) } : {} } }
      : tpl.handling,
    timeline: [
      { at: addMinutes(at, 40), by: tpl.reporter, text: 'Draf dibuat' },
      { at: addMinutes(at, 60), by: tpl.reporter, text: 'Mengajukan laporan.' },
    ],
  };
}
