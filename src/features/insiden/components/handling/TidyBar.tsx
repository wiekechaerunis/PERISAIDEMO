// "Rapikan dengan AI" (INS-04 FR-INS-72, 73; board P16, P16s1, P16s2): tombol ghost di bawah isian, usulan inline, Pakai/Batal, Kembalikan.
// Tulisan pengguna tidak berubah sampai Pakai. Usulan yang mengubah fakta tidak ditampilkan (banner caution).
import { useEffect, useState } from 'react';
import { MIN_TIDY, rapikan } from '@/services/ai/rapikan';

const STAR = 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z';
const CLOSE = 'M18 6 6 18M6 6l12 12';
const Svg = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}><path d={d} /></svg>
);

interface Props {
  /** nama isian untuk toast dan aria-label, mis. "Ringkasan penanganan" */
  label: string;
  value: string;
  /** batas karakter untuk penghitung; kosong = tanpa penghitung */
  max?: number;
  onApply: (text: string) => void;
  /** bila ada, penghitung karakter tampil di kanan */
  counter?: string;
  className?: string;
}

export function TidyBar({ label, value, max, onApply, counter, className }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const [clean, setClean] = useState(false);
  const [undo, setUndo] = useState<{ orig: string; applied: string } | null>(null);
  const ready = value.trim().length >= MIN_TIDY;

  // Usulan basi bila teks diubah setelah dibuat.
  useEffect(() => { setSuggestion(null); setClean(false); }, [value]);

  const ask = () => {
    setWarn(false);
    setClean(false);
    const r = rapikan(value);
    if (!r.ok) { setSuggestion(null); setWarn(true); }
    else if (r.suggestion === value.trim()) { setSuggestion(null); setClean(true); }
    else setSuggestion(r.suggestion);
  };
  const use = () => {
    if (suggestion == null) return;
    setUndo({ orig: value, applied: suggestion });
    onApply(suggestion);
    setSuggestion(null);
  };
  const showUndo = undo && value === undo.applied;

  return (
    <div className={'tidy ' + (className ?? '')}>
      <div className="p-help row">
        <span>
          <button
            type="button" className="p-btn p-btn-ghost p-btn-sm tidy-btn" aria-label={`Rapikan dengan AI: ${label}`}
            aria-disabled={!ready || undefined} disabled={!ready} title={ready ? undefined : `Tulis minimal ${MIN_TIDY} karakter untuk dirapikan.`} onClick={ask}
          ><Svg d={STAR} size={14} />Rapikan dengan AI</button>
          {!ready && <span className="p-cap tidy-tip" role="tooltip"> Tulis minimal {MIN_TIDY} karakter untuk dirapikan.</span>}
        </span>
        {counter != null && <span>{counter}{max ? `/${max}` : ''}</span>}
      </div>
      {suggestion != null && (
        <div className="tidy-box" role="region" aria-label={`Usulan tulisan rapi: ${label}`}>
          <div className="tidy-hd"><span className="p-tag t-info" style={{ height: 20, fontSize: 11 }}>AI</span><b>Usulan tulisan rapi</b><span className="p-cap">Angka, tanggal, nama, dan lokasi sama dengan tulisan Anda.</span></div>
          <p className="tidy-tx">{suggestion}</p>
          <div className="tidy-act">
            <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={use}>Pakai</button>
            <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={() => setSuggestion(null)}>Batal</button>
          </div>
          <span className="p-cap">Tulisan Anda tidak berubah sampai Anda memilih Pakai.</span>
        </div>
      )}
      {clean && <span className="p-cap" role="status">Tulisan Anda sudah rapi. Tidak ada usulan.</span>}
      {warn && (
        <div className="in-bn caution sm" role="status">
          <div className="body">Usulan tidak ditampilkan karena ada angka atau nama yang berubah. Periksa tulisan Anda secara manual.</div>
          <button type="button" className="p-ibtn ghost" style={{ width: 24, height: 24 }} aria-label="Tutup pesan" onClick={() => setWarn(false)}><Svg d={CLOSE} size={14} /></button>
        </div>
      )}
      {showUndo && (
        <div className="tidy-done" role="status">
          <span>{label} dirapikan</span>
          <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={() => { onApply(undo.orig); setUndo(null); }}>Kembalikan</button>
        </div>
      )}
    </div>
  );
}
