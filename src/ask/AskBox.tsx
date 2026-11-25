/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseQuery, withoutChip, type Chip, type Filters, type Parsed, type Role } from './parseQuery';
import { answer, suggestions, type Answer } from './answer';

// S6 kolom "Tanya data" di kartu Temuan AI: bisa diketik, jawaban dihitung dari filter dashboard (tanpa LLM/API).
// Panel jawaban berupa popover (.p-pop) di bawah kolom, sehingga tinggi kartu tidak berubah.

const chipKey = (c: Chip) => `${c.kind}:${c.key}`;

/** Filter dashboard yang sedang terpasang → Filters. */
function activeOf(ctx: any): Filters {
  if (!ctx) return {};
  const f: Filters = {};
  if (ctx.skk && ctx.z && ctx.z !== 'nat' && ctx.z !== 'own') f.w = ctx.z;
  if (ctx.loc) f.area = ctx.loc;
  if (ctx.kat != null && ctx.kat < ctx.catN) f.cat = ctx.kat;
  if (ctx.lv && ctx.lv.some((x: number) => !x)) f.lv = ctx.lv.map((x: number, i: number) => (x ? i : -1)).filter((i: number) => i >= 0);
  if (ctx.kk) f.kk = ctx.kk;
  // periode dashboard (tombol Periode) ikut membatasi jawaban
  if (ctx.per) f.range = ctx.per;
  return f;
}

/** Filters → patch state dashboard (bar filter). Bulan dari ketikan tidak dipasang; periode diatur tombol Periode. */
function patchOf(f: Filters, skk: boolean, areaW?: string) {
  return {
    z: f.area ? (skk ? areaW : 'own') : f.w ?? (skk ? 'nat' : 'own'),
    loc: f.area ?? null,
    kat: f.cat ?? null,
    lv: [0, 1, 2, 3, 4].map((i) => (!f.lv || f.lv.includes(i) ? 1 : 0)),
    kk: f.kk ?? null,
  };
}

const scrollTo = (sel: string) => {
  const el = document.querySelector(sel);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

export function AskBox({ v }: { v: any }) {
  const role: Role = v.isSkk ? 'skk' : 'kkks';
  const sug = suggestions(role);
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<Answer | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef(0);

  // debounce 250 ms untuk "Dipahami sebagai"
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(text), 250);
    return () => window.clearTimeout(t);
  }, [text]);

  // tutup dengan klik di luar
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const parsedOf = (t: string, rm: string[]): Parsed | null => {
    if (!t.trim()) return null;
    const p = parseQuery(t, role);
    let filters = p.filters;
    for (const c of p.chips) if (rm.includes(chipKey(c))) filters = withoutChip({ ...p, filters }, c);
    return { ...p, filters, chips: p.chips.filter((c) => !rm.includes(chipKey(c))) };
  };
  const parsed = useMemo(() => parsedOf(debounced, removed), [debounced, removed, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (t: string, rm: string[] = removed) => {
    const p = parsedOf(t, rm);
    if (!p) return;
    setOpen(true);
    setBusy(true);
    setAns(null);
    window.clearTimeout(timer.current);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => {
      const a = answer(p, role, activeOf(v.askCtx));
      setBusy(false);
      setAns(a);
      if (a.zoom) {
        v.askApply({ z: role === 'skk' ? a.zoom.w : 'own', loc: a.zoom.area });
        window.setTimeout(() => scrollTo('.db-mapc'), 50);
        setOpen(false); // halaman pindah ke peta: popover ditutup supaya tidak menutupi peta
        return;
      }
      inputRef.current?.focus();
    }, reduced ? 0 : 500);
  };

  const pick = (s: string) => {
    setText(s);
    setDebounced(s);
    setRemoved([]);
    run(s, []);
  };

  const applyFilters = (f: Filters) => {
    const areaW = f.area ? (v.heat ?? []).find((h: any) => h.area?.id === f.area)?.area?.w : undefined;
    v.askApply(patchOf(f, role === 'skk', areaW ?? (f.area ? f.w : undefined)));
    setOpen(false);
  };

  const removeChip = (c: Chip) => {
    const rm = [...removed, chipKey(c)];
    setRemoved(rm);
    if (ans) run(text, rm);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const showSug = open && !text.trim() && !ans && !busy;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (showSug && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setSel((i) => (e.key === 'ArrowDown' ? (i + 1) % sug.length : (i - 1 + sug.length) % sug.length));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSug && sel >= 0) pick(sug[sel]);
      else run(text);
    }
  };

  const showSug = !text.trim() && !ans && !busy;
  const chips = parsed?.chips ?? [];

  return (
    <div className="db-askbox" ref={boxRef}>
      <div className="ask">
        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink-muted)' }}>
          <path d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
        </svg>
        <input
          ref={inputRef}
          className="ph"
          aria-label="Tanya data"
          aria-expanded={open}
          aria-controls="db-ask-pop"
          placeholder={String(v.askPh ?? '').replace(/^Tanya data, mis\. /, 'Tanya data, mis. ')}
          value={text}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setRemoved([]);
            setAns(null);
            setSel(-1);
            setOpen(true);
          }}
          onKeyDown={onKey}
        />
        <button type="button" className="go" aria-label="Jalankan pertanyaan" onClick={() => run(text)} disabled={!text.trim()}>
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="p-pop db-askpop" id="db-ask-pop">
          {showSug && (
            <div className="sec">
              <span className="hd">Coba tanyakan</span>
              <div className="chips" role="listbox" aria-label="Saran pertanyaan">
                {sug.map((s, i) => (
                  <button key={s} type="button" role="option" aria-selected={sel === i} className={`p-chip sug${sel === i ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!showSug && chips.length > 0 && (
            <div className="sec understood">
              <span className="hd">Dipahami sebagai:</span>
              <div className="chips">
                {chips.map((c) => (
                  <span key={chipKey(c)} className="p-chip got">
                    {c.label}
                    {c.kind !== 'kelompok' && c.kind !== 'ukuran' && (
                      <button type="button" aria-label={`Hapus ${c.label}`} onMouseDown={(e) => e.preventDefault()} onClick={() => removeChip(c)}>
                        <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12 }}><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="ans" aria-live="polite">
            {busy && (
              <div className="busy">
                <span className="p-cap">Menghitung...</span>
                <span className="sk" />
              </div>
            )}
            {ans && <AnswerView a={ans} onApply={applyFilters} onPick={pick} onRemove={removeChip} onClose={() => setOpen(false)} v={v} />}
          </div>

          <p className="ft">Demo · jawaban dihitung dari filter, bukan AI.</p>
        </div>
      )}
    </div>
  );
}

function AnswerView({ a, onApply, onPick, onRemove, onClose, v }: { a: Answer; onApply: (f: Filters) => void; onPick: (s: string) => void; onRemove: (c: Chip) => void; onClose: () => void; v: any }) {
  return (
    <div className="res">
      <p className="kal">{a.kalimat}</p>
      {a.items && (
        <ol className="rank">
          {a.items.map((it) => (
            <li key={it.label}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onApply(it.apply)} title="Pasang sebagai filter">
                <span className="nm">{it.label}</span>
                <span className="val">{it.value}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {a.monthNote && <p className="p-cap note">{a.monthNote}</p>}
      {a.kind === 'zero' && a.lastChip && (
        <div className="acts">
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => onRemove(a.lastChip!)}>Hapus {a.lastChip.label}</button>
        </div>
      )}
      {a.kind === 'unknown' && a.suggestions && (
        <div className="chips">
          {a.suggestions.map((s) => (
            <button key={s} type="button" className="p-chip sug" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(s)}>{s}</button>
          ))}
        </div>
      )}
      {a.kind === 'ok' && (a.link || a.apply || a.highlight) && (
        <div className="acts">
          {a.link && <Link className="lnk" to={a.link}>Lihat daftar →</Link>}
          {a.intent === 'banding' && a.highlight ? (
            <button
              type="button"
              className="p-btn p-btn-secondary p-btn-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (a.apply) onApply(a.apply);
                v.askApply({ hi: a.highlight!.months, m: 'n' });
                onClose();
                window.setTimeout(() => scrollTo('.db-bars'), 50);
              }}
            >
              Sorot di Tren
            </button>
          ) : (
            a.apply && a.intent !== 'peringkat' && (
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => onApply(a.apply!)}>
                Terapkan ke dashboard
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
