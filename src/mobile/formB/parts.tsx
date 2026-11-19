// Potongan bersama layar mobile formB (board M4, M7, M8, MS07): ikon, kepala langkah, sheet, toast, menu "Aksi lain".
import { useState, type ReactNode } from 'react';

/** Ikon inline dengan path persis board (stroke dari CSS .p-ic). */
export function Pi({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d={d} />
    </svg>
  );
}

export const D = {
  back: 'M19 12H5M12 19l-7-7 7-7',
  prev: 'M15 18l-6-6 6-6',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  close: 'M18 6 6 18M6 6l12 12',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  check: 'M20 6 9 17l-5-5',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  retry: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5',
  open: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
} as const;

/** Kepala langkah (`.stp2`): "3/4 Lampiran · Berikutnya: Ringkasan" + empat batang. */
export function StepHead({ step, name, next }: { step: 1 | 2 | 3 | 4; name: string; next: string }) {
  return (
    <div className="stp2" role="group" aria-label={`Langkah ${step} dari 4: ${name}`}>
      <div className="hd">
        <span className="n">{step}/4</span>
        <b>{name}</b>
        <span className="nx">{next}</span>
      </div>
      <div className="bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n < step ? 'done' : n === step ? 'cur' : ''}></span>
        ))}
      </div>
    </div>
  );
}

/** Sheet bawah tanpa judul bawaan (scrim + `.sheet` + `.grab`), persis board M5b/MS07. */
export function Sheet({ onClose, role = 'dialog', label, labelledBy, children }: { onClose?: () => void; role?: 'dialog' | 'menu'; label?: string; labelledBy?: string; children: ReactNode }) {
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role={role} aria-modal={role === 'dialog' ? true : undefined} aria-label={label} aria-labelledby={labelledBy}>
        <div className="grab" aria-hidden="true"></div>
        {children}
      </div>
    </>
  );
}

/** Baris menu di sheet "Aksi lain" (ikon `.in-mi` + judul + keterangan). */
export function MenuRow({ icon, title, sub, danger, disabled, onClick }: { icon: string; title: string; sub?: string; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', minHeight: 56, padding: '8px 16px', border: 0, background: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer', color: danger ? 'var(--error-ink)' : 'var(--ink)', opacity: disabled ? 0.45 : undefined }}
    >
      <span className="in-mi" style={{ color: 'inherit' }}><Pi d={icon} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <b>{title}</b>
        {sub && <span className="p-cap">{sub}</span>}
      </span>
    </button>
  );
}

/** Toast mengambang (`.toastm`). `bottom` mengganti jarak dari bawah (layar tanpa bar bawah). */
export function Toast({ text, tone, onClose, bottom }: { text: string; tone?: 'ok' | 'err'; onClose?: () => void; bottom?: number }) {
  return (
    <div className="toastm" style={bottom !== undefined ? { bottom } : undefined}>
      <div className={tone === 'err' ? 'p-toast err' : 'p-toast'} role={tone === 'err' ? 'alert' : 'status'}>
        <span className="ti"><Pi d={tone === 'err' ? D.close : D.check} size={12} /></span>
        <span className="msg">{text}</span>
        {onClose && (
          <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Tutup notifikasi" onClick={onClose}>
            <Pi d={D.close} size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Menu "Aksi lain" form lapor: Simpan draf (toast) dan Hapus draf (konfirmasi). Dipakai langkah 3 dan 4. */
export function useDraftMenu({ savedAt, onDelete }: { savedAt: string; onDelete: () => void }) {
  const [menu, setMenu] = useState<0 | 1 | 2>(0);
  const [saved, setSaved] = useState(false);
  const actions = (
    <>
      <span className="p-tag t-draft" style={{ marginRight: 4 }}>Draf</span>
      <button type="button" className="ib44" aria-label="Aksi lain" aria-haspopup="menu" onClick={() => { setMenu(1); setSaved(false); }}>
        <Pi d={D.more} size={20} />
      </button>
    </>
  );
  const close = () => setMenu(0);
  const overlay = (
    <>
      {menu === 1 && (
        <Sheet role="menu" label="Aksi lain" onClose={close}>
          <MenuRow icon={D.save} title="Simpan draf" sub={`Terakhir disimpan ${savedAt}`} onClick={() => { setMenu(0); setSaved(true); }} />
          <MenuRow icon={D.trash} title="Hapus draf" sub="Draf dan lampirannya dihapus permanen" danger onClick={() => setMenu(2)} />
          <div className="sf"><button type="button" className="p-btn p-btn-secondary" onClick={close}>Batal</button></div>
        </Sheet>
      )}
      {menu === 2 && (
        <Sheet labelledBy="sh-t">
          <div className="sb">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--error-bg)', color: 'var(--error-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Pi d={D.warn} />
              </span>
              <b id="sh-t" style={{ fontSize: 17, lineHeight: '24px' }}>Hapus draf ini?</b>
            </div>
            <span style={{ color: 'var(--ink-subtle)' }}>Isian dan lampiran yang sudah tersimpan ikut terhapus dan tidak bisa dikembalikan.</span>
          </div>
          <div className="sf">
            <button type="button" className="p-btn p-btn-destructive" onClick={() => { setMenu(0); onDelete(); }}>Hapus draf</button>
            <button type="button" className="p-btn p-btn-secondary" onClick={close}>Batal</button>
          </div>
        </Sheet>
      )}
      {saved && <Toast text="Draf disimpan." />}
    </>
  );
  return { actions, overlay };
}

/** Bar AI (`.ma-bar`): ringkasan hasil periksa AI. Tanpa tautan: sheet AI Copilot dimiliki domain AI. */
export function AiBar({ children }: { children: ReactNode }) {
  return (
    <div className="ma-bar" role="status">
      <svg className="cp-face" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 22, height: 22 }}>
        <rect x="1.5" y="4" width="21" height="16" rx="7" fill="#fff" stroke="var(--border-control)" strokeWidth="1.6" />
        <rect x="4.2" y="6.6" width="15.6" height="10.8" rx="5" fill="var(--ink)" />
        <path d="M7.6 12q1.3-1.6 2.6 0M13.8 12q1.3-1.6 2.6 0" stroke="var(--action)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M10.6 14.4q1.4 0.9 2.8 0" stroke="var(--action)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
