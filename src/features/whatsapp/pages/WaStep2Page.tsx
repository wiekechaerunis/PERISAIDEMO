// Board: I21 (Form dari WhatsApp · langkah 2 Kejadian & dampak, saran AI + Perlu dicek). Keparahan dari sistem, bukan AI.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { FieldError } from '@/features/insiden/components/AiTag';
import { ImpactAxes } from '@/features/insiden/components/ImpactAxes';
import { SeverityAuto } from '@/features/insiden/components/SeverityAuto';
import {
  AXES, DATA_OPTS, MAX_DAMPAK, SEBARAN, TIMS, severityParts, toggleExclusive, validateStep2,
} from '@/features/insiden/components/step2Data';
import { suggestedSeverityOf } from '@/features/insiden/logic/submit';
import type { Severity } from '@/lib/severity';
import { useDemoStore } from '@/services/mock/store';
import { AiFailedBanner, AiHead, SourceCard, StatusNote, SubmissionCard, Toast } from '../components/parts';
import { NoDraft } from '../components/NoDraft';
import { Step2Copilot } from '../components/WaCopilot';
import { WaCategoryFields } from '../components/WaCategoryFields';
import { WaFormShell } from '../components/WaFormShell';
import { useActiveWaDraft, waPath } from '../logic/draft';
import { nextNumber } from '@/features/insiden/logic/submit';

export function WaStep2Page() {
  const navigate = useNavigate();
  const { draft: wa, message, patchForm, confirm } = useActiveWaDraft();
  const config = useDemoStore((s) => s.config);
  const incidents = useDemoStore((s) => s.incidents);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState(false);
  if (!wa || !message) return <NoDraft />;

  const d = wa.form;
  const nomor = nextNumber('INS-SEN', incidents.map((i) => i.no));
  const suggested: Severity = suggestedSeverityOf(d, config) ?? 'sangat-rendah';
  const level: Severity = d.severityManual && d.severity ? d.severity : suggested;
  const differs = level !== suggested;
  const all = validateStep2(d, differs);
  const errors = tried ? all : {};
  const nErr = Object.keys(all).length;
  const has = (a: (typeof AXES)[number][0]) => d.axes.includes(a);

  const toggleAxis = (a: (typeof AXES)[number][0]) => {
    const on = has(a);
    const p: Partial<typeof d> = { axes: on ? d.axes.filter((x) => x !== a) : [...d.axes, a] };
    if (!on && a === 'ling' && !d.envNote) p.envNote = SEBARAN[0];
    if (!on && a === 'data' && !d.dataNote) p.dataNote = DATA_OPTS[0];
    patchForm(p);
  };
  const pickLevel = (k: Severity) => patchForm(k === suggested ? { severity: null, severityManual: false } : { severity: k, severityManual: true });
  const next = () => {
    setTried(true);
    if (nErr > 0) return;
    patchForm({ severity: level });
    navigate(waPath('lampiran', wa.id));
  };
  const save = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const top = (
    <>
      {wa.aiState === 'gagal' && <AiFailedBanner />}
      <StatusNote
        draft={wa} step={2}
        intro={
          <>
            Draf dari pesan WhatsApp grup <b style={{ fontWeight: 600 }}>{message.group}</b>.
            {wa.aiState === 'ok' && <> Isian bertanda <b style={{ fontWeight: 600 }}>AI</b> adalah saran, periksa sebelum mengajukan.</>}
          </>
        }
      />
    </>
  );

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
        <WaCategoryFields wa={wa} onPatch={patchForm} onConfirm={confirm} errors={errors} />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Dampak</h2>
        <div className="p-field">
          <AiHead id="wa-f-securityImpact" draft={wa} k="securityImpact" label="Dampak keamanan" required onConfirm={confirm} />
          <textarea
            className={'p-input p-area' + (errors.securityImpact ? ' err' : '')} aria-label="Dampak keamanan" maxLength={MAX_DAMPAK}
            style={{ minHeight: 64, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            value={d.securityImpact} onChange={(e) => patchForm({ securityImpact: e.target.value })}
          />
          <span className="p-help row"><span>Apa yang hilang, rusak, atau terbuka.</span><span>{d.securityImpact.length}/{MAX_DAMPAK}</span></span>
          <FieldError text={errors.securityImpact} />
        </div>
        <div className="p-field">
          <AiHead draft={wa} k="axes" label="Apa saja yang terdampak?" required />
          <div className="in-chips" role="group" aria-label="Yang terdampak">
            {AXES.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={has(k)} onClick={() => toggleAxis(k)}>{l}</button>
            ))}
          </div>
          <span className="p-help">Boleh lebih dari satu. Isian lanjutan muncul sesuai pilihan; yang tidak dipilih dianggap tidak terdampak.</span>
          <FieldError text={errors.axes} />
        </div>
        <ImpactAxes draft={d} onPatch={patchForm} aiFilled={[]} errors={errors} hideAxisPicker />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Seberapa parah?</h2>
        <SeverityAuto
          suggested={suggested} level={level} parts={severityParts(d)} reason={d.severityReason}
          reasonError={errors.severityReason} onPick={pickLevel} onReason={(t) => patchForm({ severityReason: t })}
        />
      </section>

      <section className="p-card in-sec">
        <h2 className="in-h">Penanganan di lokasi</h2>
        <div className="p-field">
          <AiHead id="wa-f-handledBy" draft={wa} k="handledBy" label="Sudah ada yang menangani?" optional onConfirm={confirm} />
          <div className="in-chips" role="group" aria-label="Yang sudah menangani">
            {TIMS.map(([k, l]) => (
              <button
                key={k} type="button" className="p-chip" aria-pressed={d.handledBy.includes(k)}
                onClick={() => { patchForm({ handledBy: toggleExclusive(d.handledBy, k, 'belum') }); confirm('handledBy'); }}
              >{l}</button>
            ))}
          </div>
          <span className="p-help">
            {wa.ai.handledBy
              ? `Disarankan dari pengirim (${message.sender}, ${message.senderRole}). “Sdh lapor polsek” berarti sudah melapor, belum tentu Polri ikut menangani. Nama mitra dicatat PIC saat penanganan.`
              : 'Boleh lebih dari satu. Pilih Belum ada kalau belum ada yang datang. Nama mitra dan kontraknya dicatat PIC saat penanganan.'}
          </span>
        </div>
      </section>
    </>
  );

  const aside = (
    <>
      <SourceCard message={message} />
      <Step2Copilot draft={wa} message={message} onOngoing={() => patchForm({ ongoing: true })} />
      <SubmissionCard no={nomor} message={message} />
      <div className="p-note" style={{ alignItems: 'flex-start' }}>
        <Icon name="info" size={16} style={{ flex: 'none', marginTop: 1 }} />
        <span>{d.locationName ? 'Keparahan disarankan dari dampak yang Anda isi. Pejabat Berwenang menetapkan level resmi.' : 'Lokasi belum dibagikan di pesan. Pilih titiknya di langkah 1.'}</span>
      </div>
    </>
  );

  return (
    <>
      <WaFormShell
        step={2} top={top} main={main} aside={aside}
        back={{ label: 'Sebelumnya', to: waPath('temuan', wa.id) }}
        actions={[{ label: 'Simpan draf', onClick: save }, { label: 'Berikutnya', variant: 'primary', onClick: next }]}
      />
      {toast && <Toast text="Draf tersimpan." />}
    </>
  );
}
