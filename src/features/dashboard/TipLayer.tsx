import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// E5 (Iterasi 2, disetujui PM 25 Nov): satu komponen tooltip untuk seluruh dashboard.
// Elemen apa pun dengan atribut data-tip mendapat tooltip: muncul setelah 120ms, menempel ke elemen
// (bukan kursor), di atas elemen bila muat, dan tidak keluar dari layar. Baris baru dalam data-tip = baris baru.

type Tip = { text: string; r: DOMRect } | null;

export function TipLayer() {
  const [tip, setTip] = useState<Tip>(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const cur = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const over = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-tip]') ?? null;
      if (el === cur.current) return;
      cur.current = el;
      window.clearTimeout(timer.current);
      setTip(null);
      if (!el || !el.dataset.tip) return;
      timer.current = window.setTimeout(() => setTip({ text: el.dataset.tip!, r: el.getBoundingClientRect() }), 120);
    };
    const hide = () => { cur.current = null; window.clearTimeout(timer.current); setTip(null); };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('scroll', hide, true);
    document.addEventListener('mousedown', hide);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', over);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('mousedown', hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!tip || !box.current) return;
    const b = box.current.getBoundingClientRect();
    const vw = window.innerWidth;
    let left = tip.r.left + tip.r.width / 2 - b.width / 2;
    left = Math.max(8, Math.min(left, vw - b.width - 8));
    let top = tip.r.top - b.height - 8;
    if (top < 8) top = tip.r.bottom + 8;
    setPos({ left, top });
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div ref={box} className="db-tip" role="tooltip" style={pos}>
      {tip.text}
    </div>,
    document.body,
  );
}
