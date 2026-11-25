// Formulir Data penutupan (board P14 langkah 2, P16, PS6). Isian disimpan sebagai draf tiap perubahan (dipanggil dari halaman).
import { useRef, useState, type ReactNode } from 'react';
import { useDismiss } from '@/components/ui/useDismiss';
import type { Closure } from '@/services/types';
import { CLOSURE_REQUIRED, causeDetailRequired, closureDone } from '@/services/mock/workflow.handling';
import type { Severity } from '@/lib/severity';
import { LpoSection } from './LpoSection';
import { formatNumber, formatRupiah } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { Ic as P } from '../review/parts';
import { extLabel, formatSize } from '../../logic/attachments';
import { CAUSE_OPTS, FACTOR_OPTS, PARTNER_OPTS, typesOf } from '../../logic/handling';
import { KB } from '../step2Data';
import { D } from './parts';
import { TidyBar } from './TidyBar';
import { ClosureExtraFields } from './ClosureExtraFields';

const MAX_ACTIONS = 1000;
const MAX_CAUSE = 500;

function Req({ label, children, help, error, optional }: { label: string; children: ReactNode; help?: ReactNode; error?: string; optional?: boolean }) {
  return (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>
        {label}
        {optional ? <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}> · opsional</span> : <span className="p-req">*</span>}
      </span>
      {children}
      {error && <span className="p-help err" role="alert"><P d={D.warn} size={14} />{error}</span>}
      {help && <span className="p-help">{help}</span>}
    </div>
  );
}

/** Pilih-banyak: chip terpilih di dalam `p-input`, daftar pilihan `in-pop`. */
function MultiPick({ label, placeholder, options, value, onChange, error }: { label: string; placeholder: string; options: string[]; value: string[]; onChange: (v: string[]) => void; error?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, ref, () => setOpen(false));
  return (
    <div ref={ref} className="in-cbx">
      <div className={'p-input' + (error ? ' err' : '')} style={{ height: 'auto', minHeight: 40, flexWrap: 'wrap', gap: 6, padding: '6px 8px' }}>
        {value.map((v) => (
          <span key={v} className="p-chip" aria-pressed="true" style={{ height: 28 }}>
            {v}{' '}
            <button type="button" aria-label={`Hapus ${v}`} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'inline-flex' }} onClick={() => onChange(value.filter((x) => x !== v))}>
              <P d={D.close} size={14} />
            </button>
          </span>
        ))}
        <button type="button" className="rv-sel ph" aria-haspopup="listbox" aria-expanded={open} aria-label={label} style={{ flex: 1, width: 'auto', minWidth: 140, background: 'none', padding: 0, height: 28 }} onClick={() => setOpen(!open)}>
          {placeholder}
        </button>
        <Icon name="chevDown" size={16} />
      </div>
      {open && (
        <div className="in-pop" role="listbox" aria-label={label} aria-multiselectable="true">
          {options.map((o) => {
            const on = value.includes(o);
            return (
              <button key={o} type="button" role="option" className={on ? 'op on' : 'op'} aria-selected={on} style={{ minHeight: 44 }} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>
                <span className="t"><b>{o}</b></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SinglePick({ label, placeholder, options, value, onChange, error }: { label: string; placeholder: string; options: string[]; value: string; onChange: (v: string) => void; error?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(open, ref, () => setOpen(false));
  return (
    <div ref={ref} className="in-cbx">
      <button type="button" className={'p-input rv-sel' + (error ? ' err' : '')} aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>
        <span className={value ? '' : 'ph'} style={{ flex: 1 }}>{value || placeholder}</span><Icon name="chevDown" size={16} />
      </button>
      {open && (
        <div className="in-pop" role="listbox" aria-label={label}>
          {options.map((o) => (
            <button key={o} type="button" role="option" className={o === value ? 'op on' : 'op'} aria-selected={o === value} style={{ minHeight: 44 }} onClick={() => { onChange(o); setOpen(false); }}>
              <span className="t"><b>{o}</b></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  form: Closure;
  onChange: (patch: Partial<Closure>) => void;
  showErrors: boolean;
  /** pelapor memilih Manusia terdampak: rincian korban per tingkat bisa diisi */
  hasMan: boolean;
  reportedLoss: number | null;
  reportedHandled: string;
  /** waktu kejadian (batas bawah Waktu operasi pulih) */
  occurredAt: string;
  /** kondisi operasi menurut laporan bukan "Tidak terganggu" */
  opsReported: boolean;
  /** keparahan insiden (Penjelasan penyebab wajib bila Tinggi/Kritis, ADJ-14) */
  severity?: Severity | null;
  /** lama berhenti dari dampak (jam), isian awal LPO */
  stopHours?: number | null;
  kurs?: number;
}

export function ClosureForm({ form, onChange, showErrors, hasMan, reportedLoss, reportedHandled, occurredAt, opsReported, severity, stopHours, kurs = 16500 }: Props) {
  const done = closureDone(form, severity);
  const total = CLOSURE_REQUIRED.length;
  const detailReq = causeDetailRequired(severity);
  const miss = (key: string) => showErrors && CLOSURE_REQUIRED.find((r) => r.key === key && !r.ok(form, severity)) ? `Lengkapi ${CLOSURE_REQUIRED.find((r) => r.key === key)!.label} sebelum menutup insiden.` : undefined;
  const file = useRef<HTMLInputElement>(null);
  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const add = Array.from(list).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), caption: '' }));
    onChange({ evidence: [...(form.evidence ?? []), ...add] });
  };
  const names = form.partnerNames ?? [];
  const cas = form.casualtiesFinal;
  return (
    <>
      <div className="in-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <span className="bar"><i style={{ width: `${(done / total) * 100}%` }}></i></span>
        <span>{done} dari {total} isian wajib</span>
      </div>

      <Req label="Ringkasan penanganan" error={miss('actions')}>
        <textarea className={'p-input p-area' + (miss('actions') ? ' err' : '')} aria-label="Ringkasan penanganan" style={{ minHeight: 88 }} maxLength={MAX_ACTIONS} placeholder="Apa yang dilakukan sampai insiden selesai" value={form.actions} onChange={(e) => onChange({ actions: e.target.value })} />
        <TidyBar label="Ringkasan penanganan" value={form.actions} counter={`${formatNumber(form.actions.length)}/1.000`} onApply={(t) => onChange({ actions: t })} />
      </Req>

      <Req label="Tim terlibat" error={miss('partners')} help={`Siapa saja yang ikut menangani. Pilih mitranya, tanpa nama personel.${reportedHandled ? ` Menurut pelapor: ${reportedHandled}.` : ''} Kontraknya dikonfirmasi Pejabat saat pemeriksaan penutupan.`}>
        <MultiPick label="Tim terlibat" placeholder="Tambah mitra atau Security internal" options={PARTNER_OPTS.map((p) => p.name)} value={names} error={!!miss('partners')} onChange={(v) => onChange({ partnerNames: v, partners: typesOf(v) })} />
      </Req>

      <Req label="Penyebab utama" error={miss('cause') && !form.cause.trim() ? miss('cause') : undefined} help="Pilih satu yang paling menentukan terjadinya insiden. Daftar dari Konfigurasi Insiden (KIN-01).">
        <SinglePick label="Penyebab utama" placeholder="Pilih dari daftar" options={CAUSE_OPTS} value={form.cause} error={!!miss('cause') && !form.cause.trim()} onChange={(v) => onChange({ cause: v })} />
      </Req>

      <Req
        label="Penjelasan penyebab" optional={!detailReq}
        error={showErrors && detailReq && !form.causeDetail?.trim() ? 'Penjelasan penyebab wajib untuk keparahan Tinggi atau Kritis.' : undefined}
        help={detailReq ? 'Wajib karena keparahan Tinggi atau Kritis.' : undefined}
      >
        <textarea className="p-input p-area" aria-label="Penjelasan penyebab" style={{ minHeight: 88 }} maxLength={MAX_CAUSE} placeholder="Jelaskan penyebabnya" value={form.causeDetail ?? ''} onChange={(e) => onChange({ causeDetail: e.target.value })} />
        <TidyBar label="Penjelasan penyebab" value={form.causeDetail ?? ''} counter={`${(form.causeDetail ?? '').length}/500`} onApply={(t) => onChange({ causeDetail: t })} />
      </Req>

      <Req label="Faktor pendukung" optional help="Kondisi lain yang ikut membuat insiden terjadi atau lebih parah. Boleh lebih dari satu.">
        <MultiPick label="Faktor pendukung" placeholder="Tambah faktor" options={FACTOR_OPTS} value={form.factors ?? []} error={false} onChange={(v) => onChange({ factors: v })} />
      </Req>

      <Req label="Bukti penyelesaian" error={miss('evidence')} help="Minimal 1 file: foto kondisi akhir, berita acara, atau laporan polisi.">
        {(form.evidence ?? []).length > 0 && (
          <div className="p-files">
            {(form.evidence ?? []).map((f) => (
              <div className="p-file" key={f.name}>
                <span className="fi">{extLabel(f.name)}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                  <span className="p-cap">{formatSize(f.sizeKb)}</span>
                  {f.caption && <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}><span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {f.caption}</span>}
                </div>
                <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label={`Hapus ${f.name}`} onClick={() => onChange({ evidence: (form.evidence ?? []).filter((x) => x.name !== f.name) })}><P d={D.close} size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <input ref={file} type="file" multiple hidden aria-label="Pilih file bukti" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        {(form.evidence ?? []).length === 0 ? (
          <div className="p-drop" role="button" tabIndex={0} style={miss('evidence') ? { borderColor: 'var(--error-ink)' } : undefined} onClick={() => file.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && file.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <span className="di"><P d={D.upload} size={16} /></span>
            <b>Seret file ke sini atau pilih file</b>
            <span className="p-cap">Foto, PDF, atau DOCX · maks. 10 MB</span>
          </div>
        ) : (
          <button type="button" className="p-btn p-btn-ghost p-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => file.current?.click()}><P d={D.upload} size={16} />Tambah file</button>
        )}
      </Req>

      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Rincian korban per tingkat cedera</span>
        {hasMan ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {KB.filter(([k]) => k !== 'belum').map(([k, label]) => (
              <label key={k} className="p-field" style={{ gap: 4 }}>
                <span className="p-cap">{label}</span>
                <input className="p-input" type="number" min={0} aria-label={`Korban ${label}`} value={cas[k] ?? ''} placeholder="0"
                  onChange={(e) => {
                    const next = { ...cas };
                    if (e.target.value === '') delete next[k];
                    else next[k] = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange({ casualtiesFinal: next });
                  }} />
              </label>
            ))}
          </div>
        ) : (
          <span className="p-input" aria-disabled="true" aria-label="Rincian korban per tingkat cedera: P3K, Perawatan medis, Tidak bisa kerja penuh, Tidak bisa bekerja / cacat, Meninggal" style={{ background: 'var(--surface-subtle)', color: 'var(--ink-muted)' }}>
            <P d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={16} />
            <span style={{ flex: 1 }}>Tidak ada korban · Manusia tidak terdampak menurut laporan</span>
          </span>
        )}
        <span className="p-help">Wajib bila pelapor memilih Manusia terdampak. Level resmi dikoreksi bila berbeda dari laporan awal.</span>
      </div>

      <Req label="Kerugian akhir" optional help={`${reportedLoss ? `Perkiraan pelapor ${formatRupiah(reportedLoss)}. ` : ''}Bila diisi, nilai ini yang dipakai di statistik.`}>
        <label className="p-input">
          <input aria-label="Kerugian akhir" inputMode="numeric" placeholder="Rp" style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }}
            value={form.lossFinalIdr === null ? '' : formatRupiah(form.lossFinalIdr)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange({ lossFinalIdr: digits ? parseInt(digits, 10) : null });
            }} />
        </label>
      </Req>

      <LpoSection value={form.lpo} onChange={(lpo) => onChange({ lpo })} stopHours={stopHours ?? null} kurs={kurs} showErrors={showErrors} />

      <ClosureExtraFields form={form} onChange={onChange} opsReported={opsReported} occurredAt={occurredAt} showErrors={showErrors} />
    </>
  );
}
