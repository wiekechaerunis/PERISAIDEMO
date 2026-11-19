// Isian kata kunci berbentuk chip (board V2-31/32: `wa-tagin` + `wa-word`). Enter atau koma menambah; Backspace pada isian kosong menghapus yang terakhir.
import { useState } from 'react';
import { splitWords } from './ruleModel';

const X = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12" /></svg>;

export function TagInput({ labelId, words, onChange, placeholder = 'Ketik lalu Enter', ariaLabel }: { labelId?: string; words: string[]; onChange: (w: string[]) => void; placeholder?: string; ariaLabel?: string }) {
  const [draft, setDraft] = useState('');
  const commit = (raw: string) => {
    const add = splitWords(raw).filter((w) => !words.some((x) => x.toLowerCase() === w.toLowerCase()));
    if (add.length) onChange([...words, ...add]);
    setDraft('');
  };
  return (
    <div className="pr-input wa-tagin">
      {words.map((w) => (
        <span key={w} className="wa-word">{w}<button type="button" aria-label={`Hapus ${w}`} onClick={() => onChange(words.filter((x) => x !== w))}>{X}</button></span>
      ))}
      <input
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : ariaLabel}
        placeholder={words.length ? '' : placeholder}
        value={draft}
        onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (draft.trim()) commit(draft); }
          else if (e.key === 'Backspace' && !draft && words.length) onChange(words.slice(0, -1));
        }}
        onBlur={() => { if (draft.trim()) commit(draft); }}
      />
    </div>
  );
}
