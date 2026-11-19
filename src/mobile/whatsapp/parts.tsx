// Potongan bersama form WhatsApp mobile (board M9, M10, MS04): menu ⋯ (Simpan draf / Hapus draf) dan kerangka langkah.
import { demoNow } from '@/services/mock/clock';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { deleteWaDraft } from '@/services/mock/workflow.wa';
import { TOAST_DELETED, WA_ROUTES } from '@/features/whatsapp/logic/draft';

const ICON_SAVE = 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8';
const ITEM = { display: 'flex', gap: 12, alignItems: 'center', width: '100%', minHeight: 56, padding: '8px 16px', border: 0, background: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer' } as const;

/** Tombol ⋯ di bar atas + sheet "Aksi lain" + konfirmasi hapus draf + toast "Draf disimpan." */
export function useWaDraftActions(draftId: string): { actions: ReactNode; overlay: ReactNode } {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<0 | 1 | 2>(0);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const save = () => {
    setMenu(0);
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2500);
  };
  const remove = () => {
    setMenu(0);
    useDemoStore.getState().decide((s) => deleteWaDraft(s, draftId));
    navigate(WA_ROUTES.inbox, { state: { toast: TOAST_DELETED } });
  };
  const actions = (
    <>
      <span className="p-tag t-draft" style={{ marginRight: 4 }}>Draf</span>
      <button type="button" className="ib44" aria-label="Aksi lain" aria-haspopup="menu" onClick={() => { setMenu(1); setSaved(false); }}>
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 20, height: 20 }}>
          <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      </button>
    </>
  );
  const overlay = (
    <>
      {menu === 1 && (
        <>
          <div className="scrim" onClick={() => setMenu(0)}></div>
          <div className="sheet" role="menu" aria-label="Aksi lain">
            <div className="grab" aria-hidden="true"></div>
            <button type="button" role="menuitem" onClick={save} style={{ ...ITEM, color: 'var(--ink)' }}>
              <span className="in-mi" style={{ color: 'inherit' }}><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d={ICON_SAVE} /></svg></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b>Simpan draf</b><span className="p-cap">Terakhir disimpan {demoNow().slice(11, 16)} WIB</span></span>
            </button>
            <button type="button" role="menuitem" onClick={() => setMenu(2)} style={{ ...ITEM, color: 'var(--error-ink)' }}>
              <span className="in-mi" style={{ color: 'inherit' }}><Icon name="trash" size={16} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b>Hapus draf</b><span className="p-cap">Draf dan lampirannya dihapus permanen</span></span>
            </button>
            <div className="sf"><button type="button" className="p-btn p-btn-secondary" onClick={() => setMenu(0)}>Batal</button></div>
          </div>
        </>
      )}
      {menu === 2 && (
        <>
          <div className="scrim"></div>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
            <div className="grab" aria-hidden="true"></div>
            <div className="sb">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--error-bg)', color: 'var(--error-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name="warn" size={16} />
                </span>
                <b id="sh-t" style={{ fontSize: 17, lineHeight: '24px' }}>Hapus draf ini?</b>
              </div>
              <span style={{ color: 'var(--ink-subtle)' }}>Isian dan lampiran yang sudah tersimpan ikut terhapus dan tidak bisa dikembalikan.</span>
            </div>
            <div className="sf">
              <button type="button" className="p-btn p-btn-destructive" onClick={remove}>Hapus draf</button>
              <button type="button" className="p-btn p-btn-secondary" onClick={() => setMenu(0)}>Batal</button>
            </div>
          </div>
        </>
      )}
      {saved && (
        <div className="toastm">
          <div className="p-toast" role="status"><span className="ti"><Icon name="check" size={12} /></span><span className="msg">Draf disimpan.</span></div>
        </div>
      )}
    </>
  );
  return { actions, overlay };
}

/** Footer `.foot`: panah "Sebelumnya" + "Berikutnya". */
export function WaFoot({ prevTo, onNext }: { prevTo: string; onNext: () => void }) {
  return (
    <>
      <Link to={prevTo} className="p-btn p-btn-secondary" aria-label="Sebelumnya" style={{ width: 48, padding: 0, justifyContent: 'center' }}>
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}><path d="M15 18l-6-6 6-6" /></svg>
      </Link>
      <button type="button" className="p-btn p-btn-primary" onClick={onNext} style={{ flex: 1, justifyContent: 'center' }}>Berikutnya</button>
    </>
  );
}
