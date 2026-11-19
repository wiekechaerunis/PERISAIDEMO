// Bagian "Jenis kejadian" (board I13, S14, S15, S17, S18): combobox Kategori + Jenis, isian "Lainnya".
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { ReportDraft } from '../logic/draft';
import { AiTag, FieldError } from './AiTag';
import { JENIS_LAIN, KAT, KAT_LAIN, MAX_LAIN, bareInput, jenisOf, type Step2Errors } from './step2Data';

interface Props {
  draft: ReportDraft;
  onPatch: (p: Partial<ReportDraft>) => void;
  aiFilled: string[];
  errors: Step2Errors;
}

type Open = null | 'kat' | 'jen';

export function CategoryFields({ draft, onPatch, aiFilled, errors }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const ref = useRef<HTMLDivElement>(null);
  const jl = jenisOf(draft.category);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const pickKat = (label: string) => {
    onPatch({ category: label, jenis: null, jenisOther: '', categoryOther: label === KAT_LAIN ? draft.categoryOther : '' });
    setOpen(null);
  };
  const pickJen = (label: string) => {
    onPatch({ jenis: label, jenisOther: label === JENIS_LAIN ? draft.jenisOther : '' });
    setOpen(null);
  };
  const caret = <Icon name="chevDown" size={16} />;
  const btn = { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%' } as const;

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <div className="lk-f2">
        <div className="p-field in-cbx">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kategori<span className="p-req">*</span><AiTag on={aiFilled.includes('category')} /></span>
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
                  key={k} type="button" role="option" className={draft.category === l ? 'op on' : 'op'}
                  aria-selected={draft.category === l} onClick={() => pickKat(l)} style={{ minHeight: 48 }}
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
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
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
                  key={l} type="button" role="option" className={draft.jenis === l ? 'op on' : 'op'}
                  aria-selected={draft.jenis === l} onClick={() => pickJen(l)} style={{ minHeight: 44 }}
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
          <span className="p-help row">
            <span>Jenis ini tidak ada di daftar {draft.category}. Pejabat Berwenang bisa menetapkan jenis resmi saat pemeriksaan.</span>
            <span>{draft.jenisOther.length}/{MAX_LAIN}</span>
          </span>
          <FieldError text={errors.jenisOther} />
        </div>
      )}
    </div>
  );
}
