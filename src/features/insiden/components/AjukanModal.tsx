// Modal "Ajukan laporan?" (board I14m, I14ma, I14mb, I14mk; B-14, ADJ-01). Ringkasan Nomor/Judul/Keparahan, Diperiksa oleh (combobox
// pilih-banyak), info terkunci (+ SKK untuk Tinggi/Kritis), Batal / Ajukan laporan. Kosong → galat dan tombol nonaktif.
// Pelapor juga pemeriksa → "(Anda)" + peringatan, tidak diblokir.
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';

interface Props {
  no: string;
  title: string;
  severity: Severity | null;
  options: string[];
  /** null = semua terpilih */
  reviewers: string[] | null;
  onReviewers: (v: string[] | null) => void;
  /** nama pengaju (pengguna aktif) */
  me: string;
  /** tombol utama, mis. "Ajukan laporan" atau "Ajukan ulang" */
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AJUKAN_HELP =
  'Bawaan karena admin belum mengatur pemeriksa lain. Semua terpilih; kurangi bila perlu. Yang memeriksa lebih dulu menyelesaikan tugas.';

export function AjukanModal({ no, title, severity, options, reviewers, onReviewers, me, confirmLabel = 'Ajukan laporan', onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  const picked = reviewers ?? options;
  const empty = picked.length === 0;
  const selfPicked = options.includes(me) && picked.includes(me);
  const fast = isHighOrCritical(severity);
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" role="dialog" aria-modal="true" aria-labelledby="am-t">
        <div className="p-dialog am-dlg">
          <div className="dh">
            <h3 id="am-t">Ajukan laporan?</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" ref={ref} onClick={onCancel}>
              <Icon name="close" size={15} />
            </button>
          </div>
          <div className="db" style={{ gap: 16 }}>
            <span>Laporan dikirim ke pemeriksa sesuai alur persetujuan insiden.</span>
            <dl className="am-sum">
              <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{no}</span></dd>
              <dt>Judul</dt><dd style={{ fontWeight: 600 }}>{title || '—'}</dd>
              <dt>Keparahan</dt>
              <dd>{severity ? <span className={'p-tag ' + SEV_TAG_CLS[severity]}><span className="dot"></span>{SEV_LABEL[severity]}</span> : 'Belum ditentukan'}</dd>
            </dl>
            <ReviewerSelect
              id="aj-rev" options={options} value={reviewers} onChange={onReviewers} allowEmpty self={me} help={AJUKAN_HELP}
            />
            {selfPicked && (
              <div className="am-note fast" role="note">
                <span className="ic"><Icon name="warn" size={16} /></span>
                <div>
                  <p><b>Anda juga termasuk pemeriksa.</b> Sebaiknya laporan diperiksa orang lain; hapus centang nama Anda bila ada pemeriksa lain.</p>
                  <p>Bila Anda tetap memeriksanya sendiri, sistem tidak memblokir, dan tindakan itu tercatat di Riwayat dan Jejak audit.</p>
                </div>
              </div>
            )}
            <div className={fast ? 'am-note fast' : 'am-note'}>
              <span className="ic"><Icon name="lock" size={16} /></span>
              <div>
                <p>Isi dan lampiran terkunci sampai diverifikasi. Perlu mengubah? Batalkan pengajuan selama belum diperiksa.</p>
                {fast && severity && <p><b>SKK Migas langsung diberi tahu</b> karena keparahan {SEV_LABEL[severity]}.</p>}
              </div>
            </div>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" disabled={empty} onClick={onConfirm}>
              <Icon name="send" size={16} />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
