import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { askKind } from '../askKind';

// Kolom "Tanya data" di kartu Temuan AI (board Dashboard-Tanya*). Bisa diketik; jawaban tampil di dalam kartu (v.askOn),
// bukan dropdown. Klik kolom kosong membuka saran; × dan "← Temuan AI" kembali ke temuan. Kelas DS: .db-ai .ask(.on), .clr, .go.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- v dari logika Dashboard hasil generate (tanpa tipe)
export function AskField({ v }: { v: any }) {
  const [text, setText] = useState('');
  const typed = useRef<string | null>(null); // jenis dari pertanyaan yang diketik
  const kind: string = v.askK ?? '';

  // Pertanyaan dari saran/chip: kolom berisi teks pertanyaannya. Pertanyaan yang diketik tetap seperti ditulis.
  useEffect(() => {
    if (!kind) {
      setText('');
      typed.current = null;
    } else if (kind !== 'saran' && typed.current !== kind) {
      setText(v.askTxt);
      typed.current = null;
    }
  }, [kind, v.askTxt]);

  const ask = (q: string) => {
    const k = askKind(q);
    typed.current = k === 'saran' ? null : k;
    v.askApply?.({ ask: k, askAll: false });
  };
  const clear = () => {
    typed.current = null;
    setText('');
    v.askClr?.();
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ask(text);
    } else if (e.key === 'Escape' && v.askOn) {
      e.preventDefault();
      clear();
    }
  };

  return (
    <label className={`ask ${v.askCls ?? ''}`}>
      <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink-muted)' }}>
        <path d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
      </svg>
      <input
        className="ph"
        aria-label="Tanya data"
        placeholder={v.askOn && kind !== 'saran' ? '' : v.askTxt}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onFocus={() => {
          if (!v.askOn && !text) v.askApply?.({ ask: 'saran', askAll: false });
        }}
        onKeyDown={onKey}
      />
      {v.askOn && (
        <button type="button" className="clr" onClick={clear} aria-label="Hapus pertanyaan">
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      <button type="button" className="go" aria-label="Tanyakan" onClick={() => ask(text)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </label>
  );
}
