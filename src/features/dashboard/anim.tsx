import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// D1 (Iterasi 2, disetujui PM 25 Nov): angka beranimasi dari nilai lama ke nilai baru, 400ms ease-out.
// Format tetap sama selama animasi: hanya bilangan pertama di teks yang diinterpolasi ("Rp1,41 M", "63%", "7 hari").

const NUM = /\d+(?:,\d+)?/;
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const parse = (t: string) => {
  const m = NUM.exec(t);
  if (!m) return null;
  const dec = m[0].includes(',') ? m[0].split(',')[1].length : 0;
  return { pre: t.slice(0, m.index), post: t.slice(m.index + m[0].length), n: parseFloat(m[0].replace(',', '.')), dec };
};
const fmt = (p: NonNullable<ReturnType<typeof parse>>, n: number) => p.pre + n.toFixed(p.dec).replace('.', ',') + p.post;

/** Nilai teks yang beranimasi; mengembalikan teks yang sedang tampil. */
export function useAnimatedNumber(text: string, ms = 400): string {
  const [shown, setShown] = useState(text);
  const from = useRef(text);
  useEffect(() => {
    const a = parse(from.current);
    const b = parse(text);
    from.current = text;
    if (!a || !b || a.pre !== b.pre || a.post !== b.post || a.dec !== b.dec || a.n === b.n || reduced()) {
      setShown(text);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(k >= 1 ? text : fmt(b, a.n + (b.n - a.n) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, ms]);
  return shown;
}

/**
 * Teks angka beranimasi. D5: saat nilainya berubah, kartu terdekat yang bertanda data-flash
 * mendapat kilatan outline sekali (600ms).
 */
export function AnimNum({ text }: { text: string | number | null | undefined }) {
  const s = text == null ? '' : String(text);
  const shown = useAnimatedNumber(s);
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const card = ref.current?.closest<HTMLElement>('[data-flash]');
    if (!card || reduced()) return;
    card.classList.remove('db-flash');
    void card.offsetWidth;
    card.classList.add('db-flash');
  }, [s]);
  return <span ref={ref}>{shown}</span>;
}
