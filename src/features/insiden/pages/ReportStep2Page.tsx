// Board: I13 (langkah 2 Dampak), I13u/I13ue (dampak belum diketahui, keparahan wajib) + S14, S15, S17, S18 (pemilih), S01 (validasi).
// B-6: tanpa kartu catatan keparahan. B-4: tanpa kartu Pengajuan. B-11: Belum diketahui. B-12: Lainnya + Tindakan awal.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportFormShell } from '../components/ReportFormShell';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { CategoryFields } from '../components/CategoryFields';
import { ImpactAxes } from '../components/ImpactAxes';
import { SeverityAuto, cannotSuggest } from '../components/SeverityAuto';
import { AiTag, FieldError } from '../components/AiTag';
import { MAX_DAMPAK, MAX_LAIN_TIM, MAX_TINDAKAN, TIMS, bareInput, severityParts, toggleExclusive, validateStep2 } from '../components/step2Data';
import { Icon } from '@/components/ui/Icon';
import { unknownImpacts, useDraftStore } from '../logic/draft';
import { saveDraftNow } from '../logic/draftSave';
import { useDemoStore } from '@/services/mock/store';
import { suggestedSeverityOf } from '../logic/submit';
import { STEP_ROUTES, stepsOf } from '../logic/steps';
import type { Severity } from '@/lib/severity';

export function ReportStep2Page() {
  const navigate = useNavigate();
  const { draft, patch } = useDraftStore();
  const config = useDemoStore((s) => s.config);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const unknown = unknownImpacts(draft).length > 0;
  const raw = suggestedSeverityOf(draft, config);
  // tanpa dampak sama sekali (belum memilih sumbu) tetap memakai saran terendah seperti sebelumnya
  const suggested: Severity | null = raw ?? (unknown ? null : 'sangat-rendah');
  const noSug = cannotSuggest(suggested, unknown);
  const level: Severity | null = draft.severityManual && draft.severity ? draft.severity : suggested;
  const differs = !noSug && level !== null && level !== suggested;
  const all = validateStep2(draft, differs, noSug && !level);
  const errors = tried ? all : {};
  const nErr = Object.keys(all).length;
  const ai = (f: string) => draft.aiFilled.includes(f);

  const pickLevel = (k: Severity) =>
    patch(!noSug && k === suggested ? { severity: null, severityManual: false } : { severity: k, severityManual: true });
  const next = () => {
    setTried(true);
    if (nErr > 0) return;
    if (level) patch({ severity: level });
    navigate(STEP_ROUTES.lampiran);
  };
  const save = () => {
    saveDraftNow();
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2500);
  };

  const main = (
    <>
      {tried && nErr > 0 && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body"><b>{nErr} isian belum lengkap.</b> Lengkapi lalu tekan Berikutnya.</div>
        </div>
      )}
      <section className="p-card in-sec">
        <h2 className="in-h">Jenis kejadian</h2>
        <CategoryFields draft={draft} onPatch={patch} aiFilled={draft.aiFilled} errors={errors} />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Dampak</h2>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Dampak keamanan<span className="p-req">*</span><AiTag on={ai('securityImpact')} /></span>
          <textarea
            className={'p-input p-area' + (errors.securityImpact ? ' err' : '')} aria-label="Dampak keamanan" maxLength={MAX_DAMPAK}
            style={{ minHeight: 72, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            value={draft.securityImpact} onChange={(e) => patch({ securityImpact: e.target.value })}
          />
          <span className="p-help row"><span>Apa yang hilang, rusak, atau terbuka.</span><span>{draft.securityImpact.length}/{MAX_DAMPAK}</span></span>
          <FieldError text={errors.securityImpact} />
        </div>
        <ImpactAxes draft={draft} onPatch={patch} aiFilled={draft.aiFilled} errors={errors} />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Seberapa parah?</h2>
        <SeverityAuto
          suggested={suggested} level={level} parts={severityParts(draft)} unknown={unknown} reason={draft.severityReason}
          reasonError={errors.severityReason} levelError={!!errors.severity} onPick={pickLevel} onReason={(t) => patch({ severityReason: t })}
        />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Penanganan</h2>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>
            Sudah ada yang menangani? <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span><AiTag on={ai('handledBy')} />
          </span>
          <div className="in-chips" role="group" aria-label="Yang sudah menangani">
            {TIMS.map(([k, l]) => (
              <button
                key={k} type="button" className="p-chip" aria-pressed={draft.handledBy.includes(k)}
                onClick={() => patch({ handledBy: toggleExclusive(draft.handledBy, k, 'belum') })}
              >{l}</button>
            ))}
            <button
              type="button" className="p-chip" aria-pressed={draft.handledOther !== null}
              onClick={() => patch(draft.handledOther !== null ? { handledOther: null } : { handledOther: '', handledBy: draft.handledBy.filter((x) => x !== 'belum') })}
            >Lainnya</button>
          </div>
          <span className="p-help">Boleh lebih dari satu. Pilih Belum ada kalau belum ada yang datang. Nama mitra dan kontraknya dicatat PIC saat penanganan.</span>
          {draft.handledOther !== null && (
            <div className="p-field" style={{ marginTop: 8 }}>
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan<span className="p-req">*</span></span>
              <label className={'p-input' + (errors.handledOther ? ' err' : '')}>
                <input
                  aria-label="Sebutkan yang menangani" maxLength={MAX_LAIN_TIM} placeholder="mis. Warga, perangkat desa, Damkar" style={bareInput}
                  value={draft.handledOther} onChange={(e) => patch({ handledOther: e.target.value })}
                />
              </label>
              <span className="p-help row"><span></span><span>{draft.handledOther.length}/{MAX_LAIN_TIM}</span></span>
              <FieldError text={errors.handledOther} />
            </div>
          )}
        </div>
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>
            Tindakan awal <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span>
          </span>
          <textarea
            className="p-input p-area" aria-label="Tindakan awal" maxLength={MAX_TINDAKAN}
            style={{ minHeight: 64, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            placeholder="mis. Area diamankan, panel ditutup sementara, Polsek dihubungi." value={draft.initialAction}
            onChange={(e) => patch({ initialAction: e.target.value })}
          />
          <span className="p-help row"><span>Yang sudah dilakukan di lokasi.</span><span>{draft.initialAction.length}/{MAX_TINDAKAN}</span></span>
        </div>
      </section>
    </>
  );

  const aside = <CopilotPanel step={2} />;

  return (
    <>
      <ReportFormShell
        step={2}
        steps={stepsOf('insiden')}
        main={main}
        aside={aside}
        back={{ label: 'Sebelumnya', to: STEP_ROUTES.temuan }}
        actions={[{ label: 'Simpan draf', onClick: save }, { label: 'Berikutnya', variant: 'primary', onClick: next }]}
      />
      {toast && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 120 }}>
          <div className="p-toast" role="status"><span className="ti"><Icon name="check" size={14} /></span>Draf tersimpan</div>
        </div>
      )}
    </>
  );
}
