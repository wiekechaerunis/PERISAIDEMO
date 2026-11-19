// Board mobile: M10 (Draf dari WhatsApp · Kejadian & dampak) dan MS04 (saran AI gagal / membaca: ?state=ai-gagal | ?state=memuat).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { FieldError } from '@/features/insiden/components/AiTag';
import { ImpactAxes } from '@/features/insiden/components/ImpactAxes';
import { SeverityAuto } from '@/features/insiden/components/SeverityAuto';
import {
  AXES, DATA_OPTS, JENIS_LAIN, KAT, MAX_DAMPAK, SEBARAN, TIMS, jenisOf, severityParts, toggleExclusive, validateStep2,
} from '@/features/insiden/components/step2Data';
import { suggestedSeverityOf } from '@/features/insiden/logic/submit';
import { AiHead, StatusNote } from '@/features/whatsapp/components/parts';
import { WA_ROUTES, useActiveWaDraft, waPath } from '@/features/whatsapp/logic/draft';
import type { Severity } from '@/lib/severity';
import { useDemoStore } from '@/services/mock/store';
import { StepBar } from '../formA/parts';
import { PickerSheet } from '../formA/sheets';
import { MobileShell } from '../ui/MobileShell';
import { WaFoot, useWaDraftActions } from './parts';

const MIN44 = { minHeight: 44 } as const;
const COMBO = { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', border: 0, width: '100%' } as const;
const BN = { padding: '10px 12px', fontSize: 12, lineHeight: '17px' } as const;

export function MobileWaStep2() {
  const navigate = useNavigate();
  const { draft: wa, message, patchForm, confirm, view } = useActiveWaDraft();
  const config = useDemoStore((s) => s.config);
  const [tried, setTried] = useState(false);
  const [sheet, setSheet] = useState<null | 'kat' | 'jenis'>(null);
  const menu = useWaDraftActions(wa?.id ?? '');
  if (!wa || !message) {
    return (
      <MobileShell title="Draf dari WhatsApp" left="back" backTo={WA_ROUTES.inbox}>
        <div className="sec"><h2>Draf tidak ditemukan</h2><span className="p-cap">Draf ini sudah dihapus atau diajukan.</span></div>
      </MobileShell>
    );
  }
  const d = wa.form;
  const loading = view === 'memuat';
  const failed = wa.aiState === 'gagal' || view === 'ai-gagal';
  const suggested: Severity = suggestedSeverityOf(d, config) ?? 'sangat-rendah';
  const level: Severity = d.severityManual && d.severity ? d.severity : suggested;
  const differs = level !== suggested;
  const all = validateStep2(d, differs);
  const errors = tried ? all : {};
  const nErr = Object.keys(all).length;
  const has = (a: (typeof AXES)[number][0]) => d.axes.includes(a);
  const jl = jenisOf(d.category);
  const sk = (h: number) => <span className="p-sk" style={{ display: 'block', height: h, borderRadius: 'var(--radius-md)' }}></span>;

  const toggleAxis = (a: (typeof AXES)[number][0]) => {
    const on = has(a);
    const p: Partial<typeof d> = { axes: on ? d.axes.filter((x) => x !== a) : [...d.axes, a] };
    if (!on && a === 'ling' && !d.envNote) p.envNote = SEBARAN[0];
    if (!on && a === 'data' && !d.dataNote) p.dataNote = DATA_OPTS[0];
    patchForm(p);
  };
  const next = () => {
    setTried(true);
    if (nErr > 0) return;
    patchForm({ severity: level });
    navigate(waPath('lampiran', wa.id));
  };

  const body = (
    <>
      <StepBar n={2} title="Kejadian & dampak" next="Lampiran" />
      {failed && (
        <div className="in-bn info" style={BN}>
          <Icon name="info" size={16} />
          <div className="body"><b>Saran otomatis tidak tersedia.</b> Lengkapi isian secara manual.</div>
        </div>
      )}
      {loading && (
        <div className="in-bn info" role="status" style={BN}>
          <Icon name="info" size={16} />
          <div className="body"><b>Membaca pesan…</b> Anda tetap bisa mengisi bagian lain.</div>
        </div>
      )}
      {!failed && !loading && (
        <StatusNote draft={wa} step={2} intro={<>Isian bertanda <b style={{ fontWeight: 600 }}>AI</b> adalah saran. Periksa sebelum mengajukan.</>} />
      )}
      {tried && nErr > 0 && (
        <div className="in-bn err" role="alert" style={BN}>
          <Icon name="warn" size={16} />
          <div className="body"><b>{nErr} isian belum lengkap.</b> Lengkapi lalu tekan Berikutnya.</div>
        </div>
      )}

      <div className="sec">
        <h2>Jenis kejadian</h2>
        <div className="p-field">
          <AiHead id="wa-f-category" draft={wa} k="category" label="Kategori" required onConfirm={confirm} />
          {loading ? sk(44) : (
            <button type="button" className={'p-input' + (errors.category ? ' err' : '')} aria-haspopup="listbox" aria-label="Kategori" onClick={() => setSheet('kat')} style={COMBO}>
              <span className={d.category ? '' : 'ph'} style={{ flex: 1 }}>{d.category ?? 'Pilih kategori'}</span>
              <Icon name="chevDown" size={16} />
            </button>
          )}
          <FieldError text={errors.category} />
        </div>
        {jl.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
          <button type="button" className="p-input" aria-haspopup="listbox" aria-label="Jenis" onClick={() => jl.length && setSheet('jenis')} style={COMBO}>
            <span className={d.jenis && jl.length ? '' : 'ph'} style={{ flex: 1 }}>{!jl.length ? (d.category ? 'Tidak ada jenis untuk kategori ini' : 'Pilih kategori dulu') : (d.jenis ?? 'Pilih jenis')}</span>
            <Icon name="chevDown" size={16} />
          </button>
          <span className="p-help">{jl.length ? 'Pilihan menyesuaikan kategori. Nanti ditetapkan ulang saat pemeriksaan.' : 'Tidak wajib. Jelaskan kejadiannya di Dampak keamanan.'}</span>
        </div>
        )}
      </div>

      <div className="sec">
        <h2>Dampak</h2>
        <div className="p-field">
          <AiHead id="wa-f-securityImpact" draft={wa} k="securityImpact" label="Dampak keamanan" required onConfirm={confirm} />
          {loading ? sk(72) : (
            <textarea
              className={'p-input p-area' + (errors.securityImpact ? ' err' : '')} aria-label="Dampak keamanan" maxLength={MAX_DAMPAK}
              placeholder={failed ? 'Apa yang hilang, rusak, atau terbuka' : undefined}
              style={{ minHeight: 88, border: 0, font: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={d.securityImpact} onChange={(e) => patchForm({ securityImpact: e.target.value })}
            />
          )}
          <FieldError text={errors.securityImpact} />
        </div>
        <div className="p-field">
          <AiHead draft={wa} k="axes" label="Apa saja yang terdampak?" required />
          <div className="in-chips" role="group" aria-label="Yang terdampak" style={{ flexWrap: 'wrap' }}>
            {AXES.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={has(k)} onClick={() => toggleAxis(k)} style={MIN44}>{l}</button>
            ))}
          </div>
          <span className="p-help">Boleh lebih dari satu. Yang tidak dipilih dianggap tidak terdampak.</span>
          <FieldError text={errors.axes} />
        </div>
        <ImpactAxes draft={d} onPatch={patchForm} aiFilled={[]} errors={errors} hideAxisPicker />
      </div>

      <div className="sec">
        <h2>Seberapa parah?</h2>
        {loading ? sk(88) : failed && d.axes.length === 0 ? (
          <div className="in-sevauto"><div className="r1"><span className="p-cap" style={{ color: 'var(--ink)' }}><b>Belum bisa dihitung, isi dampak dulu.</b></span></div></div>
        ) : (
          <SeverityAuto
            suggested={suggested} level={level} parts={severityParts(d)} reason={d.severityReason}
            reasonError={errors.severityReason} onPick={(k) => patchForm(k === suggested ? { severity: null, severityManual: false } : { severity: k, severityManual: true })}
            onReason={(t) => patchForm({ severityReason: t })}
          />
        )}
      </div>

      <div className="sec">
        <h2>Penanganan di lokasi</h2>
        <div className="p-field">
          <AiHead id="wa-f-handledBy" draft={wa} k="handledBy" label="Sudah ada yang menangani?" optional onConfirm={confirm} />
          <div className="in-chips" role="group" aria-label="Yang sudah menangani" style={{ flexWrap: 'wrap' }}>
            {TIMS.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={d.handledBy.includes(k)} style={MIN44}
                onClick={() => { patchForm({ handledBy: toggleExclusive(d.handledBy, k, 'belum') }); confirm('handledBy'); }}>{l}</button>
            ))}
          </div>
          <span className="p-help">
            {wa.ai.handledBy ? `Disarankan dari pengirim (${message.senderRole}). “Sdh lapor polsek” belum tentu Polri ikut menangani. Nama mitra dicatat PIC.` : 'Boleh lebih dari satu. Nama mitra dicatat PIC saat penanganan.'}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <MobileShell
      title="Draf dari WhatsApp" left="back" backTo={WA_ROUTES.inbox} actions={menu.actions}
      footer={<WaFoot prevTo={waPath('temuan', wa.id)} onNext={next} />}
      overlay={
        <>
          {menu.overlay}
          {sheet === 'kat' && (
            <PickerSheet
              title="Kategori" searchLabel="Cari kategori" group={`Kategori insiden · ${KAT.length} pilihan`}
              options={KAT.map(([, l, desc]) => ({ key: l, label: l, desc }))} selected={d.category}
              onApply={(l) => { patchForm({ category: l, jenis: null, jenisOther: '' }); confirm('category'); setSheet(null); }} onClose={() => setSheet(null)}
            />
          )}
          {sheet === 'jenis' && (
            <PickerSheet
              title="Jenis" searchLabel="Cari jenis" group={`Jenis · ${d.category}`}
              options={jl.map((l) => ({ key: l, label: l }))} selected={d.jenis}
              onApply={(l) => { patchForm({ jenis: l, jenisOther: l === JENIS_LAIN ? d.jenisOther : '' }); setSheet(null); }} onClose={() => setSheet(null)}
            />
          )}
        </>
      }
    >
      {body}
    </MobileShell>
  );
}
