// Board: I13 (1.2 Form · langkah 2, Kejadian & dampak) + S14, S15, S17, S18 (pemilih), S01 (validasi) — FR-INS-02..06
import { formatWibFull } from '@/lib/format';
import { demoNow } from '@/services/mock/clock';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportFormShell } from '../components/ReportFormShell';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { CategoryFields } from '../components/CategoryFields';
import { ImpactAxes } from '../components/ImpactAxes';
import { SeverityAuto } from '../components/SeverityAuto';
import { AiTag, FieldError } from '../components/AiTag';
import { MAX_DAMPAK, TIMS, severityParts, toggleExclusive, validateStep2 } from '../components/step2Data';
import { Icon } from '@/components/ui/Icon';
import { useDraftStore } from '../logic/draft';
import { useDemoStore } from '@/services/mock/store';
import { nextNumber, suggestedSeverityOf } from '../logic/submit';
import { STEP_ROUTES, stepsOf } from '../logic/steps';
import type { Severity } from '@/lib/severity';

export function ReportStep2Page() {
  const navigate = useNavigate();
  const { draft, patch } = useDraftStore();
  const config = useDemoStore((s) => s.config);
  const incidents = useDemoStore((s) => s.incidents);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const nomor = useMemo(() => nextNumber('INS-SEN', incidents.map((i) => i.no)), [incidents]);
  const suggested: Severity = suggestedSeverityOf(draft, config) ?? 'sangat-rendah';
  const level: Severity = draft.severityManual && draft.severity ? draft.severity : suggested;
  const differs = level !== suggested;
  const all = validateStep2(draft, differs);
  const errors = tried ? all : {};
  const nErr = Object.keys(all).length;
  const ai = (f: string) => draft.aiFilled.includes(f);

  const pickLevel = (k: Severity) =>
    patch(k === suggested ? { severity: null, severityManual: false } : { severity: k, severityManual: true });
  const next = () => {
    setTried(true);
    if (nErr > 0) return;
    patch({ severity: level });
    navigate(STEP_ROUTES.lampiran);
  };
  const save = () => {
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
          suggested={suggested} level={level} parts={severityParts(draft)} reason={draft.severityReason}
          reasonError={errors.severityReason} onPick={pickLevel} onReason={(t) => patch({ severityReason: t })}
        />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Penanganan di lokasi</h2>
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
          </div>
          <span className="p-help">Boleh lebih dari satu. Pilih Belum ada kalau belum ada yang datang. Nama mitra dan kontraknya dicatat PIC saat penanganan.</span>
        </div>
      </section>
    </>
  );

  const aside = (
    <>
      <section className="p-card">
        <h2 className="in-h" style={{ marginBottom: 12 }}>Pengajuan</h2>
        <dl className="lk-kv1">
          <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{nomor}</span></dd>
          <dt>Status</dt><dd><span className="p-tag t-draft">Draf</span></dd>
          <dt>Terakhir disimpan</dt><dd>{formatWibFull(demoNow())}</dd>
          <dt>Dikirim ke</dt><dd>Semua Pejabat Berwenang KKKS</dd>
        </dl>
      </section>
      <CopilotPanel step={2} />
      <div className="p-note" style={{ alignItems: 'flex-start' }}>
        <Icon name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
        <span>Keparahan disarankan dari dampak yang Anda isi. Pejabat Berwenang menetapkan level resmi.</span>
      </div>
    </>
  );

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
