// Tag status pesan (papan V2-01, V2-10): Perlu ditinjau (+ Prioritas), Draf, Diproses, Rutin, Tidak relevan.
import type { WaMessage } from '@/services/types';

export const STATUS_WA: Record<WaMessage['status'], { label: string; tag: string }> = {
  baru: { label: 'Perlu ditinjau', tag: 'pr-tag--info' },
  draf: { label: 'Draf', tag: 'pr-tag--neutral' },
  diproses: { label: 'Diproses', tag: 'pr-tag--ok' },
  rutin: { label: 'Rutin', tag: 'pr-tag--neutral' },
  'tidak-relevan': { label: 'Tidak relevan', tag: 'pr-tag--muted' },
};

/** Kelompok tag status; pesan prioritas yang belum diproses menambah tag Prioritas. */
export function StatusTags({ m }: { m: WaMessage }) {
  const st = STATUS_WA[m.status];
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className="inline-flex flex-nowrap gap-1">
        <span className={'pr-tag ' + st.tag}>{st.label}</span>
        {m.priority && m.status === 'baru' && <span className="pr-tag pr-tag--caution">Prioritas</span>}
      </span>
    </span>
  );
}
