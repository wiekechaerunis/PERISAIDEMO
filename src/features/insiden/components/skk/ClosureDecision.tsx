// Kartu keputusan penutupan untuk SKK bila SKK dikonfigurasi sebagai penyetuju (board P36 = P22 dengan peran SKK, DL-74).
// Bagian khusus Pejabat (kontrak mitra, Ganti PIC, bahan pertimbangan AI) tidak tampil di tampilan SKK.
import { demoNow } from '@/services/mock/clock';
import { useEffect, useRef, useState } from 'react';
import { formatWibFull } from '@/lib/format';

import type { Incident } from '@/services/types';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { DEMO_USERS } from '@/lib/rbac';
import { closureDone, CLOSURE_REQUIRED } from '@/services/mock/workflow.handling';
import { openFollowUps } from '@/services/mock/workflow.closure';
import { addMinutes } from '../detail/detailLogic';
import { Ic } from '../detail/Ic';
import { dueRemaining, reviewDeadline } from '../../logic/closure';
import { SIc } from './icons';

export type Focus = 'dp' | 'bk' | 'tl' | null;

interface Props {
  incident: Incident;
  focus: Focus;
  onFocus: (f: Focus) => void;
  onApprove: (note: string) => void;
  onReturn: () => void;
}

export function ClosureDecision({ incident: i, focus, onFocus, onApprove, onReturn }: Props) {
  const [note, setNote] = useState('');
  const c = i.handling?.closure;
  const asked = c?.requestedAt ?? demoNow();
  const approvedAt = addMinutes(asked, 40);
  const fus = useFollowUps();
  const open = openFollowUps(i, fus);
  const files = c?.evidence ?? [];
  const done = closureDone(c);
  const due = i.handleDueAt ? dueRemaining(i.handleDueAt, demoNow()) : null;
  const toggle = (f: Exclude<Focus, null>) => () => onFocus(focus === f ? null : f);
  return (
    <section
      className="p-card in-warn-card"
      style={{ padding: 20, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}
    >
      <div className="cl-dec">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
            <SIc d="warn" size={18} />
          </span>
          <h2 className="p-h2">Butuh persetujuan penutupan dari Anda</h2>
        </div>
        <div className="meta">
          <span className="r"><SIc d="check" size={13} /><span>Disetujui <b>{DEMO_USERS.pejabat.name}</b> (Pejabat Berwenang) · {formatWibFull(approvedAt)}</span></span>
          <span className="r"><SIc d="clock" size={13} /><span>Batas tinjau <b>{formatWibFull(reviewDeadline(asked))}</b> · 2 hari kerja</span></span>
          {i.handleDueAt && (
            <span className="r" style={{ paddingLeft: 19 }}>
              Tenggat penanganan {formatWibFull(i.handleDueAt)}{due ? ` · ${due.text}` : ''} · {i.escalated ? 'sudah dieskalasi' : 'belum dieskalasi'}
            </span>
          )}
        </div>
        <div className="cl-ready">
          <span className="hd">Kesiapan penutupan</span>
          <button type="button" aria-pressed={focus === 'dp'} onClick={toggle('dp')}>
            <span className={done === CLOSURE_REQUIRED.length ? 'ok' : 'nt'}><SIc d="check" size={12} /></span>
            <span className="tx">{done === CLOSURE_REQUIRED.length ? 'Data penutupan lengkap' : 'Data penutupan belum lengkap'}<span className="s">{done} dari {CLOSURE_REQUIRED.length} isian wajib terisi</span></span>
            <span className="go">Lihat</span>
          </button>
          <button type="button" aria-pressed={focus === 'bk'} onClick={toggle('bk')}>
            <span className={files.length ? 'ok' : 'nt'}><SIc d="check" size={12} /></span>
            <span className="tx">{files.length ? 'Bukti terlampir' : 'Belum ada bukti'}<span className="s">{files.length ? `${files.length} file: ${files.map((f) => f.caption.toLowerCase()).join(', ')}` : 'Tidak ada file bukti'}</span></span>
            <span className="go">Lihat</span>
          </button>
          {open.length > 0 && (
            <button type="button" aria-pressed={focus === 'tl'} onClick={toggle('tl')}>
              <span className="nt"><SIc d="clock" size={12} /></span>
              <span className="tx">{open.length} tindak lanjut masih berjalan<span className="s">Tidak menghalangi penutupan; tetap dipantau sampai selesai</span></span>
              <span className="go">Lihat</span>
            </button>
          )}
        </div>
        <div className="p-field">
          <label htmlFor="catatan-tutup" className="p-lbl" style={{ color: 'var(--ink)' }}>Catatan penutupan <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></label>
          <textarea
            id="catatan-tutup" className="p-input p-area" style={{ minHeight: 64, background: 'var(--surface)' }}
            placeholder="mis. Pastikan patroli tambahan tetap jalan sampai 12 Nov." value={note} onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="cl-acts">
          <button type="button" className="p-btn p-btn-secondary" style={{ background: 'var(--surface)' }} onClick={onReturn}>
            <Ic d="undo" size={16} />Kembalikan ke PIC
          </button>
          <button type="button" className="p-btn p-btn-primary" onClick={() => onApprove(note)}>
            <Ic d="check" size={16} />Setujui penutupan
          </button>
        </div>
        <p className="p-cap" style={{ margin: 0, textAlign: 'right' }}>Keputusan dicatat di jejak audit atas nama Anda. Insiden yang ditutup ikut dipakai untuk memperbarui prakiraan.</p>
      </div>
    </section>
  );
}

/** Dialog alasan "Kembalikan ke PIC" (P25): alasan wajib. */
export function ReturnDialog({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (reason: string) => string | undefined }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" style={{ width: 520 }} role="dialog" aria-modal="true" aria-labelledby="ret-t">
        <div className="p-dialog">
          <div className="dh">
            <h3 id="ret-t">Kembalikan ke PIC</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onCancel}><Ic d="close" size={15} /></button>
          </div>
          <div className="db">
            <span>Insiden kembali ke Dalam penanganan. PIC melihat alasan Anda dan bisa mengajukan penutupan lagi.</span>
            <div className="p-field">
              <label htmlFor="alasan-kembali" className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></label>
              <textarea id="alasan-kembali" ref={ref} className={'p-input p-area' + (error ? ' err' : '')} style={{ minHeight: 88 }} value={text} onChange={(e) => { setText(e.target.value); setError(undefined); }} />
              {error && <span className="p-help err" role="alert"><Ic d="warn" size={14} />{error}</span>}
            </div>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" onClick={() => setError(onSubmit(text))}>Kembalikan</button>
          </div>
        </div>
      </div>
    </>
  );
}
