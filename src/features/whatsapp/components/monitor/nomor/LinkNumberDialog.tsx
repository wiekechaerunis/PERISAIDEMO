// Dialog Tautkan nomor WhatsApp (papan V2-23c): langkah 1 data nomor, langkah 2 pindai QR atau kode pairing.
import { useEffect, useId, useState } from 'react';
import { useDemoStore } from '@/services/mock/store';
import { WA_MAX_NUMBERS } from '@/services/types';
import { createNumber, releaseNumber, relinkNumber } from '@/services/mock/workflow.wamon';
import { PAIR_CODE, run } from '../shared';
import { Ic, P } from './icons';
import { V2Dialog } from './V2Dialog';

function QrArt({ seed }: { seed: number }) {
  const cells = Array.from({ length: 169 }, (_, i) => ((i * 7 + seed * 13 + (i % 13) * seed) % 5) < 2);
  return (
    <svg viewBox="0 0 13 13" width="148" height="148" role="img" aria-label="Kode QR simulasi" className="nomor-qr">
      {cells.map((on, i) => on && <rect key={i} x={i % 13} y={Math.floor(i / 13)} width="1" height="1" fill="currentColor" />)}
    </svg>
  );
}

/** `relinkId`: tautkan ulang nomor yang sudah ada (langsung ke langkah 2). */
export function LinkNumberDialog({ onClose, relinkId }: { onClose: () => void; relinkId?: string }) {
  const numbers = useDemoStore((s) => s.waNumbers);
  const uid = useId();
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'qr' | 'kode'>('qr');
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState<string | null>(relinkId ?? null);
  const [tick, setTick] = useState(0);
  const [expired, setExpired] = useState(false);
  const [code, setCode] = useState(false);
  const linked = id ? numbers.find((n) => n.id === id) : undefined;
  const connected = linked?.status === 'terhubung';
  const full = !relinkId && numbers.length >= WA_MAX_NUMBERS;

  useEffect(() => {
    if (!relinkId) return;
    const e = run((s) => relinkNumber(s, relinkId));
    if (e) setErr(e);
    // tautkan ulang dimulai sekali saat dialog dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id || connected) return;
    const qr = setInterval(() => setTick((t) => t + 1), 20_000);
    const exp = setTimeout(() => setExpired(true), 160_000);
    return () => { clearInterval(qr); clearTimeout(exp); };
  }, [id, connected]);

  const start = () => {
    let newId = '';
    const e = run((s) => {
      const r = createNumber(s, label, phone);
      if (r.ok) newId = r.id;
      return r;
    });
    if (e) setErr(e); else { setErr(''); setId(newId); setCode(method === 'kode'); }
  };
  const cancel = () => { if (id && !connected && !relinkId) run((s) => releaseNumber(s, id, 'Batal menautkan')); onClose(); };
  const used = `${numbers.length} dari ${WA_MAX_NUMBERS} nomor terpakai`;

  if (!id) {
    return (
      <V2Dialog
        title="Tautkan nomor WhatsApp" subtitle="Langkah 1 dari 2 · Data nomor" onClose={onClose} labelId={`${uid}-t`} note={used}
        footer={<><button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={onClose}>Batal</button><button type="button" className="pr-btn pr-btn--primary pr-btn--md" disabled={!c1 || !c2 || full} onClick={start}>Lanjut</button></>}
      >
        {full && <div className="pr-note nomor-err" role="alert"><Ic d={P.info} size={16} /><div>Kuota nomor habis ({WA_MAX_NUMBERS}/{WA_MAX_NUMBERS}). Lepas satu nomor untuk menautkan yang baru.</div></div>}
        <div className="pr-field">
          <label htmlFor={`${uid}-label`} className="pr-label">Label nomor<span aria-hidden="true" className="pr-req">*</span></label>
          <input id={`${uid}-label`} aria-invalid="false" aria-describedby={`${uid}-hint`} className="pr-input" maxLength={60} placeholder="Posko Duri" value={label} onChange={(e) => setLabel(e.target.value)} />
          <p id={`${uid}-hint`} className="pr-help">Nama yang dikenali tim Anda, misalnya lokasi posko.</p>
        </div>
        <div className="pr-field">
          <label htmlFor={`${uid}-num`} className="pr-label">Nomor WhatsApp<span aria-hidden="true" className="pr-req">*</span></label>
          <input id={`${uid}-num`} aria-invalid={err ? 'true' : 'false'} className="pr-input" inputMode="tel" autoComplete="off" maxLength={20} placeholder="0812 7000 1111" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {err && <p className="pr-help nomor-err-text" role="alert">{err}</p>}
        </div>
        <fieldset className="pr-field">
          <legend className="pr-label mb-1.5">Cara menautkan</legend>
          <div className="wa-method">
            <label>
              <input className="pr-radio v2-hide" type="radio" name={`${uid}-method`} checked={method === 'qr'} onChange={() => setMethod('qr')} />
              <span className="v2-mi"><Ic d={P.qr} size={20} /></span>
              <span><b>Pindai kode QR</b><small>Buka WhatsApp di HP › Perangkat tertaut › Tautkan perangkat.</small></span>
            </label>
            <label>
              <input className="pr-radio v2-hide" type="radio" name={`${uid}-method`} checked={method === 'kode'} onChange={() => setMethod('kode')} />
              <span className="v2-mi"><Ic d={P.key} size={20} /></span>
              <span><b>Kode pairing 8 huruf</b><small>Bila HP tidak bisa memindai, misalnya kamera rusak.</small></span>
            </label>
          </div>
        </fieldset>
        <div className="flex flex-col gap-2.5">
          <label className="pr-choice"><input className="pr-check" type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} /><span>Nomor ini milik organisasi saya.</span></label>
          <label className="pr-choice"><input className="pr-check" type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} /><span>Anggota grup yang akan dipantau sudah diberi tahu bahwa pesannya dapat direkam.</span></label>
        </div>
      </V2Dialog>
    );
  }

  return (
    <V2Dialog
      title="Tautkan nomor WhatsApp" subtitle={`Langkah 2 dari 2 · ${connected ? 'Terhubung' : code ? 'Kode pairing' : 'Pindai kode QR'}`} onClose={cancel} labelId={`${uid}-t`} note={used}
      footer={connected
        ? <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={onClose}>Selesai</button>
        : <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={cancel}>Batal</button>}
    >
      {err && <p className="pr-help nomor-err-text" role="alert">{err}</p>}
      {connected && <div className="pr-note nomor-ok" role="status"><Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" size={16} /><div><b>Terhubung.</b> {linked?.label} siap memantau grup.</div></div>}
      {!connected && (
        <>
          {expired ? (
            <div className="pr-note nomor-err" role="alert"><Ic d={P.info} size={16} /><div>Kode kedaluwarsa. Tutup dialog ini lalu tautkan lagi.</div></div>
          ) : code ? (
            <div className="pr-field"><span className="pr-label">Kode tautan</span><b className="nomor-code">{PAIR_CODE}</b><span className="pr-help">Masukkan kode ini di ponsel: Perangkat tertaut, Tautkan dengan nomor telepon.</span></div>
          ) : (
            <div className="nomor-pair"><QrArt seed={tick} /><span className="pr-help">Pindai kode ini dari ponsel {linked?.phone}. Kode berganti tiap 20 detik. Maks. 4 perangkat tertaut per ponsel.</span></div>
          )}
          {!expired && <div><button type="button" className="pr-btn pr-btn--secondary pr-btn--sm" onClick={() => setCode(!code)}>{code ? 'Tampilkan QR' : 'Tautkan dengan kode'}</button></div>}
          <span className="pr-help" role="status">Menunggu dipindai dari panel Simulasi WhatsApp.</span>
        </>
      )}
    </V2Dialog>
  );
}
