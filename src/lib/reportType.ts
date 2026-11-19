export type HasImpactAnswer = 'ya' | 'tidak' | 'belum';
export type ReportKind = 'insiden' | 'kerawanan';

export const INCIDENT_WORDS = /hilang|dicuri|luka|tewas|meninggal|berhenti|rusak berat|kerugian/i;

export interface TypeGuard {
  kind: ReportKind;
  /** kartu Kerawanan terkunci (jawaban Ya) */
  lockKerawanan: boolean;
  /** kartu Kerawanan diberi tanda Saran (jawaban Tidak) */
  suggestKerawanan: boolean;
}

/** Ya → Insiden (Kerawanan terkunci); Tidak → Kerawanan bertanda Saran; Belum tahu → Insiden. */
export function typeGuard(answer: HasImpactAnswer | null): TypeGuard {
  if (answer === 'tidak') return { kind: 'kerawanan', lockKerawanan: false, suggestKerawanan: true };
  return { kind: 'insiden', lockKerawanan: answer === 'ya', suggestKerawanan: false };
}

/** Kata pemicu peringatan "Cerita Anda menyebut “x”. Laporkan sebagai insiden?" */
export function storyWarning(story: string): string | null {
  const m = story.match(INCIDENT_WORDS);
  return m ? m[0].toLowerCase() : null;
}
