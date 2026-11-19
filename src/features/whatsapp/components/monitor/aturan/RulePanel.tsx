// Panel samping editor aturan (board V2-31 Aturan bawaan, V2-32 Aturan baru): nama, Sumber, Pengirim, 1 Abaikan bila, 2 Tangkap bila, Coba.
import { useId, useState } from 'react';
import type { WaGroup, WaRule, WaRuleCond } from '@/services/types';
import { testRule } from '@/services/mock/waRules';
import { deleteRule, saveRule } from '@/services/mock/workflow.wamon';
import { run } from '../shared';
import { TagInput } from './TagInput';
import { KINDS, extraNote, keyMode, keywords, selectedKinds, setKinds, withKeywords } from './ruleModel';

const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true" focusable="false"><path d={d} /></svg>
);

export const PRESETS: { name: string; rule: Partial<WaRule> }[] = [
  { name: 'Prioritas kata kunci', rule: { priority: true, suggestKind: 'insiden', capture: { containsAny: ['hilang', 'dipotong', 'kebakaran', 'mencurigakan'] } } },
  { name: 'LAPSIT rutin', rule: { priority: false, suggestKind: 'kerawanan', capture: { startsWith: ['lapsit'] } } },
];

function CondSection({ kind, c, builtin, onChange }: { kind: 'ignore' | 'capture'; c: WaRuleCond; builtin?: boolean; onChange: (c: WaRuleCond) => void }) {
  const uid = useId();
  const lid = `${uid}-kw`;
  const mode = keyMode(c);
  const sel = selectedKinds(c);
  const note = extraNote(c);
  const ignore = kind === 'ignore';
  const toggle = (k: string) => {
    const on = sel.includes(k);
    if (on && sel.length === 1) return; // minimal satu jenis
    onChange(setKinds(c, on ? sel.filter((x) => x !== k) : KINDS.map((x) => x.key).filter((x) => x === k || sel.includes(x))));
  };
  return (
    <details className={`wa-sec wa-sec--${kind}`} open>
      <summary>
        <span className="wa-step">{ignore ? 1 : 2}</span>
        <span style={{ flex: '1 1 0%', minWidth: 0 }}>
          <b>{ignore ? 'Abaikan bila' : 'Tangkap bila'}</b>
          <small>{ignore ? 'Diperiksa dulu. Bila cocok, aturan ini tidak menangkap pesannya.' : 'Bila tidak diabaikan di langkah 1.'}</small>
        </span>
        <svg className="wa-sec__chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="wa-sec__body">
        {!ignore && builtin && (
          <div className="pr-note"><Ico d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5" /><span>Kosongkan keyword dan centang semua jenis agar aturan bawaan menangkap semua pesan yang tidak diabaikan di langkah 1.</span></div>
        )}
        <div className="pr-field">
          <span className="pr-label" id={lid}>Berisi keyword</span>
          <div role="radiogroup" aria-label="Cara mencocokkan" className="pr-quick">
            <button type="button" role="radio" aria-checked={mode === 'any'} onClick={() => onChange(withKeywords(c, 'any', keywords(c)))}>Salah satu keyword (ATAU)</button>
            <button type="button" role="radio" aria-checked={mode === 'all'} onClick={() => onChange(withKeywords(c, 'all', keywords(c)))}>Semua keyword (DAN)</button>
          </div>
          <TagInput labelId={lid} words={keywords(c)} onChange={(w) => onChange(withKeywords(c, mode, w))} />
          {!ignore && <p className="pr-help">Tekan Enter untuk menambah. Huruf besar dan kecil sama. Dicocokkan per kata utuh; pakai “tanda kutip” untuk frasa dan * untuk awalan (demonstra* cocok dengan demonstrasi, demonstran). Kosong: semua pesan dari sumber ini.</p>}
          {note && <p className="pr-help">Syarat lanjutan: {note}.</p>}
        </div>
        <div className="pr-field" role="group" aria-labelledby={`${uid}-jt`} aria-describedby={`${uid}-jh`}>
          <span className="pr-label" id={`${uid}-jt`}>Jenis pesan<span aria-hidden="true" className="pr-req">*</span></span>
          <div className="pr-chipset">
            {KINDS.map((k) => {
              const on = sel.includes(k.key);
              return (
                <button key={k.key} type="button" className="pr-chip-opt wa-type" aria-pressed={on} onClick={() => toggle(k.key)}>
                  {on && <Ico d="M20 6 9 17l-5-5" size={14} />}{k.label}
                </button>
              );
            })}
          </div>
          <p id={`${uid}-jh`} className="pr-help">Semua jenis pesan, termasuk kartu kontak.</p>
        </div>
      </div>
    </details>
  );
}

export function RulePanel({ rule, isNew, groups, onClose }: { rule: WaRule; isNew: boolean; groups: WaGroup[]; onClose: () => void }) {
  const [r, setR] = useState<WaRule>(rule);
  const [err, setErr] = useState('');
  const [sample, setSample] = useState('');
  const [srcMode, setSrcMode] = useState<'all' | 'some'>(rule.capture.groupIds?.length ? 'some' : 'all');
  const [sndMode, setSndMode] = useState<'all' | 'some'>(rule.capture.senders?.length ? 'some' : 'all');
  const [fc, setFc] = useState(String(rule.followUp?.count ?? 0));
  const [fm, setFm] = useState(String(rule.followUp?.minutes ?? 5));
  const uid = useId();
  const nameId = 'wa-rule-name';
  const t = sample.trim() ? testRule(r, sample) : null;

  const setFollow = (c: string, m: string) => {
    setFc(c);
    setFm(m);
    const cn = Number(c) || 0;
    setR((x) => ({ ...x, followUp: cn > 0 ? { count: cn, minutes: Number(m) || 5 } : undefined }));
  };
  const save = () => {
    const e = run((s) => saveRule(s, { ...r, name: r.name.trim() }));
    if (e) setErr(e);
    else onClose();
  };
  const remove = () => {
    const e = run((s) => deleteRule(s, r.id));
    if (e) setErr(e);
    else onClose();
  };
  const setCap = (c: WaRuleCond) => setR({ ...r, capture: c });
  const pickSrc = (mode: 'all' | 'some') => {
    setSrcMode(mode);
    if (mode === 'all') setCap({ ...r.capture, groupIds: undefined });
  };
  const pickSnd = (mode: 'all' | 'some') => {
    setSndMode(mode);
    if (mode === 'all') setCap({ ...r.capture, senders: undefined });
  };

  return (
    <>
      <div className="asis-scrim" onClick={onClose} />
      <dialog open aria-labelledby="wa-rule-title" className="pr-sidepanel wa-panel wa-scope" style={{ position: 'fixed', zIndex: 100 }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
        <div className="pr-sidepanel__head">
          <div style={{ flex: '1 1 0%', minWidth: 0 }}>
            <div className="wa-panel-head">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <h2 id="wa-rule-title">{isNew ? 'Tambah aturan' : rule.name}</h2>
                <span className="pr-help">{isNew ? 'Aturan pemantauan baru' : 'Aturan pemantauan · versi 1'}</span>
              </div>
              <button type="button" role="switch" aria-checked={r.enabled} className="wa-switch" onClick={() => setR({ ...r, enabled: !r.enabled })}>Aktif <span aria-hidden="true" className="pr-switch" /></button>
            </div>
          </div>
          <button type="button" className="pr-close" aria-label="Tutup panel" onClick={onClose}><Ico d="M18 6 6 18M6 6l12 12" /></button>
        </div>
        <div className="pr-sidepanel__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pr-field">
              <label htmlFor={nameId} className="pr-label">Nama aturan<span aria-hidden="true" className="pr-req">*</span></label>
              <input id={nameId} aria-invalid={!!err} aria-describedby={`${nameId}-hint`} className="pr-input" maxLength={60} value={r.name} disabled={r.builtin} autoFocus={!r.builtin} onChange={(e) => { setR({ ...r, name: e.target.value }); setErr(''); }} />
              {r.builtin && <p id={`${nameId}-hint`} className="pr-help">Nama aturan bawaan tidak dapat diubah.</p>}
              {err && <p id={`${nameId}-hint`} className="pr-help wa-err" role="alert">{err}</p>}
              {isNew && (
                <div className="pr-quick" role="group" aria-label="Preset" style={{ marginTop: 8 }}>
                  {PRESETS.map((p) => (
                    <button key={p.name} type="button" onClick={() => { setR({ ...r, ...p.rule, name: r.name || p.name, ignore: r.ignore, capture: { ...r.capture, ...p.rule.capture } } as WaRule); setErr(''); }}>Preset: {p.name}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="wa-two">
              {r.builtin ? (
                <>
                  <div className="pr-field"><span className="pr-label">Sumber</span><span>Semua grup yang dipantau</span><p className="pr-help">Aturan bawaan membaca semua grup yang dipantau.</p></div>
                  <div className="pr-field"><span className="pr-label">Pengirim</span><span>Siapa saja</span></div>
                </>
              ) : (
                <>
                  <fieldset className="pr-field">
                    <legend className="pr-label" style={{ marginBottom: 6 }}>Sumber</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label className="pr-choice"><input type="radio" name={`${uid}-src`} className="pr-radio" checked={srcMode === 'all'} onChange={() => pickSrc('all')} /><span>Semua grup yang dipantau</span></label>
                      <label className="pr-choice"><input type="radio" name={`${uid}-src`} className="pr-radio" checked={srcMode === 'some'} onChange={() => pickSrc('some')} /><span>Grup tertentu</span></label>
                      {srcMode === 'some' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 26 }}>
                          {groups.filter((g) => g.monitored).map((g) => {
                            const on = !!r.capture.groupIds?.includes(g.id);
                            return (
                              <label key={g.id} className="pr-choice"><input type="checkbox" className="pr-check" checked={on} onChange={() => { const cur = r.capture.groupIds ?? []; setCap({ ...r.capture, groupIds: on ? cur.filter((x) => x !== g.id) : [...cur, g.id] }); }} /><span>{g.name}</span></label>
                            );
                          })}
                          {!groups.some((g) => g.monitored) && <span className="pr-help">Belum ada grup yang dipantau.</span>}
                        </div>
                      ) : <p className="pr-help">Satu atau beberapa grup yang dipantau nomor ini.</p>}
                    </div>
                  </fieldset>
                  <fieldset className="pr-field">
                    <legend className="pr-label" style={{ marginBottom: 6 }}>Pengirim</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label className="pr-choice"><input type="radio" name={`${uid}-snd`} className="pr-radio" checked={sndMode === 'all'} onChange={() => pickSnd('all')} /><span>Siapa saja</span></label>
                      <label className="pr-choice"><input type="radio" name={`${uid}-snd`} className="pr-radio" checked={sndMode === 'some'} onChange={() => pickSnd('some')} /><span>Orang tertentu</span></label>
                      {sndMode === 'some' && <TagInput ariaLabel="Nama pengirim" words={r.capture.senders ?? []} placeholder="Ketik nama lalu Enter" onChange={(w) => setCap({ ...r.capture, senders: w.length ? w : undefined })} />}
                    </div>
                  </fieldset>
                </>
              )}
            </div>

            <CondSection kind="ignore" c={r.ignore} builtin={r.builtin} onChange={(c) => setR({ ...r, ignore: c })} />
            <CondSection kind="capture" c={r.capture} builtin={r.builtin} onChange={setCap} />

            <div className="pr-field">
              <label htmlFor="wa-follow" className="pr-label">Pesan lanjutan</label>
              <p className="pr-help" style={{ margin: '0 0 8px' }}>Pesan berikutnya dari pengirim yang sama digabung ke pesan ini, sampai salah satu batas tercapai.</p>
              <div className="v2-sfx-row">
                <label className="v2-sfx-f"><span className="v2-sfx-l">Paling banyak</span><span className="pr-input v2-sfx"><input id="wa-follow" inputMode="numeric" aria-label="Jumlah pesan lanjutan" value={fc} onChange={(e) => setFollow(e.target.value.replace(/\D/g, ''), fm)} /><span className="u">pesan</span></span></label>
                <span className="v2-sfx-or">atau</span>
                <label className="v2-sfx-f"><span className="v2-sfx-l">Dalam waktu</span><span className="pr-input v2-sfx"><input inputMode="numeric" aria-label="Menit" value={fm} onChange={(e) => setFollow(fc, e.target.value.replace(/\D/g, ''))} /><span className="u">menit</span></span></label>
              </div>
              <p id="wa-follow-hint" className="pr-help">Cocok untuk laporan yang diketik dalam beberapa pesan dan foto yang menyusul. Isi 0 pesan bila tidak ingin digabung.</p>
            </div>

            <button type="button" role="switch" aria-checked={r.priority} className="pr-swrow" disabled={r.builtin} aria-label="Prioritas" onClick={() => setR({ ...r, priority: !r.priority })}>
              <span><span className="pr-swrow__label">Prioritas</span><span className="pr-swrow__note">{r.builtin ? 'Aturan bawaan tidak dapat dijadikan prioritas.' : 'Email langsung ke peninjau; pesan di urutan atas.'}</span></span>
              <span aria-hidden="true" className="pr-switch" />
            </button>

            <div className="pr-field">
              <span className="pr-label" id={`${uid}-sk`}>Saran jenis laporan</span>
              <div role="radiogroup" aria-labelledby={`${uid}-sk`} className="pr-quick">
                {([[undefined, 'Tanpa saran'], ['insiden', 'Insiden'], ['kerawanan', 'Kerawanan']] as const).map(([v, l]) => (
                  <button key={l} type="button" role="radio" aria-checked={r.suggestKind === v} onClick={() => setR({ ...r, suggestKind: v })}>{l}</button>
                ))}
              </div>
              <p className="pr-help">Dipakai sebagai pilihan awal saat pesan dijadikan draf laporan.</p>
            </div>

            <div className="pr-field">
              <label className="pr-label" htmlFor="wa-try">Coba</label>
              <div className={`wa-try${t?.match ? ' wa-try--ok' : ''}`}>
                <textarea id="wa-try" className="pr-input" rows={2} placeholder="Tempel contoh pesan, misalnya: Ada unjuk rasa ±40 orang di gerbang SP-3" value={sample} onChange={(e) => setSample(e.target.value)} />
                {t?.match && <span className="wa-try__mark" aria-hidden="true"><Ico d="M20 6 9 17l-5-5" size={14} /></span>}
              </div>
              {t && (
                <ul className={`wa-why ${t.match ? 'wa-why--ok' : 'wa-why--no'}`} role="status">
                  <li>{t.match ? 'Cocok' : 'Tidak cocok'}: {t.reason}</li>
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="pr-sidepanel__foot">
          <div className="wa-panel-foot">
            <span>{!isNew && !r.builtin && <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={remove}>Hapus aturan</button>}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={onClose}>Batal</button>
              <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={save}>Simpan aturan</button>
            </span>
          </div>
        </div>
      </dialog>
    </>
  );
}
