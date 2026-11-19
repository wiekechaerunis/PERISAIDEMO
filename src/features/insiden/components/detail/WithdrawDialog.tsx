// Dialog "Tarik kembali jadi draf?" (board S07-TarikKembali).
import { useEffect, useRef } from 'react';
import { Ic } from './Ic';

interface Props {
  /** tampilkan baris "SKK Migas" (hanya bila SKK sudah diberi tahu, keparahan Tinggi/Kritis) */
  skkNotified: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function WithdrawDialog({ skkNotified, onCancel, onConfirm }: Props) {
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
      <div className="in-dlg" role="dialog" aria-modal="true" aria-labelledby="t1">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="t1">Tarik kembali jadi draf?</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onCancel}>
              <Ic d="close" size={15} />
            </button>
          </div>
          <div className="db">
            <span>Anda bisa mengubah isinya lagi, lalu mengajukan ulang.</span>
            <dl className="p-kv">
              <dt>Status</dt><dd>Menunggu pemeriksaan → Draf</dd>
              <dt>Pemeriksaan</dt><dd>Dibatalkan</dd>
              {skkNotified && (<><dt>SKK Migas</dt><dd>Diberi tahu bahwa laporan ditarik</dd></>)}
            </dl>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" ref={ref} onClick={onConfirm}>Tarik kembali</button>
          </div>
        </div>
      </div>
    </>
  );
}
