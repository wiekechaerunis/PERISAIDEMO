// Kartu Riwayat dengan saring Semua/Catatan/Perubahan dan lipatan entri lama (board P31, P35, PS1). Dari `riwayat(i)`.
import { useState } from 'react';
import { formatWibFull } from '@/lib/format';
import type { Incident } from '@/services/types';
import { riwayat, type RwItem, type RwKind } from '../../logic/closure';
import { InfoTip } from '../detail/InfoTip';
import { SIc } from './icons';
import { withoutDirectiveEntries } from './skkLogic';

type Filter = 'semua' | 'catatan' | 'perubahan';
const FILTERS: [Filter, string][] = [['semua', 'Semua'], ['catatan', 'Catatan'], ['perubahan', 'Perubahan']];
const NOTE_KINDS: RwKind[] = ['catatan', 'wa', 'arahan'];
export const SHOWN = 3;

const NODE: Record<RwKind, { cls: string; icon: Parameters<typeof SIc>[0]['d'] }> = {
  catatan: { cls: '', icon: 'pencil' },
  wa: { cls: '', icon: 'wa' },
  sys: { cls: 'ok', icon: 'check' },
  arahan: { cls: '', icon: 'flag' },
  esc: { cls: 'warn', icon: 'up' },
  'esc-auto': { cls: 'err', icon: 'up' },
  ubah: { cls: '', icon: 'undo' },
};

function Entry({ x }: { x: RwItem }) {
  const n = NODE[x.kind];
  const nd = x.kind === 'sys' && !x.ok ? '' : n.cls;
  return (
    <li className={x.kind === 'sys' ? 'sys' : undefined}>
      <span className={`nd ${nd}`} aria-hidden="true"><SIc d={n.icon} size={11} /></span>
      <div>
        <div className="hd">
          <b>{x.bold}</b>{x.by && <> · {x.by}</>}
          {x.kind === 'wa' && <span className="src wa"><SIc d="wa" size={11} />Dari WhatsApp</span>}
          {(x.kind === 'esc' || x.kind === 'esc-auto') && <span className="src esc"><SIc d="up" size={11} />Eskalasi</span>}
          {x.kind === 'arahan' && <span className="src esc"><SIc d="flag" size={11} />Arahan SKK</span>}
        </div>
        <div className="tm">{formatWibFull(x.at)}</div>
        {x.body && <div className="body">{x.body}</div>}
        {x.files && x.files.length > 0 && (
          <div className="att">{x.files.map((f) => <span key={f}><SIc d="clip" size={13} />{f}</span>)}</div>
        )}
      </div>
    </li>
  );
}

export function RiwayatCard({ incident }: { incident: Incident }) {
  const [filter, setFilter] = useState<Filter>('semua');
  const [all, setAll] = useState(false);
  const items = riwayat(withoutDirectiveEntries(incident));
  const list = items.filter((x) => (filter === 'semua' ? true : filter === 'catatan' ? NOTE_KINDS.includes(x.kind) : !NOTE_KINDS.includes(x.kind)));
  const shown = all ? list : list.slice(0, SHOWN);
  const hidden = list.length - shown.length;
  return (
    <section className="p-card in-sec">
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ gap: 2 }}>
          Riwayat · {items.length}
          <InfoTip label="riwayat" text="Catatan penanganan dan perubahan insiden dalam satu urutan, terbaru di atas. Entri tidak bisa diubah atau dihapus; koreksi dengan catatan baru. Nilai lama dan baru ada di Jejak audit lengkap." />
        </h2>
        <a href="#jejak-audit" className="lk-alink" onClick={(e) => e.preventDefault()}>Jejak audit lengkap</a>
      </div>
      <div className="in-rf" role="radiogroup" aria-label="Saring riwayat">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={filter === k} onClick={() => { setFilter(k); setAll(false); }}>{label}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="p-cap" style={{ margin: 0 }}>Belum ada entri.</p>
      ) : (
        <ol className="p-tl in-kr" aria-label="Riwayat insiden">{shown.map((x, n) => <Entry key={`${x.at}-${n}`} x={x} />)}</ol>
      )}
      {list.length > SHOWN && (
        <button type="button" className={all ? 'in-more up' : 'in-more'} onClick={() => setAll((v) => !v)}>
          <SIc d="chev" size={14} />{all ? 'Tampilkan lebih sedikit' : `Tampilkan ${hidden} entri sebelumnya`}
        </button>
      )}
    </section>
  );
}
