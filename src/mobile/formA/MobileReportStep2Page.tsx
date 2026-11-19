// Board: M2-Kejadian (langkah 2), MA5 (tombol AI di bar bawah, saran AI), MS14 Kategori, MS15 Jenis. Perilaku sama dengan ReportStep2Page desktop.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { MobileShell } from '../ui/MobileShell';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { useCopilotStore } from '@/features/insiden/copilot/copilotStore';
import { CopilotFace } from '@/features/insiden/copilot/parts';
import { suggestedSeverityOf } from '@/features/insiden/logic/submit';
import { STEP_ROUTES, stepsOf } from '@/features/insiden/logic/steps';
import { FieldError } from '@/features/insiden/components/AiTag';
import {
  AXES, DATA_OPTS, JENIS_LAIN, KAT, KAT_LAIN, KB, MAX_ALASAN, MAX_DAMPAK, MAX_LAIN, OPS, SEBARAN, TIMS,
  jenisOf, severityParts, toggleCasualty, toggleExclusive, validateStep2,
} from '@/features/insiden/components/step2Data';
import { useDemoStore } from '@/services/mock/store';
import { SEVERITIES, SEV_DOT, SEV_EQUIV, SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type Severity } from '@/lib/severity';
import { AiTagM, StepBar, StepFoot, bare, useDraftActions } from './parts';
import { AiSheet } from './AiSheet';
import { PickerSheet } from './sheets';
import { useMobileCopilot } from './useMobileCopilot';

const digits = (s: string) => s.replace(/\D/g, '');
const MIN44 = { minHeight: 44 } as const;
const Divider = () => <div className="lk-divider" style={{ margin: '4px 0' }}></div>;
const Group = ({ t }: { t: string }) => <span className="p-lbl" style={{ color: 'var(--ink-muted)' }}>{t}</span>;
const comboBtn = { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%' } as const;

export function MobileReportStep2Page() {
  const navigate = useNavigate();
  const { draft, patch } = useDraftStore();
  const config = useDemoStore((s) => s.config);
  const c = useMobileCopilot(2);
  const ex = useCopilotStore((s) => s.extraction);
  const [tried, setTried] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [sheet, setSheet] = useState<null | 'kat' | 'jenis'>(null);
  const [editing, setEditing] = useState(false);
  const menu = useDraftActions();

  const suggested: Severity = suggestedSeverityOf(draft, config) ?? 'sangat-rendah';
  const level: Severity = draft.severityManual && draft.severity ? draft.severity : suggested;
  const differs = level !== suggested;
  const all = validateStep2(draft, differs);
  const errors = tried ? all : {};
  const nErr = Object.keys(all).length;
  const ai = (f: string) => draft.aiFilled.includes(f);
  const has = (a: (typeof AXES)[number][0]) => draft.axes.includes(a);
  const jl = jenisOf(draft.category);
  const parts = severityParts(draft);

  const pickLevel = (k: Severity) =>
    patch(k === suggested ? { severity: null, severityManual: false } : { severity: k, severityManual: true });
  const next = () => {
    setTried(true);
    if (nErr > 0) return;
    patch({ severity: level });
    navigate(STEP_ROUTES.lampiran);
  };
  const toggleAxis = (a: (typeof AXES)[number][0]) => {
    const on = has(a);
    const p: Partial<typeof draft> = { axes: on ? draft.axes.filter((x) => x !== a) : [...draft.axes, a] };
    // pilihan awal sama dengan board: Setempat / Data terbatas
    if (!on && a === 'ling' && !draft.envNote) p.envNote = SEBARAN[0];
    if (!on && a === 'data' && !draft.dataNote) p.dataNote = DATA_OPTS[0];
    patch(p);
  };
  const applyKat = (label: string) => {
    patch({ category: label, jenis: null, jenisOther: '', categoryOther: label === KAT_LAIN ? draft.categoryOther : '' });
    setSheet(null);
  };
  const applyJenis = (label: string) => {
    patch({ jenis: label, jenisOther: label === JENIS_LAIN ? draft.jenisOther : '' });
    setSheet(null);
  };

  const hoursLabel = draft.ops === 'berhenti' ? 'Berapa lama operasi berhenti?' : 'Berapa lama operasi terganggu?';
  const pending = c.suggestions.filter((s) => c.stOf(s.key) === 'p').length;
  const axesAi = ai('ops') || ai('lossIdr') || ai('casualties');
  const axesSrc = [ex?.ops?.src, ex?.casualty?.src].filter((x): x is string => !!x && axesAi).map((x) => `“${x}”`).join(', ');

  const body = (
    <>
      <StepBar n={2} title="Kejadian & dampak" next={stepsOf('insiden')[2]} />

      {tried && nErr > 0 && (
        <div className="in-bn err" role="alert" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
          <Icon name="warn" size={16} />
          <div className="body"><b>{nErr} isian belum lengkap.</b> Lengkapi lalu tekan Berikutnya.</div>
        </div>
      )}

      <div className="sec">
        <h2>Jenis kejadian</h2>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kategori<span className="p-req">*</span><AiTagM on={ai('category')} /></span>
          <button type="button" className={'p-input' + (errors.category ? ' err' : '')} aria-haspopup="listbox" aria-label="Kategori" onClick={() => setSheet('kat')} style={comboBtn}>
            <span className={draft.category ? '' : 'ph'} style={{ flex: 1 }}>{draft.category ?? 'Pilih kategori'}</span>
            <Icon name="chevDown" size={16} />
          </button>
          <FieldError text={errors.category} />
        </div>
        {draft.category === KAT_LAIN && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan kategori kejadian<span className="p-req">*</span></span>
            <span className={'p-input' + (errors.categoryOther ? ' err' : '')}>
              <input style={bare} aria-label="Sebutkan kategori kejadian" maxLength={MAX_LAIN} value={draft.categoryOther} placeholder="mis. Penyusupan drone ke area produksi" onChange={(e) => patch({ categoryOther: e.target.value })} />
            </span>
            <span className="p-help">Tulis singkat. Pejabat Berwenang memetakannya ke kategori resmi saat pemeriksaan.</span>
            <FieldError text={errors.categoryOther} />
          </div>
        )}
        {jl.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
          <button type="button" className="p-input" aria-haspopup="listbox" aria-label="Jenis" onClick={() => jl.length && setSheet('jenis')} style={comboBtn}>
            <span className={draft.jenis && jl.length ? '' : 'ph'} style={{ flex: 1 }}>{!jl.length ? 'Tidak ada jenis untuk kategori ini' : (draft.jenis ?? 'Pilih jenis')}</span>
            <Icon name="chevDown" size={16} />
          </button>
          <span className="p-help">{jl.length ? 'Pilihan menyesuaikan kategori. Nanti ditetapkan ulang saat pemeriksaan.' : 'Tidak wajib. Jelaskan kejadiannya di Dampak keamanan.'}</span>
        </div>
        )}
        {draft.jenis === JENIS_LAIN && jl.length > 0 && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan jenis<span className="p-req">*</span></span>
            <span className={'p-input' + (errors.jenisOther ? ' err' : '')}>
              <input style={bare} aria-label="Sebutkan jenis" maxLength={MAX_LAIN} value={draft.jenisOther} placeholder="mis. Pencurian panel surya" onChange={(e) => patch({ jenisOther: e.target.value })} />
            </span>
            <FieldError text={errors.jenisOther} />
          </div>
        )}
      </div>

      <div className="sec">
        <h2>Dampak</h2>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Dampak keamanan<span className="p-req">*</span><AiTagM on={ai('securityImpact')} /></span>
          <textarea
            className={'p-input p-area' + (errors.securityImpact ? ' err' : '')} aria-label="Dampak keamanan" maxLength={MAX_DAMPAK}
            style={{ minHeight: 88, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            value={draft.securityImpact} onChange={(e) => patch({ securityImpact: e.target.value })}
          />
          <span className="p-help">Apa yang hilang, rusak, atau terbuka.</span>
          <FieldError text={errors.securityImpact} />
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Apa saja yang terdampak?<span className="p-req">*</span><AiTagM on={axesAi} why="Disarankan AI Copilot · Anda yang memutuskan" /></span>
          <div className="in-chips" role="group" aria-label="Yang terdampak" style={{ flexWrap: 'wrap' }}>
            {AXES.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={has(k)} onClick={() => toggleAxis(k)} style={MIN44}>{l}</button>
            ))}
          </div>
          <span className="p-help">
            {axesAi && axesSrc ? `Disarankan AI dari cerita: ${axesSrc}. Keparahan tetap dihitung sistem.` : 'Boleh lebih dari satu. Yang tidak dipilih dianggap tidak terdampak.'}
          </span>
          <FieldError text={errors.axes} />
        </div>

        {has('prop') && (
          <>
            <Divider />
            <Group t="Properti dan operasi" />
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Perkiraan kerugian <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span><AiTagM on={ai('lossIdr')} /></span>
              <span className="p-input">
                <span className="affix">Rp</span>
                <input
                  className="num" style={{ ...bare, textAlign: 'right' }} inputMode="numeric" aria-label="Perkiraan kerugian"
                  value={draft.lossIdr ? draft.lossIdr.toLocaleString('id-ID') : ''} placeholder="0"
                  onChange={(e) => { const d = digits(e.target.value).slice(0, 15); patch({ lossIdr: d ? Number(d) : null }); }}
                />
              </span>
              <span className="p-help">Isi dalam Rupiah. Sistem mengonversi ke USD dengan kurs tanggal kejadian untuk menghitung saran keparahan.</span>
            </div>
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi operasi<span className="p-req">*</span><AiTagM on={ai('ops')} /></span>
              <div className="in-chips" role="radiogroup" aria-label="Dampak operasional" style={{ flexWrap: 'wrap' }}>
                {OPS.map(([k, l]) => (
                  <button
                    key={k} type="button" role="radio" className="p-chip" aria-pressed={draft.ops === k} aria-checked={draft.ops === k} style={MIN44}
                    onClick={() => patch(k === 'tidak' ? { ops: k, opsHours: null, ongoing: false } : { ops: k })}
                  >{l}</button>
                ))}
              </div>
              {draft.ops && draft.ops !== 'tidak' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--surface-subtle)' }}>
                  <span className="p-lbl" style={{ color: 'var(--ink)' }}>{hoursLabel}<span className="p-req">*</span></span>
                  <span className={'p-input' + (errors.opsHours ? ' err' : '')} style={{ height: 44 }}>
                    <input
                      className="num" style={bare} inputMode="numeric" aria-label={hoursLabel} value={draft.opsHours ?? ''} placeholder="—"
                      onChange={(e) => { const d = digits(e.target.value).slice(0, 4); patch({ opsHours: d ? Number(d) : null }); }}
                    />
                    <span className="affix">jam</span>
                  </span>
                  <button type="button" className="in-checked" role="checkbox" aria-checked={draft.ongoing} onClick={() => patch({ ongoing: !draft.ongoing })} style={{ fontSize: 13, color: 'var(--ink)', minHeight: 44 }}>
                    <span className={draft.ongoing ? 'p-check on' : 'p-check'}><Icon name="check" size={11} /></span>
                    Masih berlangsung saat melapor
                  </button>
                  <span className="p-help">{draft.ongoing ? 'Isi lama sampai saat ini. Perbarui setelah operasi pulih.' : 'Dari mulai terganggu sampai pulih. Perkiraan boleh.'}</span>
                  <FieldError text={errors.opsHours} />
                </div>
              )}
              <FieldError text={errors.ops} />
            </div>
          </>
        )}

        {has('man') && (
          <>
            <Divider />
            <Group t="Manusia" />
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi korban<span className="p-req">*</span><AiTagM on={ai('casualties')} /></span>
              <div className="in-chips" role="group" aria-label="Kondisi korban" style={{ flexWrap: 'wrap' }}>
                {KB.map(([k, l]) => (
                  <button key={k} type="button" className="p-chip" aria-pressed={k in draft.casualties} style={MIN44} onClick={() => patch({ casualties: toggleCasualty(draft.casualties, k) })}>{l}</button>
                ))}
              </div>
              <span className="p-help">Boleh lebih dari satu, lalu isi jumlah orangnya. Belum diketahui tidak bisa digabung dengan pilihan lain.</span>
              <FieldError text={errors.casualties} />
              {KB.some(([k]) => k !== 'belum' && k in draft.casualties) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {KB.filter(([k]) => k !== 'belum' && k in draft.casualties).map(([k, l]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
                      <span className="p-input" style={{ width: 120, height: 44 }}>
                        <input
                          className="num" style={{ ...bare, textAlign: 'right' }} inputMode="numeric" aria-label={`Jumlah orang · ${l}`} value={draft.casualties[k] ?? 0}
                          onChange={(e) => { const d = digits(e.target.value).slice(0, 4); patch({ casualties: { ...draft.casualties, [k]: d ? Number(d) : 0 } }); }}
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
              <div className="in-chips" role="radiogroup" aria-label="Sebaran dampak" style={{ flexWrap: 'wrap' }}>
                {SEBARAN.map((l) => (
                  <button key={l} type="button" role="radio" className="p-chip" aria-pressed={draft.envNote === l} style={MIN44} onClick={() => patch({ envNote: l })}>{l}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {has('data') && (
          <>
            <Divider />
            <Group t="Data dan informasi" />
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Seberapa besar data yang dicuri atau bocor?<span className="p-req">*</span></span>
              <div className="in-chips" role="radiogroup" aria-label="Data dan informasi" style={{ flexWrap: 'wrap' }}>
                {DATA_OPTS.map((l) => (
                  <button key={l} type="button" role="radio" className="p-chip" aria-pressed={draft.dataNote === l} style={MIN44} onClick={() => patch({ dataNote: l })}>{l}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sec">
        <h2>Seberapa parah?</h2>
        <div className="in-sevauto">
          <div className="r1" style={{ flexWrap: 'wrap' }}>
            <span className={'p-tag ' + SEV_TAG_CLS[level]}><span className="dot"></span>{SEV_LABEL[level]}</span>
            <span className="p-cap">setara {SEV_EQUIV[level]}</span>
            <span className={differs ? 'p-tag t-caution' : 'p-tag t-info'} style={{ height: 20, fontSize: 11 }}>{differs ? 'Diubah pelapor' : 'Otomatis'}</span>
            <span style={{ flex: 1 }}></span>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={MIN44} onClick={() => setEditing(!editing)}>{editing ? 'Selesai' : 'Ubah'}</button>
          </div>
          <span className="p-cap">Dari dampak: {parts.join(', ') || 'belum ada dampak dipilih'}.</span>
        </div>
        {editing && (
          <div className="in-seg5" role="radiogroup" aria-label="Keparahan awal" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {SEVERITIES.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={level === k} style={MIN44} onClick={() => pickLevel(k)}>
                <i style={{ background: SEV_DOT[k] }}></i>{SEV_LABEL[k]}<span className="s">{k === suggested ? '· saran' : ''}</span>
              </button>
            ))}
          </div>
        )}
        {differs && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kenapa berbeda dari saran?<span className="p-req">*</span></span>
            <textarea
              className={'p-input p-area' + (errors.severityReason ? ' err' : '')} aria-label="Kenapa berbeda dari saran?" maxLength={MAX_ALASAN}
              style={{ minHeight: 72, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              placeholder="mis. Kerugian jauh lebih besar dari perkiraan awal." value={draft.severityReason}
              onChange={(e) => patch({ severityReason: e.target.value })}
            />
            <FieldError text={errors.severityReason} />
          </div>
        )}
        {isHighOrCritical(level) && (
          <div className="in-bn caution" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
            <Icon name="bell" size={16} />
            <div className="body"><b>SKK Migas langsung diberi tahu</b> saat diajukan.</div>
          </div>
        )}
      </div>

      <div className="sec">
        <h2>Penanganan di lokasi</h2>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sudah ada yang menangani? <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span><AiTagM on={ai('handledBy')} why="Disarankan AI Copilot · Anda yang memutuskan" /></span>
          <div className="in-chips" role="group" aria-label="Yang sudah menangani" style={{ flexWrap: 'wrap' }}>
            {TIMS.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={draft.handledBy.includes(k)} style={MIN44} onClick={() => patch({ handledBy: toggleExclusive(draft.handledBy, k, 'belum') })}>{l}</button>
            ))}
          </div>
          <span className="p-help">
            {ai('handledBy') && ex?.handledBy ? `Disarankan AI dari cerita: “${ex.handledBy.src}”. ` : 'Boleh lebih dari satu. '}Nama mitra dicatat PIC saat penanganan.
          </span>
        </div>
      </div>
    </>
  );

  const overlay = (
    <>
      {menu.overlay}
      {aiOpen && <AiSheet c={c} onClose={() => setAiOpen(false)} />}
      {sheet === 'kat' && (
        <PickerSheet
          title="Kategori" searchLabel="Cari kategori" group={`Kategori insiden · ${KAT.length} pilihan`}
          options={KAT.map(([, l, d]) => ({ key: l, label: l, desc: d }))} selected={draft.category}
          onApply={applyKat} onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'jenis' && (
        <PickerSheet
          title="Jenis" searchLabel="Cari jenis" group={`Jenis · ${draft.category}`}
          options={jl.map((l) => ({ key: l, label: l }))} selected={draft.jenis}
          onApply={applyJenis} onClose={() => setSheet(null)}
        />
      )}
    </>
  );

  return (
    <MobileShell
      title="Laporan baru" left="back" backTo="/insiden" actions={menu.actions} overlay={overlay}
      footer={
        <StepFoot
          prevTo={STEP_ROUTES.temuan} onNext={next}
          extra={
            <button type="button" className="p-btn p-btn-secondary ma-foot-ai" aria-label={pending > 0 ? `Buka AI Copilot, ${pending} saran belum diperiksa` : 'Buka AI Copilot'} onClick={() => setAiOpen(true)}>
              <CopilotFace size={22} />AI{pending > 0 && <i>{pending}</i>}
            </button>
          }
        />
      }
    >
      {body}
    </MobileShell>
  );
}
