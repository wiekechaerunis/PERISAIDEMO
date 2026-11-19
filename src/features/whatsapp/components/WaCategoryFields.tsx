// Bagian "Jenis kejadian" di form WhatsApp (board I21): sama dengan CategoryFields desktop, beda di kepala isian Kategori (chip AI + Perlu dicek).
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { ReportDraft } from '@/features/insiden/logic/draft';
import { FieldError } from '@/features/insiden/components/AiTag';
import { JENIS_LAIN, KAT, KAT_LAIN, MAX_LAIN, bareInput, jenisOf, type Step2Errors } from '@/features/insiden/components/step2Data';
import type { WaDraft } from '@/services/types';
import { AiHead } from './parts';

interface Props {
  wa: WaDraft;
  onPatch: (p: Partial<ReportDraft>) => void;
  onConfirm: (key: string) => void;
  errors: Step2Errors;
}

const btn = { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%' } as const;

export function WaCategoryFields({ wa, onPatch, onConfirm, errors }: Props) {
  const draft = wa.form;
  const [open, setOpen] = useState<null | 'kat' | 'jen'>(null);
  const ref = useRef<HTMLDivElement>(null);
  const jl = jenisOf(draft.category);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(null);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const caret = <Icon name="chevDown" size={16} />;
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <div className="lk-f2">
        <div className="p-field in-cbx">
          <AiHead id="wa-f-category" draft={wa} k="category" label="Kategori" required onConfirm={onConfirm} />
          <button
            type="button" className={'p-input' + (errors.category ? ' err' : '')} aria-haspopup="listbox" aria-expanded={open === 'kat'}
            aria-label="Kategori" onClick={() => setOpen(open === 'kat' ? null : 'kat')} style={btn}
          >
            <span className={draft.category ? '' : 'ph'} style={{ flex: 1 }}>{draft.category ?? 'Pilih kategori'}</span>
            {caret}
          </button>
          <FieldError text={errors.category} />
          {open === 'kat' && (
            <div className="in-pop" role="listbox" aria-label="Kategori" style={{ top: 70, width: 380, right: 'auto' }}>
              <div className="grp">Kategori insiden · {KAT.length} pilihan</div>
              {KAT.map(([k, l, d]) => (
                <button
                  key={k} type="button" role="option" className={draft.category === l ? 'op on' : 'op'} aria-selected={draft.category === l}
                  style={{ minHeight: 48 }}
                  onClick={() => {
                    onPatch({ category: l, jenis: null, jenisOther: '', categoryOther: l === KAT_LAIN ? draft.categoryOther : '' });
                    // memilih sendiri berarti sudah dicek
                    onConfirm('category');
                    setOpen(null);
                  }}
                >
                  <span className="t"><b>{l}</b><span>{d}</span></span>
                  <span className="p-cap" style={{ flex: 'none' }}></span>
                </button>
              ))}
            </div>
          )}
        </div>
        {jl.length > 0 && (
        <div className="p-field in-cbx">
          <AiHead draft={wa} label="Jenis" optional />
          <button
            type="button" className="p-input" aria-haspopup="listbox" aria-expanded={open === 'jen'} aria-label="Jenis"
            onClick={() => jl.length && setOpen(open === 'jen' ? null : 'jen')} style={btn}
          >
            <span className={draft.jenis && jl.length ? '' : 'ph'} style={{ flex: 1 }}>
              {!jl.length ? 'Tidak ada jenis untuk kategori ini' : (draft.jenis ?? 'Pilih jenis')}
            </span>
            {caret}
          </button>
          <span className="p-help">
            {jl.length ? 'Pilihan menyesuaikan kategori. Nanti ditetapkan ulang saat pemeriksaan.' : 'Tidak wajib. Jelaskan kejadiannya di Dampak keamanan.'}
          </span>
          {open === 'jen' && (
            <div className="in-pop" role="listbox" aria-label="Jenis" style={{ top: 70 }}>
              <div className="grp">Jenis · {draft.category}</div>
              {jl.map((l) => (
                <button
                  key={l} type="button" role="option" className={draft.jenis === l ? 'op on' : 'op'} aria-selected={draft.jenis === l} style={{ minHeight: 44 }}
                  onClick={() => { onPatch({ jenis: l, jenisOther: l === JENIS_LAIN ? draft.jenisOther : '' }); setOpen(null); }}
                >
                  <span className="t"><b>{l}</b></span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
      {draft.category === KAT_LAIN && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan kategori kejadian<span className="p-req">*</span></span>
          <span className={'p-input' + (errors.categoryOther ? ' err' : '')}>
            <input
              style={bareInput} aria-label="Sebutkan kategori kejadian" maxLength={MAX_LAIN} value={draft.categoryOther}
              placeholder="mis. Penyusupan drone ke area produksi" onChange={(e) => onPatch({ categoryOther: e.target.value })}
            />
          </span>
          <span className="p-help row">
            <span>Tulis singkat. Pejabat Berwenang memetakannya ke kategori resmi saat pemeriksaan.</span>
            <span>{draft.categoryOther.length}/{MAX_LAIN}</span>
          </span>
          <FieldError text={errors.categoryOther} />
        </div>
      )}
      {draft.jenis === JENIS_LAIN && jl.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan jenis<span className="p-req">*</span></span>
          <span className={'p-input' + (errors.jenisOther ? ' err' : '')}>
            <input
              style={bareInput} aria-label="Sebutkan jenis" maxLength={MAX_LAIN} value={draft.jenisOther}
              placeholder="mis. Pencurian panel surya" onChange={(e) => onPatch({ jenisOther: e.target.value })}
            />
          </span>
          <FieldError text={errors.jenisOther} />
        </div>
      )}
    </div>
  );
}
