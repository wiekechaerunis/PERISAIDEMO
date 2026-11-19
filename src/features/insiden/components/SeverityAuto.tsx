// Kartu "Seberapa parah?" (board I13): saran otomatis, pemilih 5 level, alasan bila beda, banner SKK.
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SEVERITIES, SEV_DOT, SEV_EQUIV, SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';
import { FieldError } from './AiTag';
import { MAX_ALASAN } from './step2Data';

interface Props {
  /** saran sistem (sudah di-fallback ke 'sangat-rendah' bila belum ada dampak) */
  suggested: Severity;
  /** level yang berlaku; sama dengan saran bila tidak diubah */
  level: Severity;
  /** rincian untuk kalimat "Dari dampak: …" */
  parts: string[];
  reason: string;
  reasonError?: string;
  onPick: (level: Severity) => void;
  onReason: (text: string) => void;
}

export function SeverityAuto({ suggested, level, parts, reason, reasonError, onPick, onReason }: Props) {
  const [editing, setEditing] = useState(false);
  const differs = level !== suggested;
  const why = parts.length ? `Dari dampak: ${parts.join(', ')}.` : 'Pilih apa saja yang terdampak dulu.';
  return (
    <>
      <div className="in-sevauto">
        <div className="r1">
          <span className={'p-tag ' + SEV_TAG_CLS[level]}><span className="dot"></span>{SEV_LABEL[level]}</span>
          <span className="p-cap">setara {SEV_EQUIV[level]}</span>
          <span className={differs ? 'p-tag t-caution' : 'p-tag t-info'} style={{ height: 20, fontSize: 11 }}>
            {differs ? 'Diubah pelapor' : 'Otomatis'}
          </span>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Selesai' : 'Ubah'}
          </button>
        </div>
        <span className="p-cap">{why}</span>
      </div>
      {editing && (
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
