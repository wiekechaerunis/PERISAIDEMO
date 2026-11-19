// Dialog "Beri arahan" (board P32). Teks arahan wajib; kirim memanggil `onSubmit`, galat dari store ditampilkan di bawah isian.
import { useEffect, useRef, useState } from 'react';
import { MAX_DIRECTIVE, MSG_DIRECTIVE_EMPTY } from '@/services/mock/workflow.skk';
import { Ic } from '../detail/Ic';
import { SIc } from './icons';

interface Props {
  onCancel: () => void;
  /** mengembalikan pesan galat bila ditolak, undefined bila berhasil */
  onSubmit: (text: string) => string | undefined;
}

export function DirectiveDialog({ onCancel, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  const send = () => {
    if (!text.trim()) return setError(MSG_DIRECTIVE_EMPTY);
    setError(onSubmit(text));
  };
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" style={{ width: 520 }} role="dialog" aria-modal="true" aria-labelledby="dlg-t">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="dlg-t">Beri arahan</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onCancel}>
              <Ic d="close" size={15} />
            </button>
          </div>
          <div className="db">
            <span>Arahan masuk ke riwayat. PIC dan Pejabat Berwenang diberi tahu. Tidak mengubah status, PIC, atau tenggat.</span>
            <div className="p-field">
              <label htmlFor="arahan-teks" className="p-lbl" style={{ color: 'var(--ink)' }}>Arahan<span className="p-req">*</span></label>
              <textarea
                id="arahan-teks" ref={ref} className={'p-input p-area' + (error ? ' err' : '')} style={{ minHeight: 88 }}
                maxLength={MAX_DIRECTIVE} value={text} aria-invalid={!!error}
                onChange={(e) => { setText(e.target.value); setError(undefined); }}
              />
              {error && <span className="p-help err" role="alert"><Ic d="warn" size={14} />{error}</span>}
              <span className="p-help row"><span></span><span>{text.length}/{MAX_DIRECTIVE.toLocaleString('id-ID')}</span></span>
            </div>
            <button type="button" className="p-btn p-btn-ghost p-btn-sm" style={{ alignSelf: 'flex-start' }}>
              <SIc d="clip" size={15} />Lampirkan · opsional
            </button>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" onClick={send}>Kirim arahan</button>
          </div>
        </div>
      </div>
    </>
  );
}
