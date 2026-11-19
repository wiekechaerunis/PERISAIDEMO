// Board mobile: M5 (Sepertinya sudah dilaporkan) dan M5b (Hapus draf ini?). Kandidat dari duplicateCandidates (logika review).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DupCandidate } from '@/features/insiden/logic/review';
import { D, Pi, Sheet } from './parts';

interface Props {
  candidates: DupCandidate[];
  onSubmitAnyway: () => void;
  onLink: (no: string) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function DuplicateSheet({ candidates, onSubmitAnyway, onLink, onDelete, onBack }: Props) {
  const [more, setMore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sel, setSel] = useState<string | null>(candidates.find((c) => c.linkable)?.no ?? null);
  const shown = more ? candidates : candidates.slice(0, 3);
  const rest = candidates.length - shown.length;

  if (confirmDelete) {
    return (
      <Sheet labelledBy="hd-t">
        <div className="sb">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--error-bg)', color: 'var(--error-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Pi d={D.trash} />
            </span>
            <b id="hd-t" style={{ fontSize: 17, lineHeight: '24px' }}>Hapus draf ini?</b>
          </div>
          <span style={{ color: 'var(--ink-subtle)' }}>
            Pakai ini bila kejadiannya sama dan tidak ada informasi baru. Isian dan lampiran draf ini terhapus dan tidak bisa dikembalikan. Pesan WhatsApp sumbernya tetap ada.
          </span>
        </div>
        <div className="sf">
          <button type="button" className="p-btn p-btn-destructive" onClick={onDelete}>Hapus draf</button>
          <button type="button" className="p-btn p-btn-secondary" onClick={() => setConfirmDelete(false)}>Batal</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet labelledBy="g-t" onClose={onBack}>
      <div style={{ padding: '8px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--caution-bg)', color: 'var(--caution-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Pi d={D.warn} />
          </span>
          <b id="g-t" style={{ fontSize: 16 }}>Sepertinya sudah dilaporkan</b>
        </div>
        <span style={{ color: 'var(--ink-subtle)' }}>
          Ada {candidates.length} insiden mirip di dekat lokasi ini. Bila salah satunya sama, pilih lalu tautkan: pesan dan foto masuk ke kronologinya, draf ini dihapus.
        </span>
        <div className="in-dups" role="radiogroup" aria-label="Insiden mirip">
          {shown.map((c) => {
            const on = sel === c.no;
            return (
              <div key={c.no} className={'in-dupw' + (on ? ' on' : '') + (c.linkable ? '' : ' dis')}>
                <button type="button" className="in-dsel" role="radio" aria-checked={on} aria-disabled={!c.linkable} onClick={() => c.linkable && setSel(c.no)}>
                  <span className="in-rad" aria-hidden="true"></span>
                  <span className="t">
                    <b>{c.title}</b>
                    <span className="m"><span className="p-mono">{c.no}</span><span>· {c.status}</span></span>
                    <span className="m">
                      <span className="in-match">{c.dist}</span>
                      <span className="in-match">Selisih {c.dt}</span>
                      <span className={'p-tag ' + c.sevCls} style={{ marginLeft: 'auto' }}><span className="dot"></span>{c.sevLabel}</span>
                    </span>
                    {!c.linkable && (
                      <span className="in-dnote"><Pi d={D.lock} size={12} />Sudah ditutup, tidak bisa ditautkan</span>
                    )}
                  </span>
                </button>
                <Link to={`/insiden/${c.no}`} className="in-dopen" aria-label={`Buka ${c.no}`}>
                  <Pi d={D.open} />
                </Link>
              </div>
            );
          })}
          {rest > 0 && <button type="button" className="in-dmore" onClick={() => setMore(true)}>Lihat {rest} lainnya</button>}
        </div>
      </div>
      <div style={{ padding: '10px 16px 18px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" className="p-btn p-btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }} onClick={onSubmitAnyway}>Tetap ajukan</button>
        {sel && (
          <button type="button" className="p-btn p-btn-secondary" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }} onClick={() => onLink(sel)}>
            Tautkan pesan ke {sel}
          </button>
        )}
        <button type="button" className="p-btn p-btn-danger" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }} onClick={() => setConfirmDelete(true)}>Hapus draf ini</button>
        <button type="button" className="p-btn p-btn-secondary" style={{ width: '100%', justifyContent: 'center', minHeight: 44, boxShadow: 'none' }} onClick={onBack}>Kembali ke ringkasan</button>
      </div>
    </Sheet>
  );
}
