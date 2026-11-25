import { useEffect, useRef, useState } from 'react';

// S1 tombol periode di AppBar. Ditambahkan 25 Nov (masukan PM): di desain tombolnya statis.
// Data demo hanya Semester I 2026, jadi periode lain tampil sebagai opsi tetapi belum bisa dipilih.

const OPTS: { g: string; items: { n: string; ok: boolean }[] }[] = [
  { g: 'Semester', items: [{ n: 'Semester I 2026', ok: true }, { n: 'Semester II 2025', ok: false }, { n: 'Semester I 2025', ok: false }] },
  { g: 'Kuartal', items: [{ n: 'Kuartal II 2026', ok: false }, { n: 'Kuartal I 2026', ok: false }] },
  { g: 'Tahun', items: [{ n: 'Tahun 2025', ok: false }] },
];

export function PeriodSelect() {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState('Semester I 2026');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.type === 'mousedown' && ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="p-input"
        aria-label="Periode"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ height: 36, border: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
      >
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink-muted)' }}>
          <path d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />
        </svg>
        {sel}
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="p-pop db-lvpop db-fsel db-period" role="listbox" aria-label="Periode">
          {OPTS.map((grp) => (
            <div key={grp.g}>
              <p className="hd">{grp.g}</p>
              {grp.items.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  role="option"
                  aria-selected={sel === o.n}
                  aria-disabled={!o.ok}
                  className="row"
                  onClick={() => {
                    if (!o.ok) return;
                    setSel(o.n);
                    setOpen(false);
                  }}
                >
                  <span className="tx">
                    <span className="nm">{o.n}</span>
                    {!o.ok && <span className="p-cap">Data demo hanya Semester I 2026</span>}
                  </span>
                  {sel === o.n && (
                    <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
