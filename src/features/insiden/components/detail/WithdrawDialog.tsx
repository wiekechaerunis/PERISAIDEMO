// Dialog "Batalkan pengajuan?" (board S07, ADJ-17). Alasan wajib, maks. 500 karakter (ADJ-17; board S07 masih 300).
import { useEffect, useRef, useState } from 'react';
import { Ic } from './Ic';

export const MAX_ALASAN_BATAL = 500;

interface Props {
  no: string;
  /** tampilkan baris "SKK Migas" (hanya bila SKK sudah diberi tahu lewat jalur cepat, keparahan Tinggi/Kritis) */
  skkNotified: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function WithdrawDialog({ no, skkNotified, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const empty = !reason.trim();
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  const err = tried && empty;
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" role="dialog" aria-modal="true" aria-labelledby="t1">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="t1">Batalkan pengajuan?</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onCancel}>
              <Ic d="close" size={15} />
            </button>
          </div>
          <div className="db">
            <span>
              Laporan <span className="p-mono" style={{ fontSize: 12 }}>{no}</span> kembali menjadi draf. Anda bisa mengubah isinya lalu
              mengajukan ulang.
            </span>
            <dl className="p-kv">
              <dt>Status</dt><dd>Menunggu pemeriksaan → Draf</dd>
              <dt>Pemeriksa</dt><dd>Tugas pemeriksaan dibatalkan dan pemeriksa diberi tahu</dd>
              {skkNotified && (<><dt>SKK Migas</dt><dd>Diberi tahu bahwa pengajuan dibatalkan, karena sebelumnya sudah menerima jalur cepat</dd></>)}
            </dl>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan membatalkan pengajuan<span className="p-req">*</span></span>
              <textarea
                ref={ref} className={'p-input p-area' + (err ? ' err' : '')} aria-label="Alasan membatalkan pengajuan" maxLength={MAX_ALASAN_BATAL}
                style={{ minHeight: 76, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                placeholder="mis. Lokasi kejadian salah titik, perlu diperbaiki." value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <span className={err ? 'p-help err' : 'p-help'} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{err ? 'Tulis alasan membatalkan pengajuan.' : 'Tercatat di Riwayat dan terlihat oleh pemeriksa.'}</span>
                <span>{reason.length}/{MAX_ALASAN_BATAL}</span>
              </span>
            </div>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
            <button
              type="button" className="p-btn p-btn-primary" aria-disabled={empty}
              onClick={() => (empty ? setTried(true) : onConfirm(reason.trim()))}
            >
              Batalkan pengajuan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
