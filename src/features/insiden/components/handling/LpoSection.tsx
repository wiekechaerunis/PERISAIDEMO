// Bagian "Produksi hilang (LPO)" di Data penutupan (ADJ-12; board LPOSec, LPOm-TerisiAI). Opsional; terpisah dari kerugian langsung
// dan tidak mengubah keparahan. Jalan utama: unggah laporan produksi → AI mengisi saran bertanda "AI · Perlu dicek" (mock deterministik);
// jalan kedua: Isi manual. Tidak ada yang tersimpan sebelum Simpan / Ajukan penutupan.
import { useRef, useState } from 'react';
import type { LpoData } from '@/services/types';
import { formatRupiah } from '@/lib/format';
import { extLabel, formatSize } from '../../logic/attachments';

/** Harga minyak acuan per bulan (US$/bbl), diatur Admin SKK. ASSUMPTION: nilai contoh board (Okt 2026 = 70). */
export const OIL_PRICE_USD = 70;

/** Volume dan nilai minyak: produksi normal × lama berhenti × (persen turun) × harga. */
export function lpoCalc(l: LpoData): { volume: number | null; value: number | null } {
  if (l.kind !== 'minyak') return { volume: l.volumeBbl ?? null, value: l.valueUsd ?? null };
  if (!l.normalBblPerDay || !l.stopHours) return { volume: null, value: null };
  const volume = Math.round((l.normalBblPerDay * l.stopHours * (l.dropPct ? l.dropPct / 100 : 1)) / 24);
  const price = l.priceUsd ?? OIL_PRICE_USD;
  return { volume, value: volume * price };
}

/** Teks baca (Data penutupan, Ditutup), mis. "50 bbl minyak · US$3.500 · sumber: …" atau "Belum dihitung". */
export function lpoText(l: LpoData): string {
  if (l.choice === 'belum') return 'Belum dihitung · bisa diisi lewat Koreksi data';
  const c = lpoCalc(l);
  const unit = l.kind === 'gas' ? 'MMSCF gas' : 'bbl minyak';
  const parts = [
    c.volume !== null ? `${c.volume} ${unit}` : null,
    c.value !== null ? `US${c.value.toLocaleString('id-ID')}` : null,
    l.source ? `sumber: ${l.source}` : null,
    l.aiFields?.length ? `${l.aiFields.length} isian dari AI` : null,
  ];
  return parts.filter(Boolean).join(' · ') || 'Ada';
}

/** Isian LPO yang kurang (menahan Ajukan penutupan bila Ada). */
export function lpoMissing(l?: LpoData): string[] {
  if (!l || l.choice !== 'ada') return [];
  const m: string[] = [];
  if (!l.source?.trim()) m.push('Sumber angka');
  if (!l.files?.length) m.push('Dokumen pendukung');
  return m;
}

const CHOICES: [LpoData['choice'], string][] = [['tidak', 'Tidak ada'], ['ada', 'Ada'], ['belum', 'Belum dihitung']];
const AiTag = () => <span className="p-tag t-info" style={{ height: 18, fontSize: 11, marginLeft: 6 }}>AI · Perlu dicek</span>;
const num = (v: string) => (v.replace(/\D/g, '') ? Number(v.replace(/\D/g, '')) : null);

interface Props {
  value?: LpoData;
  onChange: (v: LpoData) => void;
  /** lama berhenti dari dampak (jam) */
  stopHours: number | null;
  /** kurs IDR per USD (tanggal kejadian) */
  kurs: number;
  showErrors?: boolean;
}

export function LpoSection({ value, onChange, stopHours, kurs, showErrors }: Props) {
  const l: LpoData = value ?? { choice: 'tidak' };
  const [manual, setManual] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<LpoData>) => onChange({ ...l, ...p });
  const ai = (f: string) => (l.aiFields ?? []).includes(f);
  const upload = (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    // mock AI: dokumen terbaca → jenis, produksi normal, sumber angka; harga tidak ada di dokumen → harga acuan
    set({
      kind: 'minyak', normalBblPerDay: 200, stopHours: l.stopHours ?? stopHours, priceUsd: OIL_PRICE_USD,
      source: `${f.name.replace(/\.[^.]+$/, '')}, hal. 2`,
      files: [...(l.files ?? []), { name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }],
      aiFields: ['kind', 'normalBblPerDay', 'source'],
    });
  };
  const viaAi = (l.aiFields ?? []).length > 0;
  const form = l.choice === 'ada' && (viaAi || manual || !!l.kind);
  const calc = lpoCalc(l);
  const miss = showErrors ? lpoMissing(l) : [];
  return (
    <section className="p-field" aria-label="Produksi hilang (LPO)" style={{ gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>
        Produksi hilang (LPO) <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span>
        <span className="p-tag t-muted" style={{ height: 18, fontSize: 11, marginLeft: 6 }}>Usulan · menunggu SKK</span>
      </span>
      <span className="p-help">Produksi minyak atau gas yang hilang karena operasi berhenti. Terpisah dari kerugian langsung dan tidak mengubah keparahan.</span>
      <div className="in-chips" role="radiogroup" aria-label="Produksi hilang">
        {CHOICES.map(([k, t]) => (
          <button key={k} type="button" role="radio" className="p-chip" aria-checked={l.choice === k} aria-pressed={l.choice === k} onClick={() => set({ choice: k })}>{t}</button>
        ))}
      </div>
      {l.choice === 'tidak' && (
        <span className="p-cap">Pilih Ada bila insiden ini menghentikan atau menurunkan produksi minyak atau gas. Bila Ada, Anda akan diminta mengunggah laporan produksi sebagai dasar angkanya.</span>
      )}
      {l.choice === 'belum' && (
        <span className="p-cap">Penutupan tetap bisa diajukan. Isi setelah dokumennya ada, lewat Koreksi data pada insiden yang sudah ditutup.</span>
      )}
      <input ref={file} type="file" hidden aria-label="Pilih laporan produksi" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      {l.choice === 'ada' && !form && (
        <div className="p-drop" role="group" aria-label="Unggah laporan produksi">
          <b>Unggah laporan produksi</b>
          <span className="p-cap">Laporan harian produksi atau berita acara gangguan operasi. PDF, Excel, atau foto · maks. 10 MB</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => file.current?.click()}>Pilih file</button>
            <span className="p-cap">AI membaca dokumen dan mengisi isian di bawah</span>
          </span>
          <button type="button" className="p-link" onClick={() => { setManual(true); set({ kind: 'minyak', stopHours: l.stopHours ?? stopHours, priceUsd: OIL_PRICE_USD }); }}>Isi manual</button>
        </div>
      )}
      {form && (
        <div className="lk-stack" style={{ gap: 12 }}>
          {(l.files ?? []).map((f) => (
            <div className="p-file" key={f.name}>
              <span className="fi">{extLabel(f.name)}</span>
              <div className="grow"><b>{f.name}</b><span className="p-cap">{formatSize(f.sizeKb)} · tersimpan sebagai lampiran</span></div>
            </div>
          ))}
          {viaAi && (
            <span className="p-cap">AI mengisi {(l.aiFields ?? []).length} isian dari dokumen. Periksa angkanya sebelum menyimpan. Harga tidak ada di dokumen, jadi memakai harga acuan.</span>
          )}
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis produksi{ai('kind') && <AiTag />}</span>
            <div className="in-chips" role="radiogroup" aria-label="Jenis produksi">
              {(['minyak', 'gas'] as const).map((k) => (
                <button key={k} type="button" role="radio" className="p-chip" aria-checked={l.kind === k} aria-pressed={l.kind === k} onClick={() => set({ kind: k })}>{k === 'minyak' ? 'Minyak' : 'Gas'}</button>
              ))}
            </div>
          </div>
          {l.kind === 'minyak' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Produksi normal<span className="p-req">*</span>{ai('normalBblPerDay') && <AiTag />}</span>
                <span className="p-input"><input aria-label="Produksi normal" inputMode="numeric" value={l.normalBblPerDay ?? ''} onChange={(e) => set({ normalBblPerDay: num(e.target.value) })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /><span className="affix">bbl/hari</span></span>
              </label>
              <label className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Lama berhenti<span className="p-req">*</span></span>
                <span className="p-input"><input aria-label="Lama berhenti" inputMode="numeric" value={l.stopHours ?? ''} onChange={(e) => set({ stopHours: num(e.target.value) })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /><span className="affix">jam</span></span>
                <span className="p-cap">Dari dampak. Ubah bila berbeda dari dokumen.</span>
              </label>
              <label className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Harga minyak<span className="p-req">*</span></span>
                <span className="p-input"><input aria-label="Harga minyak" inputMode="numeric" value={l.priceUsd ?? ''} onChange={(e) => set({ priceUsd: num(e.target.value) })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /><span className="affix">US$/bbl</span></span>
                <span className="p-cap">Harga acuan bulan kejadian, diatur Admin SKK.</span>
              </label>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <label className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Volume hilang<span className="p-req">*</span></span>
                <span className="p-input"><input aria-label="Volume gas hilang" inputMode="numeric" value={l.volumeBbl ?? ''} onChange={(e) => set({ volumeBbl: num(e.target.value) })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /><span className="affix">MMSCF</span></span>
              </label>
              <label className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Nilai<span className="p-req">*</span></span>
                <span className="p-input"><input aria-label="Nilai gas hilang" inputMode="numeric" value={l.valueUsd ?? ''} onChange={(e) => set({ valueUsd: num(e.target.value) })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /><span className="affix">US$</span></span>
              </label>
            </div>
          )}
          <label className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sumber angka<span className="p-req">*</span>{ai('source') && <AiTag />}</span>
            <span className={'p-input' + (miss.includes('Sumber angka') ? ' err' : '')}><input aria-label="Sumber angka" maxLength={200} value={l.source ?? ''} onChange={(e) => set({ source: e.target.value })} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }} /></span>
            <span className="p-cap">Dari fungsi mana angka produksi ini berasal.</span>
          </label>
          {l.kind === 'minyak' && (
            <dl className="lk-kv1" style={{ gridTemplateColumns: '120px minmax(0, 1fr)' }}>
              <dt>Volume hilang</dt><dd>{calc.volume !== null ? `${calc.volume} bbl` : '—'}</dd>
              <dt>Nilai</dt><dd>{calc.value !== null ? `US$${calc.value.toLocaleString('id-ID')} ≈ ${formatRupiah(calc.value * kurs)}` : '—'}</dd>
            </dl>
          )}
          {!l.files?.length && (
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => file.current?.click()}>Unggah dokumen</button>
          )}
          <span className={miss.length ? 'p-help err' : 'p-help'}>Wajib minimal 1 dokumen dan sumber angka sebelum Ajukan penutupan.</span>
        </div>
      )}
    </section>
  );
}
