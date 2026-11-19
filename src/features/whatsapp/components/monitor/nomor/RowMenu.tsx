// Menu aksi per baris nomor (papan V2-22).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { WaNumber } from '@/services/types';
import { Ic, P } from './icons';

export interface RowMenuActions {
  onRules: () => void;
  onGroups: () => void;
  onRename: () => void;
  onRelink: () => void;
  onSuspend: () => void;
  onResume: () => void;
  onDisconnect: () => void;
}

export function RowMenu({ n, a }: { n: WaNumber; a: RowMenuActions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ right: number; top: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const h = menu.current?.offsetHeight ?? 0;
    const below = r.bottom + 4;
    setPos({ right: Math.max(8, window.innerWidth - r.right), top: below + h > window.innerHeight && r.top - 4 - h > 0 ? r.top - 4 - h : below });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
  }, [open]);

  const item = (icon: string, label: string, fn: () => void, o: { disabled?: boolean; note?: string; danger?: boolean } = {}) => (
    <button type="button" role="menuitem" disabled={o.disabled} className={'pr-opt !items-start !py-2' + (o.danger ? ' pr-opt--danger' : '')} onClick={() => { setOpen(false); fn(); }}>
      <Ic d={icon} className="mt-px" />
      <span className="flex flex-col">{label}{o.note && <span className="pr-opt__note">{o.note}</span>}</span>
    </button>
  );
  const canRelink = n.status === 'terputus' || n.status === 'menunggu';

  return (
    <div className="wa-rowmenu relative inline-flex">
      <button ref={btn} type="button" aria-label={`Aksi ${n.label}`} title="Aksi lainnya" aria-haspopup="menu" aria-expanded={open} aria-controls={id} className="pr-btn pr-btn--subtle pr-btn--sm !px-2" onClick={() => setOpen(!open)}>
        <Ic d={P.dots} />
      </button>
      {open && (
        <div ref={menu} id={id} role="menu" aria-label={`Aksi ${n.label}`} className="pr-menu w-64 text-left" style={{ position: 'fixed', right: pos?.right ?? 8, top: pos?.top ?? -9999, bottom: 'auto' }}>
          {item(P.rules, 'Atur aturan pemantauan', a.onRules)}
          {item(P.groups, 'Lihat grup', a.onGroups)}
          {item(P.edit, 'Ubah label', a.onRename)}
          {item(P.relink, 'Tautkan ulang', a.onRelink, { disabled: !canRelink, note: canRelink ? undefined : 'Hanya bila status Perlu ditautkan ulang' })}
          {n.status === 'terhubung' && item(P.pause, 'Tangguhkan', a.onSuspend)}
          {n.status === 'ditangguhkan' && item(P.play, 'Lanjutkan', a.onResume)}
          <div className="pr-sep" role="separator" />
          {item(P.unplug, 'Putuskan nomor', a.onDisconnect, { danger: true })}
        </div>
      )}
    </div>
  );
}
