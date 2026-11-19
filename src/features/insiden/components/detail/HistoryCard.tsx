import { Ic } from './Ic';
import type { TlItem } from './detailLogic';

const ICON = { send: 'send', plus: 'plus', clock: 'clock', check: 'check', undo: 'undo' } as const;

/** Kartu Riwayat (I15, I23): linimasa terbaru di atas dari timeline insiden. */
export function HistoryCard({ items }: { items: TlItem[] }) {
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Riwayat</h2>
      <ol className="p-tl" aria-label="Riwayat insiden">
        {items.map((t, n) => (
          <li key={n} className={t.cls === 'next' ? 'next' : undefined}>
            <span className={t.cls ? `nd ${t.cls}` : 'nd'}><Ic d={ICON[t.icon]} size={12} /></span>
            <div>
              <div className="hd"><b>{t.bold}</b>{t.rest}</div>
              {t.dt && <div className="dt">{t.dt}</div>}
              {t.tm && <div className="tm">{t.tm}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
