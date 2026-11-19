// Banner "Sepertinya sudah dilaporkan" di Ringkasan draf WhatsApp (board I22): tiga pilihan. Ajukan nonaktif sampai Pelapor memilih.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { DupCandidate } from '@/features/insiden/logic/review';

interface Props {
  candidates: DupCandidate[];
  /** daftar tertutup saat dibuka (I22b-RingkasanGandaTutup) */
  initiallyClosed?: boolean;
  onLink: (no: string) => void;
  onKeep: () => void;
  onDelete: () => void;
}

const OPEN = 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6';

export function WaDuplicateBanner({ candidates, initiallyClosed, onLink, onKeep, onDelete }: Props) {
  const [open, setOpen] = useState(!initiallyClosed);
  const [more, setMore] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const n = candidates.length;
  const shown = more ? candidates : candidates.slice(0, 3);
  const dis = sel === null;
  const btn = { background: 'var(--surface)', ...(dis ? { opacity: 0.45, pointerEvents: 'none' as const } : {}) };
  const first = candidates[0];
  return (
    <div className="in-bn caution" role="region" aria-label="Kemungkinan laporan ganda">
      <Icon name="warn" size={18} />
      <div className="body">
        <div className="in-dhd">
          <div className="tx"><b>Sepertinya sudah dilaporkan.</b> {n} insiden berkategori sama di dekat lokasi ini, diurutkan dari yang paling mirip.</div>
          <button type="button" className="in-dtog" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Sembunyikan' : `Tampilkan ${n} insiden`}
            <Icon name="chevDown" size={14} style={open ? { transform: 'rotate(180deg)' } : undefined} />
          </button>
        </div>
        <div style={{ color: 'var(--ink)' }}>
          {open ? (
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
                      <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}><path d={OPEN} /></svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="in-dsum" style={{ display: 'block' }}>
              {sel ? `Dipilih: ${sel}` : `Paling mirip: ${first.no} · ${first.dist} · selisih ${first.dt}`}
            </div>
          )}
        </div>
        <div className="in-dfoot">
          {open && !more && n > 3 && <button type="button" className="in-dmore" style={{ display: 'inline-flex' }} onClick={() => setMore(true)}>Lihat {n - 3} lainnya</button>}
          <span>Bila salah satunya kejadian yang sama, pilih lalu tautkan: pesan dan foto masuk ke kronologinya, draf ini dihapus.</span>
        </div>
        <div className="acts">
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={btn} aria-disabled={dis} disabled={dis} onClick={() => sel && onLink(sel)}>
            {sel ? `Tautkan pesan ke ${sel}` : 'Tautkan pesan'}
          </button>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ background: 'var(--surface)' }} onClick={onKeep}>Tetap ajukan sebagai insiden baru</button>
          <button type="button" className="p-btn p-btn-danger p-btn-sm" onClick={onDelete}>Hapus draf ini</button>
        </div>
      </div>
    </div>
  );
}
