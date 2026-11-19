// "Apa saja yang terdampak?" + grup isian per sumbu (board I13, S01). Hanya grup terpilih yang tampil.
import { Icon } from '@/components/ui/Icon';
import type { ReportDraft } from '../logic/draft';
import { AiTag, FieldError } from './AiTag';
import {
  AXES, DATA_OPTS, KB, OPS, SEBARAN, bareInput, toggleCasualty, type Step2Errors,
} from './step2Data';

interface Props {
  draft: ReportDraft;
  onPatch: (p: Partial<ReportDraft>) => void;
  aiFilled: string[];
  errors: Step2Errors;
  /** sembunyikan pemilih "Apa saja yang terdampak?" (form WhatsApp menampilkannya sendiri dengan chip AI) */
  hideAxisPicker?: boolean;
}

const digits = (s: string) => s.replace(/\D/g, '');
const Divider = () => <div className="lk-divider" style={{ margin: '4px 0' }}></div>;
const Group = ({ t }: { t: string }) => <span className="p-lbl" style={{ color: 'var(--ink-muted)' }}>{t}</span>;

export function ImpactAxes({ draft, onPatch, aiFilled, errors, hideAxisPicker }: Props) {
  const ai = (f: string) => aiFilled.includes(f);
  const has = (a: ReportDraft['axes'][number]) => draft.axes.includes(a);

  const toggleAxis = (a: ReportDraft['axes'][number]) => {
    const on = has(a);
    const axes = on ? draft.axes.filter((x) => x !== a) : [...draft.axes, a];
    const p: Partial<ReportDraft> = { axes };
    // pilihan awal sama dengan board: Setempat / Data terbatas
    if (!on && a === 'ling' && !draft.envNote) p.envNote = SEBARAN[0];
    if (!on && a === 'data' && !draft.dataNote) p.dataNote = DATA_OPTS[0];
    onPatch(p);
  };

  const hoursLabel = draft.ops === 'berhenti' ? 'Berapa lama operasi berhenti?' : 'Berapa lama operasi terganggu?';

  return (
    <>
      {!hideAxisPicker && (
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Apa saja yang terdampak?<span className="p-req">*</span></span>
        <div className="in-chips" role="group" aria-label="Yang terdampak">
          {AXES.map(([k, l]) => (
            <button key={k} type="button" className="p-chip" aria-pressed={has(k)} onClick={() => toggleAxis(k)}>{l}</button>
          ))}
        </div>
        <span className="p-help">Boleh lebih dari satu. Isian lanjutan muncul sesuai pilihan; yang tidak dipilih dianggap tidak terdampak.</span>
        <FieldError text={errors.axes} />
      </div>
      )}

      {has('prop') && (
        <>
          <Divider />
          <Group t="Properti dan operasi" />
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>
              Perkiraan kerugian <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span><AiTag on={ai('lossIdr')} />
            </span>
            <span className="p-input" style={{ maxWidth: 320 }}>
              <span className="affix">Rp</span>
              <input
                className="num" style={{ ...bareInput, textAlign: 'right' }} inputMode="numeric" aria-label="Perkiraan kerugian"
                value={draft.lossIdr ? draft.lossIdr.toLocaleString('id-ID') : ''} placeholder="0"
                onChange={(e) => { const d = digits(e.target.value).slice(0, 15); onPatch({ lossIdr: d ? Number(d) : null }); }}
              />
            </span>
            <span className="p-help">Isi dalam Rupiah. Sistem mengonversi ke USD dengan kurs tanggal kejadian untuk menghitung saran keparahan.</span>
          </div>
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi operasi<span className="p-req">*</span><AiTag on={ai('ops')} /></span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="in-chips" role="radiogroup" aria-label="Dampak operasional">
                {OPS.map(([k, l]) => (
                  <button
                    key={k} type="button" role="radio" className="p-chip" aria-pressed={draft.ops === k} aria-checked={draft.ops === k}
                    onClick={() => onPatch(k === 'tidak' ? { ops: k, opsHours: null, ongoing: false } : { ops: k })}
                  >{l}</button>
                ))}
              </div>
              {draft.ops && draft.ops !== 'tidak' && (
                <div style={{ flexBasis: '100%', display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-subtle)' }}>
                  <span className="p-lbl" style={{ color: 'var(--ink)' }}>{hoursLabel}<span className="p-req">*</span></span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={'p-input' + (errors.opsHours ? ' err' : '')} style={{ width: 140 }}>
                      <input
                        className="num" style={{ ...bareInput, textAlign: 'right' }} inputMode="numeric" aria-label={hoursLabel}
                        value={draft.opsHours ?? ''} placeholder="—"
                        onChange={(e) => { const d = digits(e.target.value).slice(0, 4); onPatch({ opsHours: d ? Number(d) : null }); }}
                      />
                      <span className="affix">jam</span>
                    </span>
                    <button
                      type="button" className="in-checked" role="checkbox" aria-checked={draft.ongoing}
                      onClick={() => onPatch({ ongoing: !draft.ongoing })} style={{ fontSize: 13, color: 'var(--ink)' }}
                    >
                      <span className={draft.ongoing ? 'p-check on' : 'p-check'}><Icon name="check" size={11} /></span>
                      Masih berlangsung saat melapor
                    </button>
                  </div>
                  <span className="p-help">
                    {draft.ongoing ? 'Isi lama sampai saat ini. Perbarui setelah operasi pulih.' : 'Dari mulai terganggu sampai pulih. Perkiraan boleh.'}
                  </span>
                  <FieldError text={errors.opsHours} />
                </div>
              )}
            </div>
            <FieldError text={errors.ops} />
          </div>
        </>
      )}

      {has('man') && (
        <>
          <Divider />
          <Group t="Manusia" />
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi korban<span className="p-req">*</span></span>
            <div className="in-chips" role="group" aria-label="Kondisi korban" style={{ flexWrap: 'wrap' }}>
              {KB.map(([k, l]) => (
                <button
                  key={k} type="button" className="p-chip" aria-pressed={k in draft.casualties}
                  onClick={() => onPatch({ casualties: toggleCasualty(draft.casualties, k) })}
                >{l}</button>
              ))}
            </div>
            <span className="p-help">Boleh lebih dari satu, lalu isi jumlah orangnya. Belum diketahui tidak bisa digabung dengan pilihan lain.</span>
            <FieldError text={errors.casualties} />
            {KB.some(([k]) => k !== 'belum' && k in draft.casualties) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {KB.filter(([k]) => k !== 'belum' && k in draft.casualties).map(([k, l]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
                    <span className="p-input" style={{ width: 140 }}>
                      <input
                        className="num" style={{ ...bareInput, textAlign: 'right' }} inputMode="numeric" aria-label={`Jumlah orang · ${l}`}
                        value={draft.casualties[k] ?? 0}
                        onChange={(e) => { const d = digits(e.target.value).slice(0, 4); onPatch({ casualties: { ...draft.casualties, [k]: d ? Number(d) : 0 } }); }}
                      />
                      <span className="affix">orang</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {has('ling') && (
        <>
          <Divider />
          <Group t="Lingkungan pengamanan" />
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebaran dampak<span className="p-req">*</span></span>
            <div className="in-chips" role="radiogroup" aria-label="Sebaran dampak">
              {SEBARAN.map((l) => (
                <button key={l} type="button" role="radio" className="p-chip" aria-pressed={draft.envNote === l} onClick={() => onPatch({ envNote: l })}>{l}</button>
              ))}
            </div>
            <span className="p-help">Seberapa luas gangguan ini dirasakan atau jadi perhatian: hanya di lokasi, se-kabupaten/provinsi, nasional, atau sampai luar negeri.</span>
          </div>
        </>
      )}

      {has('data') && (
        <>
          <Divider />
          <Group t="Data dan informasi" />
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Seberapa besar data yang dicuri atau bocor?<span className="p-req">*</span></span>
            <div className="in-chips" role="radiogroup" aria-label="Data dan informasi">
              {DATA_OPTS.map((l) => (
                <button key={l} type="button" role="radio" className="p-chip" aria-pressed={draft.dataNote === l} onClick={() => onPatch({ dataNote: l })}>{l}</button>
              ))}
            </div>
            <span className="p-help">Mis. dokumen, peta, atau data sistem yang diambil atau tersebar.</span>
          </div>
        </>
      )}
    </>
  );
}
