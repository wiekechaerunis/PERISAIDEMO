import { useEffect, useRef, useState } from 'react';

// S3 dropdown filter (Wilayah, KKKS, Kategori / Wilayah kerja). Ditambahkan 25 Nov (Iterasi 2b):
// di desain tombolnya statis. Pilihan dan efeknya dari logika (v.fOpts), tutup dengan klik di luar atau Esc.

export type FilterOpt = { n: string; sub?: string; on: boolean; go: () => void };

export function FilterSelect({ f, opts }: { f: { k: string; v: string }; opts: FilterOpt[] }) {
  const [open, setOpen] = useState(false);
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
      <button type="button" className="db-sel" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="k">{f.k}</span>
        <span className="v">{f.v}</span>
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink-muted)' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && opts.length > 0 && (
        <div className="p-pop db-lvpop db-fsel" role="listbox" aria-label={f.k}>
          {opts.map((o, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={o.on}
              className="row"
              onClick={() => {
                o.go();
                setOpen(false);
              }}
            >
              <span className="tx">
                <span className="nm">{o.n}</span>
                {o.sub && <span className="p-cap">{o.sub}</span>}
              </span>
              {o.on && (
                <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
