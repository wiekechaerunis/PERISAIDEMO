// Kartu "Seberapa parah?" (board I13, I13u, I13ue): saran otomatis, pemilih 5 level, alasan bila beda, banner SKK.
// B-10: tanpa label "setara …". B-11 (ADJ-07): sebagian dampak belum diketahui → saran sementara; tidak ada yang diketahui →
// "Belum bisa disarankan", pelapor wajib memilih sendiri.
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SEVERITIES, SEV_DOT, SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';
import { FieldError } from './AiTag';
import { MAX_ALASAN } from './step2Data';

interface Props {
  /** saran sistem dari dampak yang diketahui; null = belum ada dasar saran */
  suggested: Severity | null;
  /** level yang berlaku; sama dengan saran bila tidak diubah; null bila belum dipilih */
  level: Severity | null;
  /** rincian untuk kalimat "Dari dampak: …" */
  parts: string[];
  /** ada dampak terpilih yang ditandai Belum diketahui */
  unknown?: boolean;
  reason: string;
  reasonError?: string;
  /** Berikutnya ditekan tanpa level saat belum bisa disarankan (I13ue) */
  levelError?: boolean;
  onPick: (level: Severity) => void;
  onReason: (text: string) => void;
}

/** Belum bisa disarankan: tidak ada saran dan ada dampak yang belum diketahui (B-11). */
export const cannotSuggest = (suggested: Severity | null, unknown: boolean) => suggested === null && unknown;

export function SeverityAuto({ suggested, level, parts, unknown = false, reason, reasonError, levelError, onPick, onReason }: Props) {
  const noSug = cannotSuggest(suggested, unknown);
  const [editing, setEditing] = useState(false);
  const open = editing || noSug;
  const differs = !noSug && level !== null && level !== suggested;
  const why = noSug
    ? 'Dampak belum diketahui, jadi sistem belum bisa menyarankan level. Pilih level sesuai perkiraan Anda; Pejabat Berwenang menetapkan level resmi saat memeriksa.'
    : (parts.length ? `Dari dampak: ${parts.join(', ')}.` : 'Pilih apa saja yang terdampak dulu.') +
      (unknown ? ' Saran sementara: bisa naik setelah dampak yang belum diketahui diperbarui selama penanganan.' : '');
  const tag = noSug
    ? level
      ? { cls: 'p-tag t-info', t: 'Dipilih pelapor' }
      : { cls: 'p-tag t-caution', t: 'Wajib dipilih' }
    : differs
      ? { cls: 'p-tag t-caution', t: 'Diubah pelapor' }
      : { cls: 'p-tag t-info', t: unknown ? 'Otomatis · sementara' : 'Otomatis' };
  const showErr = !!levelError && !level;
  return (
    <>
      <div className="in-sevauto" style={showErr ? { boxShadow: 'inset 0 0 0 1.5px var(--error-ink)' } : undefined}>
        <div className="r1">
          {level ? (
            <span className={'p-tag ' + SEV_TAG_CLS[level]}><span className="dot"></span>{SEV_LABEL[level]}</span>
          ) : (
            <b style={{ fontSize: 14 }}>Belum bisa disarankan</b>
          )}
          <span className={tag.cls} style={{ height: 20, fontSize: 11 }}>{tag.t}</span>
          <span style={{ flex: 1 }}></span>
          {!noSug && (
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setEditing(!editing)}>
              {editing ? 'Selesai' : 'Ubah'}
            </button>
          )}
        </div>
        <span className="p-cap">{why}</span>
      </div>
      {showErr && (
        <span className="p-help err" role="alert" style={{ marginTop: 6 }}>
          <Icon name="warn" size={14} />
          Pilih tingkat keparahan dulu sebelum lanjut.
        </span>
      )}
      {open && (
        <div className="in-seg5" role="radiogroup" aria-label="Keparahan awal" style={{ marginTop: 10 }}>
          {SEVERITIES.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={level === k} onClick={() => onPick(k)}>
              <i style={{ background: SEV_DOT[k] }}></i>{SEV_LABEL[k]}<span className="s">{k === suggested ? '· saran' : ''}</span>
            </button>
          ))}
        </div>
      )}
      {differs && (
        <div className="p-field" style={{ marginTop: 12 }}>
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kenapa berbeda dari saran?<span className="p-req">*</span></span>
          <textarea
            className={'p-input p-area' + (reasonError ? ' err' : '')} aria-label="Kenapa berbeda dari saran?" maxLength={MAX_ALASAN}
            style={{ minHeight: 64, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            placeholder="mis. Kerugian sebenarnya jauh lebih besar dari perkiraan awal." value={reason}
            onChange={(e) => onReason(e.target.value)}
          />
          <span className="p-help row"><span>Saran dan pilihan Anda tampil berdampingan di Detail.</span><span>{reason.length}/{MAX_ALASAN}</span></span>
          <FieldError text={reasonError} />
        </div>
      )}
      {isHighOrCritical(level) && (
        <div className="in-bn caution" style={{ marginTop: 12 }}>
          <Icon name="bell" size={18} />
          <div className="body"><b>SKK Migas langsung diberi tahu</b> saat diajukan.</div>
        </div>
      )}
    </>
  );
}
