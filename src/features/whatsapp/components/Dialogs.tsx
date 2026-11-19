// Dialog modul WhatsApp: Hapus draf (I22b), Tautkan ke insiden (I24), Lepas tautan (I25). Markup `in-scrim` + `in-dlg` + `p-dialog` dari board.
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatWibFull } from '@/lib/format';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { STATUS_LABEL, type Incident, type WaMessage } from '@/services/types';
import { MAX_UNLINK_REASON, MIN_UNLINK_REASON } from '@/services/mock/workflow.wa';
import { isLinkable } from '../logic/duplicates';
import { senderLabel } from '../logic/draft';

function Dialog({ id, title, onClose, children, footer }: { id: string; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <>
      <div className="in-scrim" onClick={onClose}></div>
      <div className="in-dlg" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="p-dialog">
          <div className="dh">
            <h3 id={id}>{title}</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onClose}><Icon name="close" size={15} /></button>
          </div>
          <div className="db">{children}</div>
          <div className="df">{footer}</div>
        </div>
      </div>
    </>
  );
}

export function DeleteDraftDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog
      id="dd-t" title="Hapus draf ini?" onClose={onCancel}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="p-btn p-btn-destructive" onClick={onConfirm}>Hapus draf</button>
        </>
      }
    >
      <span>
        Pakai ini bila kejadiannya sama dan tidak ada informasi baru. Isian dan lampiran draf ini terhapus dan tidak bisa dikembalikan. Pesan WhatsApp sumbernya tetap ada.
      </span>
    </Dialog>
  );
}

const shorten = (t: string) => (t.length > 80 ? `${t.slice(0, 80).trimEnd()}…` : t);

/** Dialog "Tautkan ke insiden": cari insiden Menunggu pemeriksaan/Dalam penanganan, WK Andalas Darat dulu lalu terbaru. */
export function LinkDialog({ message, incidents, onCancel, onLink }: { message: WaMessage; incidents: Incident[]; onCancel: () => void; onLink: (no: string) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const list = incidents
    .filter((i) => isLinkable(i) && `${i.no} ${i.title}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => Number(b.wk === 'WK Andalas Darat') - Number(a.wk === 'WK Andalas Darat') || b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5);
  const picked = incidents.find((i) => i.no === sel);
  return (
    <Dialog
      id="tk-t" title="Tautkan ke insiden" onClose={onCancel}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" aria-disabled={sel === null} disabled={sel === null} onClick={() => sel && onLink(sel)}>Tautkan</button>
        </>
      }
    >
      <span>Isi pesan dan fotonya masuk ke Riwayat insiden yang dipilih sebagai entri <b>Dari WhatsApp</b>. PIC insiden diberi tahu.</span>
      <div>
        <span className="p-cap" style={{ display: 'block' }}>{message.group} · {senderLabel(message)} · {message.at.slice(11, 16)} WIB</span>
        {shorten(message.text)}
      </div>
      <div className="p-field">
        <span className="p-lbl">Insiden<span className="p-req">*</span></span>
        <label className="p-input">
          <Icon name="search" size={16} />
          <input
            aria-label="Cari insiden" placeholder="Cari nomor atau judul insiden" value={picked ? picked.no : q}
            onChange={(e) => { setSel(null); setQ(e.target.value); }}
            style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }}
          />
        </label>
        <div className="p-pop" role="listbox" aria-label="Insiden yang bisa ditautkan" style={{ position: 'static', width: '100%' }}>
          <span className="p-cap" style={{ display: 'block', padding: '8px 14px 4px' }}>Menunggu pemeriksaan atau Dalam penanganan · WK Andalas Darat dulu, lalu terbaru</span>
          {list.length === 0 && <span className="p-cap" style={{ display: 'block', padding: '8px 14px' }}>Tidak ada insiden yang cocok.</span>}
          {list.map((i) => (
            <button
              key={i.no} type="button" role="option" aria-selected={sel === i.no} className="p-opt"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 14px', width: '100%', border: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left', background: sel === i.no ? 'var(--action-subtle-bg)' : 'transparent' }}
              onClick={() => setSel(i.no)}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="p-mono">{i.no}</span>
                  <span className="p-tag t-info">{STATUS_LABEL[i.status]}</span>
                  {i.severity && <span className={'p-tag ' + SEV_TAG_CLS[i.severity]}><span className="dot"></span>{SEV_LABEL[i.severity]}</span>}
                </span>
                <b>{i.title}</b>
                <span className="p-cap">Kejadian {formatWibFull(i.occurredAt)}</span>
              </span>
              {sel === i.no && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
        <span className="p-help">Insiden yang sudah ditutup tidak muncul. Untuk kejadian baru, pakai Jadikan draf laporan.</span>
      </div>
    </Dialog>
  );
}

/** Dialog "Lepas tautan pesan?" (Pejabat): alasan wajib, min. 10 karakter. */
export function UnlinkDialog({ message, onCancel, onConfirm }: { message: WaMessage; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= MIN_UNLINK_REASON;
  const tooShort = reason.length > 0 && !ok;
  return (
    <Dialog
      id="lt-t" title="Lepas tautan pesan?" onClose={onCancel}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="p-btn p-btn-destructive" aria-disabled={!ok} disabled={!ok} onClick={() => ok && onConfirm(reason.trim())}>Lepas tautan</button>
        </>
      }
    >
      <div>
        <span className="p-cap" style={{ display: 'block' }}>{message.group} · {senderLabel(message)} · {formatWibFull(message.at)}</span>
        {shorten(message.text)}
      </div>
      <ul>
        <li>Pesan kembali ke kotak masuk Pemantauan WhatsApp dengan status <b>Baru</b>.</li>
        <li>Entri di Riwayat tidak dihapus; diberi tanda <b>Tautan dilepas</b>.</li>
        <li>Foto dari pesan tetap tersimpan di insiden dengan tanda yang sama.</li>
      </ul>
      <div className="p-field">
        <label className="p-lbl" htmlFor="lt-r">Alasan<span className="p-req">*</span></label>
        <textarea
          id="lt-r" className={'p-input p-area' + (tooShort ? ' err' : '')} maxLength={MAX_UNLINK_REASON} placeholder="Kenapa tautan ini keliru?"
          style={{ minHeight: 64, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
          value={reason} onChange={(e) => setReason(e.target.value)}
        />
        <span className="p-help row">
          <span style={tooShort ? { color: 'var(--error-ink)' } : undefined}>{tooShort ? 'Tulis alasan minimal 10 karakter.' : 'Minimal 10 karakter. Tercatat di Riwayat dan jejak audit.'}</span>
          <span>{reason.length}/{MAX_UNLINK_REASON}</span>
        </span>
      </div>
    </Dialog>
  );
}
