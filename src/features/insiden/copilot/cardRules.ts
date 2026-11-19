// Aturan kartu saran yang dipakai bersama Copilot desktop dan mobile.
import { extractStory } from '@/services/ai/mock';
import type { ReportDraft } from '../logic/draft';
import { localIso, type SlotKey } from './interview';
import type { SuggestionKey } from './suggestions';

/** Kartu saran yang menjawab isian wajib tertentu: selama kartunya belum diputuskan, isian itu tidak ditanyakan lagi. */
export const CARD_SLOT: Partial<Record<SuggestionKey, SlotKey>> = {
  jns: 'kind', kat: 'category', wkt: 'time', trd: 'axes', ops: 'ops', krb: 'casualty', rug: 'rug', krn: 'chronology', tdk: 'action',
};

/** Isian yang sudah terisi di form tidak diusulkan lagi. */
export const alreadyFilled = (k: SuggestionKey, d: ReportDraft): boolean => {
  switch (k) {
    case 'jns': return d.hasImpact !== null;
    case 'kat': return !!d.category;
    case 'wkt': return !!d.date && !!d.time;
    case 'jdl': return !!d.title.trim();
    case 'ptk': return !!d.patokan.trim();
    case 'trd': return d.axes.length > 0;
    case 'dmp': return !!d.securityImpact.trim();
    case 'ops': return d.ops !== null;
    case 'krb': return Object.keys(d.casualties).length > 0;
    case 'rug': return d.lossIdr !== null;
    case 'mtr': return d.handledBy.length > 0;
    case 'krn': return !!d.story.trim();
    case 'tdk': return !!d.initialAction.trim();
  }
};

/** Jam dari jawaban ketikan ("jam 9 pagi"), dihitung dari hari ini. */
export const parseTime = (t: string) => extractStory(`Kejadian terjadi ${t}`, localIso()).time?.value ?? null;
