// Kemungkinan laporan ganda untuk draf WhatsApp (board I22, M5): insiden berkategori dan WK sama dalam ±6 jam dan ≤1 km (usulan AB-24).
import type { Incident, IncidentStatus, ModuleConfig } from '@/services/types';
import type { ReportDraft } from '@/features/insiden/logic/draft';
import { buildIncident } from '@/features/insiden/logic/submit';
import { duplicateCandidates, type DupCandidate } from '@/features/insiden/logic/review';
import { ORG } from '@/services/mock/seed';

export const DUP_WINDOW_HOURS = 6;
export const DUP_RADIUS_M = 1000;
/** Hanya insiden Menunggu pemeriksaan atau Dalam penanganan yang bisa ditautkan (I24). */
export const LINKABLE: IncidentStatus[] = ['review-internal', 'dalam-penanganan'];
export const isLinkable = (i: Pick<Incident, 'status'>) => LINKABLE.includes(i.status);

function meters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Kandidat ganda untuk isi draf, terdekat dulu. Kosong bila kategori atau waktu belum diisi. */
export function waDuplicates(form: ReportDraft, incidents: Incident[], config: ModuleConfig): DupCandidate[] {
  if (!form.category || !form.date || !form.time) return [];
  const probe = buildIncident(form, 'INS-SEN-2026-9999', '', ORG, config);
  const t0 = new Date(probe.occurredAt + 'Z').getTime();
  return duplicateCandidates(probe, incidents)
    .filter((c) => {
      const o = incidents.find((x) => x.no === c.no);
      if (!o) return false;
      if (Math.abs(new Date(o.occurredAt + 'Z').getTime() - t0) > DUP_WINDOW_HOURS * 3_600_000) return false;
      const d = o.detail;
      if (form.lat != null && form.lng != null && d?.lat != null && d.lng != null) {
        return meters(form.lat, form.lng, d.lat, d.lng) <= DUP_RADIUS_M;
      }
      return true;
    })
    .map((c) => ({ ...c, linkable: isLinkable(incidents.find((x) => x.no === c.no)!) }));
}
