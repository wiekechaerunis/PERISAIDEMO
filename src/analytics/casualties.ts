// Aturan hitung korban (board TD0 "Aturan hitung korban") di satu tempat:
// - Meninggal dan Luka = jumlah orang, bukan jumlah insiden. Luka = P3K + dibawa ke klinik/RS + luka berat/cacat.
// - Sumber: isian pelapor. Setelah insiden Ditutup dan PIC mengisi rincian korban, rincian PIC yang dipakai.
// - Kondisi "Belum diketahui" tidak dihitung; insidennya ditandai `unknown` supaya bisa disebut di catatan kaki.
import type { CasualtyKind } from '@/lib/severity';
import type { Incident } from '@/services/types';
import { DASH_CASUALTIES, type CasualtyRecord } from '@/data/dashboardIncidentMeta';

export interface CasualtyCount {
  meninggal: number;
  luka: number;
  /** kondisi korban "Belum diketahui" (tidak dihitung) */
  unknown: boolean;
}

const LUKA: CasualtyKind[] = ['p3k', 'klinik', 'berat'];
const hasAny = (r?: CasualtyRecord) => !!r && Object.values(r).some((n) => (n ?? 0) > 0);

/** Hitung korban dari isian pelapor dan (bila Ditutup) rincian PIC. */
export function countCasualties(input: { closed: boolean; pelapor?: CasualtyRecord; pic?: CasualtyRecord }): CasualtyCount {
  const src = input.closed && hasAny(input.pic) ? input.pic! : (input.pelapor ?? {});
  const meninggal = src.meninggal ?? 0;
  const luka = LUKA.reduce((a, k) => a + (src[k] ?? 0), 0);
  return { meninggal, luka, unknown: !meninggal && !luka && (src.belum ?? 0) > 0 };
}

/** Korban insiden aplikasi (store). */
export function casualtiesOfIncident(i: Pick<Incident, 'status' | 'detail' | 'handling'>): CasualtyCount {
  return countCasualties({ closed: i.status === 'ditutup', pelapor: i.detail?.casualties, pic: i.handling?.closure?.casualtiesFinal });
}

/** Korban insiden demo Dashboard (nomor + status: 2 = Ditutup). */
export function casualtiesOfDashboard(no: string, status: number): CasualtyCount {
  const c = DASH_CASUALTIES[no];
  return countCasualties({ closed: status === 2, pelapor: c?.pelapor, pic: c?.pic });
}

/** Teks kolom Korban: "1 meninggal, 2 luka", "Belum diketahui", atau "–". */
export function casualtyText(c: CasualtyCount): string {
  const t = [c.meninggal ? `${c.meninggal} meninggal` : '', c.luka ? `${c.luka} luka` : ''].filter(Boolean).join(', ');
  return t || (c.unknown ? 'Belum diketahui' : '–');
}
