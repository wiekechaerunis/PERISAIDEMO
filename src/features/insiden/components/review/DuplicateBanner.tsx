// Banner "Sepertinya sudah dilaporkan" (board V21, V21b): pilih insiden mirip lalu Gabung, Tautkan, atau Tetap terpisah.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DupCandidate } from '../../logic/review';
import { Ic } from './parts';

interface Props {
  candidates: DupCandidate[];
  /** daftar tertutup (V21b) */
  initiallyClosed?: boolean;
  onMerge: (no: string) => void;
  onLink: (no: string) => void;
  onSeparate: () => void;
}

export function DuplicateBanner({ candidates, initiallyClosed, onMerge, onLink, onSeparate }: Props) {
  const [open, setOpen] = useState(!initiallyClosed);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const n = candidates.length;
  const shown = more ? candidates : candidates.slice(0, 3);
  const dis = sel === null;
  const btn = { background: 'var(--surface)', ...(dis ? { opacity: 0.45, pointerEvents: 'none' as const } : {}) };
  return (
    <div className="in-bn caution" role="region" aria-label="Kemungkinan laporan ganda">
      <Ic d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={16} />
      <div className="body">
        <div className="in-dhd">
          <div className="tx"><b>Sepertinya sudah dilaporkan.</b> {n} insiden berkategori sama di dekat lokasi ini. Putuskan dulu sebelum menyetujui.</div>
          <button type="button" className="in-dtog" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Sembunyikan' : `Tampilkan ${n} insiden`}
            <Ic d={open ? 'M18 15l-6-6-6 6' : 'm6 9 6 6 6-6'} size={14} />
          </button>
        </div>
        <div style={{ color: 'var(--ink)' }}>
          {open && (
            <div className="in-dups cmp" role="radiogroup" aria-label="Insiden mirip" style={{ display: 'flex' }}>
              {shown.map((d) => {
                const on = sel === d.no;
                return (
                  <div key={d.no} className={'in-dupw' + (on ? ' on' : '') + (d.linkable ? '' : ' dis')}>
                    <button
                      type="button" className="in-dsel" role="radio" aria-checked={on} aria-disabled={!d.linkable} title={d.title}
                      onClick={() => d.linkable && setSel(on ? null : d.no)}
                    >
                      <span className="in-rad" aria-hidden="true"></span>
                      <span className="ttl">{d.title}</span>
                      <span className="meta"><span className="p-mono">{d.no}</span> · {d.who} · <span className="st">{d.linkable ? d.status : `${d.status}, tak bisa ditautkan`}</span></span>
                      <span className="ch"><span className="in-match">{d.dist}</span><span className="in-match">Selisih {d.dt}</span></span>
                      <span className={'p-tag ' + d.sevCls}><span className="dot"></span>{d.sevLabel}</span>
                    </button>
                    <Link to={`/insiden/${d.no}`} target="_blank" className="in-dopen" aria-label={`Buka ${d.no} di tab baru`} title="Buka detail">
                      <Ic d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
          {!open && <div className="in-dsum" style={{ display: 'block' }}>{sel ? `Dipilih: ${sel}` : `Paling mirip: ${candidates[0].no} · ${candidates[0].dist} · selisih ${candidates[0].dt}`}</div>}
        </div>
        <div className="in-dfoot">
          {open && !more && n > 3 && <button type="button" className="in-dmore" style={{ display: 'inline-flex' }} onClick={() => setMore(true)}>Lihat {n - 3} lainnya</button>}
          <span>Gabung atau Tautkan: pilih satu insiden yang kejadiannya sama. Terpisah: bukan kejadian yang sama dengan {n === 1 ? 'insiden ini' : `${n} insiden ini`}.</span>
        </div>
        <div className="acts">
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={btn} aria-disabled={dis} onClick={() => sel && onMerge(sel)}>{sel ? `Gabung ke ${sel}` : 'Gabung'}</button>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={btn} aria-disabled={dis} onClick={() => sel && onLink(sel)}>{sel ? `Tautkan dengan ${sel}` : 'Tautkan'}</button>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ background: 'var(--surface)' }} onClick={onSeparate}>Tetap sebagai insiden terpisah</button>
        </div>
      </div>
    </div>
  );
}
