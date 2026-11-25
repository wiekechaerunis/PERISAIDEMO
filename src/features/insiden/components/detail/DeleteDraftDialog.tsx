// Dialog "Hapus draf ini?" (B-8; board Main-HapusDraf, I22b-HapusDraf). Dipakai di daftar (menu ⋯) dan header form.
import { useEffect, useRef } from 'react';
import { Ic } from './Ic';

interface Props {
  no: string;
  title: string;
  files: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteDraftDialog({ no, title, files, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" role="alertdialog" aria-modal="true" aria-labelledby="hd-t">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="hd-t">Hapus draf ini?</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onCancel}>
              <Ic d="close" size={15} />
            </button>
          </div>
          <div className="db">
            <span>Isian dan lampiran draf ini terhapus dan tidak bisa dikembalikan.</span>
            <dl className="p-kv">
              <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{no}</span></dd>
              <dt>Judul</dt><dd>{title || '—'}</dd>
              <dt>Lampiran</dt><dd>{files ? `${files} file` : 'Tidak ada'}</dd>
            </dl>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" ref={ref} onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-destructive" onClick={onConfirm}>Hapus draf</button>
          </div>
        </div>
      </div>
    </>
  );
}
