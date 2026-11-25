// Kartu kanan permintaan arahan (board P31-DetailSKK, "Diminta arahan dari Anda") dan arahan masuk (board P33-ArahanMasuk,
// "Arahan baru dari SKK"). Satu bentuk: ikon, judul, kutipan, baris keterangan, tombol utama selebar kartu.
import type { ReactNode } from 'react';
import { formatWib } from '@/lib/format';
import { dueRemaining } from '../../logic/closure';
import { Ic } from '../review/parts';

const ICON = {
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  caution: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
};
const TONE = {
  info: {
    bg: 'color-mix(in srgb, var(--status-info-bg) 45%, var(--surface))',
    ring: 'inset 0 0 0 1px color-mix(in srgb, var(--status-info-ink) 25%, var(--status-info-bg))',
    icBg: 'var(--status-info-bg)', icInk: 'var(--status-info-ink)',
  },
  caution: {
    bg: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))',
    ring: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))',
    icBg: 'var(--caution-bg)', icInk: 'var(--caution-ink)',
  },
};

export interface RequestRow { k: string; v: ReactNode; sub?: string }

export function RequestCard({ tone, title, quote, cite, rows, action, actionIcon, onAction }: {
  tone: 'info' | 'caution'; title: string; quote: string; cite: string; rows: RequestRow[];
  action: string; actionIcon: string; onAction: () => void;
}) {
  const t = TONE[tone];
  return (
    <section className="p-card in-sec in-warn-card" aria-label={title} style={{ gap: 12, padding: 20, background: t.bg, boxShadow: t.ring }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="lk-acc-ic" style={{ background: t.icBg, color: t.icInk }}><Ic d={ICON[tone]} size={16} /></span>
        <h2 className="p-h2">{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}>
        <span style={{ fontSize: 14, lineHeight: '21px' }}>“{quote.replace(/^“|”$/g, '')}”</span>
        <span className="p-cap">{cite}</span>
      </div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '96px minmax(0, 1fr)' }}>
        {rows.map((r) => (
          <div key={r.k} style={{ display: 'contents' }}>
            <dt>{r.k}</dt>
            <dd>{r.v}{r.sub && <div className="sub">{r.sub}</div>}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="p-btn p-btn-primary" style={{ justifyContent: 'center' }} onClick={onAction}>
        <Ic d={actionIcon} size={16} />{action}
      </button>
    </section>
  );
}

/** Baris Tenggat: "2 Nov 2026, 07:00" tebal + "sisa 2 hari". */
export function dueRow(due: string | undefined, now: string): RequestRow {
  if (!due) return { k: 'Tenggat', v: '—' };
  return { k: 'Tenggat', v: <b>{formatWib(due)}</b>, sub: dueRemaining(due, now).text };
}
