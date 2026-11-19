import type { ReactNode } from 'react';
import { formatWibFull } from '@/lib/format';
import type { WaMessage } from '@/services/types';
import { senderInitials, senderLabel } from '../logic/draft';

/** Status pesan di kotak masuk: Baru → Draf → Diproses (I24: tag "Baru" lalu "Diproses"). */
export const STATUS_WA: Record<WaMessage['status'], { label: string; tag: string }> = {
  baru: { label: 'Baru', tag: 't-info' },
  draf: { label: 'Draf', tag: 't-draft' },
  diproses: { label: 'Diproses', tag: 't-ok' },
};

/** Satu pesan di kotak masuk: pengirim, grup, isi (gaya `in-wa`), jumlah foto, status. */
export function MessageCard({ m, children }: { m: WaMessage; children?: ReactNode }) {
  const st = STATUS_WA[m.status];
  return (
    <article className="wa-msg" aria-label={`Pesan ${m.sender}, ${m.at.slice(11, 16)}`}>
      <span className="lk-av">{senderInitials(m)}</span>
      <div className="wa-body">
        <div className="wa-hd">
          <b>{senderLabel(m)}</b>
          <span className="p-cap">{m.group}</span>
          <span className={'p-tag ' + st.tag}>{st.label}</span>
        </div>
        <div className="in-wa"><div className="bub">{m.text}</div></div>
        <span className="p-cap">{formatWibFull(m.at)} · {m.photos.length} foto</span>
        {children}
      </div>
    </article>
  );
}
