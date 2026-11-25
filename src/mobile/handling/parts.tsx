// Bagian bersama layar penanganan mobile (board MP2..MP6): kepala insiden, waktu, kejadian, lampiran, riwayat, sheet, toast.
// Markup disalin dari board `in-m`; data dari store lewat logika desktop.
import { useState, type ReactNode } from 'react';
import type { Incident } from '@/services/types';
import { STATUS_LABEL } from '@/services/types';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { formatWibFull } from '@/lib/format';
import { Ic } from '@/features/insiden/components/review/parts';
import { casualtyText, detailOf, formatDuration, handledText, opsText, registeredAt } from '@/features/insiden/components/detail/detailLogic';
import { extLabel, formatSize } from '@/features/insiden/logic/attachments';
import { HistoryItem } from '@/features/insiden/components/handling/parts';
import { auditEntries, collapseHistory, historyEntries, initialsOf } from '@/features/insiden/logic/handling';
import { jt, partnerLabel } from '@/features/insiden/logic/closure';

export const P = {
  back: 'M19 12H5M12 19l-7-7 7-7',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  up: 'M12 19V5M5 12l7-7 7 7',
  tick: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  plus: 'M12 5v14M5 12h14',
  chevDown: 'm6 9 6 6 6-6',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  cam: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1',
  restart: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  chev: 'm6 9 6 6 6-6',
};

export interface ToastM { text: string; tone?: 'err' }

/** Toast mobile (`.toastm`): hilang otomatis tidak dipakai di demo; ditutup lewat tombol. */
export function ToastLine({ toast, onClose }: { toast: ToastM | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="toastm">
      <div className={toast.tone === 'err' ? 'p-toast err' : 'p-toast'} role={toast.tone === 'err' ? 'alert' : 'status'}>
        <span className="ti"><Ic d={toast.tone === 'err' ? 'M18 6 6 18M6 6l12 12' : 'M20 6 9 17l-5-5'} size={12} /></span>
        <span className="msg">{toast.text}</span>
        <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Tutup notifikasi" onClick={onClose}>
          <Ic d="M18 6 6 18M6 6l12 12" size={15} />
        </button>
      </div>
    </div>
  );
}

/** Sheet bawah persis markup board (grab, `.sb`, `.sf`); judul di dalam `.sb`. */
export function Sheet({ labelId, role = 'dialog', ariaLabel, onClose, children, footer }: {
  labelId?: string; role?: 'dialog' | 'menu'; ariaLabel?: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role={role} aria-modal={role === 'dialog' ? true : undefined} aria-labelledby={labelId} aria-label={ariaLabel}>
        <div className="grab" aria-hidden="true"></div>
        {role === 'menu' ? children : <div className="sb" style={{ overflowY: 'auto' }}>{children}</div>}
        {footer && <div className="sf">{footer}</div>}
      </div>
    </>
  );
}

/** Judul sheet dengan ikon bulat (MP4, MP5, MP6). */
export function SheetTitle({ id, icon, bg, ink, children }: { id: string; icon: string; bg: string; ink: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ width: 32, height: 32, borderRadius: 16, background: `var(${bg})`, color: `var(${ink})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Ic d={icon} size={16} />
      </span>
      <b id={id} style={{ fontSize: 17, lineHeight: '24px' }}>{children}</b>
    </div>
  );
}

export function TopBar({ title, onBack, onMore, moreLabel = 'Aksi lain' }: { title: string; onBack: () => void; onMore?: () => void; moreLabel?: string }) {
  return (
    <div className="top">
      <button type="button" className="ib44" aria-label="Kembali" onClick={onBack}><Ic d={P.back} size={20} /></button>
      <span className="ttl">{title}</span>
      {onMore && <button type="button" className="ib44" aria-label={moreLabel} aria-haspopup="menu" onClick={onMore}><Ic d={P.more} size={20} /></button>}
    </div>
  );
}

/** Baris menu sheet (`role="menuitem"`, 56px). */
export function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick}
      style={{ display: 'flex', gap: 12, alignItems: 'center', minHeight: 56, padding: '8px 16px', textDecoration: 'none', color: 'var(--ink)', background: 'none', border: 0, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
      <span className="in-mi"><Ic d={icon} size={16} /></span><b>{label}</b>
    </button>
  );
}

export function IncHead({ i, extra }: { i: Incident; extra?: ReactNode }) {
  const sev = i.severity;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.no}</span>
      <b style={{ fontSize: 18, lineHeight: '26px' }}>{i.title}</b>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {i.status === 'minta-ditutup' ? (
          <><span className="p-tag t-info">Dalam penanganan</span><span className="p-tag t-caution">Menunggu penutupan</span></>
        ) : i.status === 'ditutup' ? (
          <span className="p-tag t-ok">Ditutup</span>
        ) : (
          <span className="p-tag t-info">{STATUS_LABEL[i.status]}</span>
        )}
        {extra}
        {sev && <span className={`p-tag ${SEV_TAG_CLS[sev]}`}><span className="dot"></span>{SEV_LABEL[sev]}</span>}
      </div>
    </div>
  );
}

export function TimesSec({ i }: { i: Incident }) {
  const reg = registeredAt(i);
  return (
    <div className="sec">
      <div className="in-times">
        <div className="row"><span className="k">Waktu kejadian</span><span className="v">{formatWibFull(i.occurredAt)}</span></div>
        <div className="row"><span className="k">Waktu registrasi</span><span className="v">{formatWibFull(reg)}</span><span className="c">{formatDuration(i.occurredAt, reg)} setelah kejadian</span></div>
      </div>
    </div>
  );
}

export function KejadianSec({ i, partners }: { i: Incident; partners?: boolean }) {
  const d = detailOf(i);
  const names = partnerLabel(i);
  return (
    <div className="sec">
      <h2>Kejadian</h2>
      <dl className="kv">
        <dt>Kategori</dt><dd>{i.category}</dd>
        <dt>Lokasi</dt><dd>{i.location}</dd>
        <dt>Dampak keamanan</dt><dd>{d.securityImpact || i.title}</dd>
        {partners && names.length > 0 ? (
          <><dt>Tim terlibat</dt><dd>{names.map((n) => n.replace(/ \((.+)\)$| · \w+$/, '')).join(', ')}</dd></>
        ) : (
          <><dt>Sudah menangani</dt><dd>{handledText(d)} (menurut pelapor)</dd></>
        )}
      </dl>
      <div className="stats">
        <div><span className="k">Operasi</span><b>{opsText(d)}</b></div>
        <div><span className="k">Korban</span><b>{casualtyText(d)}</b></div>
        <div><span className="k">Kerugian</span><b>{d.lossIdr ? jt(d.lossIdr) : 'Belum diisi'}</b></div>
      </div>
    </div>
  );
}

export function LampiranSec({ i }: { i: Incident }) {
  const files = detailOf(i).attachments;
  if (!files.length) return null;
  return (
    <div className="sec">
      <div className="hd"><h2>Lampiran · {files.length} file</h2><span className="lk-lock" style={{ fontSize: 12 }}><Ic d={P.lock} size={14} />Terkunci sampai diverifikasi</span></div>
      <div className="p-files">
        {files.map((f) => (
          <div className="p-file" key={f.name}>
            <span className="fi">{extLabel(f.name)}</span>
            <div className="grow">
              <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
              <span className="p-cap">{formatSize(f.sizeKb)}</span>
              {f.caption && <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}><span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {f.caption}</span>}
            </div>
            <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Pratinjau"><Ic d={P.eye} size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Strip PIC + Tenggat (`.pt`, MP4..MP6). */
export function PtStrip({ i, dueCls, dueText }: { i: Incident; dueCls?: string; dueText?: string }) {
  const due = i.handleDueAt;
  return (
    <div className="pt">
      <div>
        <span className="k">PIC</span>
        {i.pic ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="in-av" style={{ width: 20, height: 20, fontSize: 9 }}>{initialsOf(i.pic)}</span>
            <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.pic}</b>
          </span>
        ) : <b>Belum ada</b>}
      </div>
      <div>
        <span className="k">Tenggat</span>
        <b>{due ? `${shortDay(due)}, ${due.slice(11, 16)}` : 'Belum ditetapkan'}</b>
        {dueCls && dueText && <span className={dueCls}><Ic d={P.clock} size={13} />{dueText}</span>}
      </div>
    </div>
  );
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const shortDay = (iso: string) => `${parseInt(iso.slice(8, 10), 10)} ${MON[parseInt(iso.slice(5, 7), 10) - 1]}`;

/** Riwayat (MP2): `ol.p-tl.in-kr` + "Tampilkan N entri sebelumnya"; "Jejak audit" membuka sheet. */
export function RiwayatSec({ i, due }: { i: Incident; due?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [audit, setAudit] = useState(false);
  const entries = historyEntries(i, due);
  const { shown, hidden } = collapseHistory(entries, expanded);
  return (
    <div className="sec">
      <div className="hd">
        <h2>Riwayat · {entries.length}</h2>
        <button type="button" className="lk-alink" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, cursor: 'pointer' }} onClick={() => setAudit(true)}>Jejak audit</button>
      </div>
      <ol className="p-tl in-kr" aria-label="Riwayat insiden">
        {shown.map((e) => <HistoryItem key={e.key} e={e} />)}
      </ol>
      {hidden > 0 && (
        <button type="button" className="in-more" style={{ minHeight: 44 }} onClick={() => setExpanded(true)}>
          <Ic d={P.chevDown} size={14} />Tampilkan {hidden} entri sebelumnya
        </button>
      )}
      {audit && (
        <Sheet labelId="audit-t" onClose={() => setAudit(false)} footer={<button type="button" className="p-btn p-btn-secondary" onClick={() => setAudit(false)}>Tutup</button>}>
          <b id="audit-t" style={{ fontSize: 17, lineHeight: '24px' }}>Jejak audit</b>
          <span className="p-cap">Semua perubahan data dan akses, dengan nilai lama dan baru</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditEntries(i, due).map((r, n) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 13 }}>{r.text}</b>
                <span className="p-cap">{r.meta}</span>
                {r.note && <span className="p-cap">{r.note}</span>}
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

export const WARN_ERR = (text: string) => (
  <span className="p-help err" role="alert"><Ic d={P.warn} size={14} />{text}</span>
);
