// Potongan bersama form WhatsApp (board I20, I21, I21b, I22): kepala isian dengan chip AI + "Perlu dicek", baris status, pesan asli, kartu Pengajuan.
import { Fragment, useState, type ReactNode } from 'react';
import { SamplePhoto } from './monitor/pesan/PhotoPreview';
import { Icon } from '@/components/ui/Icon';
import { formatWibFull } from '@/lib/format';
import type { WaDraft, WaMessage } from '@/services/types';
import { CHECK_NAMES, aiTitle, needsCheck, pendingChecks, senderInitials, senderLabel } from '../logic/draft';

const CHIP = { height: 20, fontSize: 11, gap: 3, cursor: 'help' } as const;
const OK_BTN = {
  fontSize: 13, fontWeight: 600, gap: 4, display: 'inline-flex', alignItems: 'center', color: 'var(--action-subtle-ink)',
  background: 'var(--action-subtle-bg)', padding: '2px 10px', borderRadius: 'var(--radius-md)',
} as const;

/** Chip "AI" kecil; kutipan dan keyakinan ada di tooltip. */
export function AiChip({ draft, k }: { draft: WaDraft; k: string }) {
  const f = draft.ai[k];
  if (!f) return null;
  return (
    <span className="p-tag t-info" title={aiTitle(f)} style={CHIP}>
      <Icon name="sparkle" size={12} />AI
    </span>
  );
}

interface HeadProps {
  draft: WaDraft;
  /** kunci saran AI; tanpa kunci tampil label biasa */
  k?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  onConfirm?: (key: string) => void;
  id?: string;
}

/** Baris label isian: label, chip AI, lalu "Perlu dicek" + "Sudah sesuai" selama belum dicek. */
export function AiHead({ draft, k, label, required, optional, onConfirm, id }: HeadProps) {
  const pending = !!k && needsCheck(draft, k);
  return (
    <div id={id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minHeight: 20 }}>
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>
        {label}
        {required && <span className="p-req">*</span>}
        {optional && <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}> · opsional</span>}
      </span>
      {k && <AiChip draft={draft} k={k} />}
      {pending && (
        <>
          <span className="p-tag t-caution" style={{ height: 20, fontSize: 11 }}>Perlu dicek</span>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="p-tbtn" onClick={() => onConfirm?.(k)} style={OK_BTN}>
            <Icon name="check" size={14} />Sudah sesuai
          </button>
        </>
      )}
    </div>
  );
}

/** Catatan di bawah stepper: asal draf + ringkasan isian yang perlu dicek, dengan Sebelumnya/Berikutnya untuk menggulir ke isian itu. */
export function StatusNote({ draft, step, intro }: { draft: WaDraft; step: 1 | 2; intro: ReactNode }) {
  const [at, setAt] = useState(0);
  const left = pendingChecks(draft, step);
  const go = (dir: 1 | -1) => {
    const n = (at + dir + left.length) % left.length;
    setAt(n);
    document.getElementById('wa-f-' + left[n])?.scrollIntoView?.({ block: 'center' });
  };
  return (
    <div className="p-note" style={{ alignItems: 'flex-start' }}>
      <Icon name="info" size={18} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span>{intro}</span>
        {draft.aiState === 'ok' && (
          <span role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span className={left.length ? 'p-tag t-caution' : 'p-tag t-ok'} style={{ height: 20, fontSize: 11 }}>{left.length ? 'Perlu dicek' : 'Beres'}</span>
            <span style={{ flex: 1 }}>
              <b style={{ fontWeight: 600 }}>{left.length ? `${left.length} isian perlu dicek:` : 'Semua saran sudah dicek.'}</b>{' '}
              {left.length ? left.map((k) => CHECK_NAMES[k]).join(', ') : 'Lanjutkan ke langkah berikutnya.'}
            </span>
            {left.length > 0 && (
              <>
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => go(-1)}>Sebelumnya</button>
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => go(1)}>Berikutnya</button>
              </>
            )}
          </span>
        )}
      </span>
    </div>
  );
}

/** Banner saat saran AI gagal (negative state IF2, MS04): isian otomatis tetap terisi, sisanya manual. */
export function AiFailedBanner() {
  return (
    <div className="in-bn info" role="status">
      <Icon name="info" size={18} />
      <div className="body"><b>Saran otomatis tidak tersedia.</b> Lengkapi isian secara manual.</div>
    </div>
  );
}

const MARK = { background: 'var(--accent-card-bg)', color: 'inherit', borderRadius: 3, padding: '0 2px' } as const;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Teks pesan dengan bagian yang dipakai AI disorot (hanya kutipan yang benar-benar ada di pesan). */
export function MessageText({ text, draft }: { text: string; draft?: WaDraft }) {
  const srcs = Array.from(new Set(Object.values(draft?.ai ?? {}).map((f) => f.src).filter((s) => s.length > 3 && text.toLowerCase().includes(s.toLowerCase()))));
  if (!srcs.length) return <>{text}</>;
  const re = new RegExp(`(${srcs.map(esc).join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((p, i) => (i % 2 ? <mark key={i} style={MARK}>{p}</mark> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** Kartu "Pesan asli" (langkah 1): pengirim, pesan dengan sorotan, keterangan. */
export function OriginalMessageCard({ message, draft }: { message: WaMessage; draft: WaDraft }) {
  return (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 10 }}><h2 className="p-h2">Pesan asli</h2></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <span className="lk-av">{senderInitials(message)}</span>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <b style={{ fontWeight: 600, fontSize: 13 }}>{senderLabel(message)}</b>
          <span className="p-cap">{message.group} · {message.at.slice(11, 16)} WIB</span>
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)' }}>
        <MessageText text={message.text} draft={draft} />
      </p>
      {draft.aiState === 'ok' && (
        <p className="p-cap" style={{ margin: '8px 0 0 0' }}>
          Bagian yang disorot dipakai AI untuk mengisi saran. Arahkan kursor ke chip <b>AI</b> untuk melihat kutipan dan keyakinannya.
        </p>
      )}
    </section>
  );
}

/** Panel samping "Pesan asli" (dibuka dari tombol "Lihat pesan asli" di samping judul Temuan): semua bubble, sorotan AI, dan foto. */
export function OriginalMessagePanel({ message, draft, onClose }: { message: WaMessage; draft: WaDraft; onClose: () => void }) {
  const bubbles = [{ at: message.at, text: message.text }, ...(message.bubbles ?? [])];
  return (
    <>
      <div className="lk-scrim" onClick={onClose}></div>
      <aside className="lk-side" role="dialog" aria-modal="true" aria-label="Pesan asli" style={{ position: 'fixed', zIndex: 61, maxWidth: '100vw' }}>
        <div className="sh">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 16 }}>Pesan asli</b>
            <span className="p-cap">{message.group} · {message.at.slice(11, 16)} WIB</span>
          </div>
          <button type="button" className="p-ibtn ghost" style={{ width: 32, height: 32 }} aria-label="Tutup panel" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="sb" style={{ overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="lk-av">{senderInitials(message)}</span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <b style={{ fontWeight: 600, fontSize: 13 }}>{senderLabel(message)}</b>
              <span className="p-cap">{bubbles.length} bubble · {message.photos.length} foto</span>
            </span>
          </div>
          {bubbles.map((b) => (
            <div key={b.at + b.text}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)' }}>
                <MessageText text={b.text} draft={draft} />
              </p>
              <span className="p-cap">{b.at.slice(11, 16)} WIB</span>
            </div>
          ))}
          {message.photos.length > 0 && (
            <>
              <span className="p-lbl">Foto ({message.photos.length})</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {message.photos.map((p) => (
                  <figure key={p.id} style={{ margin: 0 }}>
                    <SamplePhoto name={p.name} />
                    <figcaption className="p-cap">{p.name} · {p.sizeKb} KB</figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
          {draft.aiState === 'ok' && (
            <p className="p-cap" style={{ margin: 0 }}>Bagian yang disorot dipakai AI untuk mengisi saran. Arahkan kursor ke chip <b>AI</b> untuk melihat kutipan dan keyakinannya.</p>
          )}
        </div>
      </aside>
    </>
  );
}

/** Kartu "Sumber pesan" (langkah 2): isi pesan + "Pertama dilaporkan". */
export function SourceCard({ message }: { message: WaMessage }) {
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Sumber pesan</h2>
      <div className="in-wa">
        <span className="who">Grup <b>{message.group}</b> · {senderLabel(message)}</span>
        <div className="bub">{message.text}</div>
        <span className="who">{formatWibFull(message.at)} ·{message.photos.length} foto</span>
      </div>
      <div className="in-times">
        <div className="row">
          <span className="k">
            Pertama dilaporkan
            <span className="in-tw">
              <button type="button" className="ib" aria-label="Penjelasan pertama dilaporkan"><Icon name="info" size={15} /></button>
              <span className="in-tip r" role="tooltip">Waktu pesan pertama tentang kejadian ini masuk di grup. Diisi otomatis.</span>
            </span>
          </span>
          <span className="v">{formatWibFull(message.at)}</span>
        </div>
      </div>
    </section>
  );
}

/** Kartu "Pengajuan" di kolom kanan. */
export function SubmissionCard({ no, message, firstReported }: { no: string; message: WaMessage; firstReported?: boolean }) {
  return (
    <section className="p-card">
      <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Pengajuan</h2></div>
      <dl className="lk-kv1">
        <dt>Nomor laporan</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{no}</span></dd>
        <dt>Status</dt><dd><span className="p-tag t-draft">Draf</span></dd>
        {firstReported ? (
          <><dt>Pertama dilaporkan</dt><dd>{formatWibFull(message.at)}</dd></>
        ) : (
          <><dt>Sumber</dt><dd>WhatsApp · {message.group}</dd></>
        )}
        <dt>Diperiksa oleh</dt><dd>Semua Pejabat Berwenang (3)</dd>
      </dl>
    </section>
  );
}

/** Toast kecil dengan tombol tutup (pola `in-toastpos`). */
export function Toast({ text, onClose, tone }: { text: string; onClose?: () => void; tone?: 'err' }) {
  return (
    <div className="in-toastpos">
      <div className={tone === 'err' ? 'p-toast err' : 'p-toast'} role={tone === 'err' ? 'alert' : 'status'}>
        <span className="ti"><Icon name={tone === 'err' ? 'close' : 'check'} size={12} /></span>
        <span className="msg">{text}</span>
        {onClose && (
          <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={onClose}>
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
