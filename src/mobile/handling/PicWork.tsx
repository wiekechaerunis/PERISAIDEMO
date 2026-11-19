// Board MP3-DataPenutupan (layar penuh "Tangani insiden": catatan + data penutupan). Logika = WorkView/ClosureForm desktop
// (saveNote, saveClosure, requestClosure, CLOSURE_REQUIRED). Dibuka lewat `?langkah=penutupan`.
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { TidyBar } from '@/features/insiden/components/handling/TidyBar';
import { ClosureExtraFields } from '@/features/insiden/components/handling/ClosureExtraFields';
import { reviewerOptions, reviewerTarget } from '@/lib/rbac';
import { useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { formatNumber, formatRupiah } from '@/lib/format';
import type { Closure, Incident } from '@/services/types';
import {
  CLOSURE_REQUIRED, MAX_NOTE, closureDone, closureMissing, emptyClosure, handlingOf, requestClosure, saveClosure, saveNote,
} from '@/services/mock/workflow.handling';
import { detailOf } from '@/features/insiden/components/detail/detailLogic';
import { KB } from '@/features/insiden/components/step2Data';
import { Ic } from '@/features/insiden/components/review/parts';
import { extLabel, formatSize } from '@/features/insiden/logic/attachments';
import { CAUSE_OPTS, FACTOR_OPTS, PARTNER_OPTS, dueBadge, effectiveDue, typesOf } from '@/features/insiden/logic/handling';
import { MobileShell } from '../ui/MobileShell';
import { P, Sheet, ToastLine, WARN_ERR, shortDay, type ToastM } from './parts';


/** Pemilih dalam sheet: satu atau banyak pilihan (baris `.jn`). */
function PickSheet({ title, options, value, multi, onChange, onClose }: {
  title: string; options: string[]; value: string[]; multi?: boolean; onChange: (v: string[]) => void; onClose: () => void;
}) {
  return (
    <Sheet labelId="pick-t" onClose={onClose} footer={<button type="button" className="p-btn p-btn-primary" onClick={onClose}>Selesai</button>}>
      <b id="pick-t" style={{ fontSize: 17, lineHeight: '24px' }}>{title}</b>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" className="jn" role={multi ? 'checkbox' : 'radio'} aria-checked={on} style={{ width: '100%' }}
            onClick={() => (multi ? onChange(on ? value.filter((x) => x !== o) : [...value, o]) : (onChange([o]), onClose()))}>
            <span className="tx"><b>{o}</b></span>
          </button>
        );
      })}
    </Sheet>
  );
}

function Field({ label, children, help, error, optional }: { label: ReactNode; children: ReactNode; help?: ReactNode; error?: string; optional?: boolean }) {
  return (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>
        {label}
        {optional ? <> <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></> : <span className="p-req">*</span>}
      </span>
      {children}
      {error && WARN_ERR(error)}
      {help && <span className="p-help">{help}</span>}
    </div>
  );
}

const PickInput = ({ label, text, onClick, error }: { label: string; text?: string; onClick: () => void; error?: boolean }) => (
  <button type="button" className={'p-input' + (error ? ' err' : '')} aria-haspopup="dialog" aria-label={label} onClick={onClick} style={{ textAlign: 'left' }}>
    <span style={{ flex: 1, color: text ? undefined : 'var(--ink-subtle)' }}>{text || 'Pilih dari daftar'}</span>
    <Ic d={P.chevDown} size={16} />
  </button>
);

export function PicWork({ i }: { i: Incident }) {
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const me = DEMO_USERS[role].name;
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const h = handlingOf(i);
  const d = detailOf(i);
  const due = effectiveDue(i, null);
  const badge = due ? dueBadge(due) : null;
  const [form, setForm] = useState<Closure>(h.closure ?? emptyClosure());
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [rev, setRev] = useState<string[] | null>(null);
  const [toast, setToast] = useState<ToastM | null>(null);
  const [pick, setPick] = useState<null | 'tim' | 'sebab' | 'faktor'>(null);
  const file = useRef<HTMLInputElement>(null);

  const solo = i.picKind !== 'grup' || h.takenBy === me;
  if (i.status !== 'dalam-penanganan' || !solo) return <Navigate to={`/insiden/${i.no}`} replace />;

  const done = closureDone(form);
  const total = CLOSURE_REQUIRED.length;
  const complete = done === total;
  const miss = (key: string) =>
    showErrors && CLOSURE_REQUIRED.find((r) => r.key === key && !r.ok(form)) ? `Lengkapi ${CLOSURE_REQUIRED.find((r) => r.key === key)!.label} sebelum menutup insiden.` : undefined;
  const update = (patch: Partial<Closure>) => {
    setForm((f) => ({ ...f, ...patch }));
    decide((s) => saveClosure(s, i.no, me, patch));
  };
  const toDetail = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('langkah'); return n; });

  const save = () => {
    if (!note.trim()) return;
    const r = decide((s) => saveNote(s, i.no, me, note));
    if (r.ok) {
      setNote('');
      setToast({ text: 'Catatan ditambahkan ke Riwayat' });
    } else setToast({ text: 'Catatan belum tersimpan. Teks Anda masih ada; coba lagi.', tone: 'err' });
  };
  const submit = () => {
    if (!complete) {
      setShowErrors(true);
      setToast({ text: `Lengkapi ${closureMissing(form).map((m) => m.label).join(', ')} sebelum menutup insiden.`, tone: 'err' });
      return;
    }
    const r = decide((s) => requestClosure(s, i.no, me, rev));
    if (r.ok) navigate(`/insiden/${i.no}`, { state: { toast: `Penutupan diajukan ke ${reviewerTarget(rev, reviewerOptions(me))}` } });
    else setToast({ text: r.reason, tone: 'err' });
  };
  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const add = Array.from(list).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), caption: '' }));
    update({ evidence: [...(form.evidence ?? []), ...add] });
  };
  const handledLabel = d.handledBy.length ? d.handledBy.map((x) => ({ belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' }[x] ?? x)).join(', ') : '';
  const cas = form.casualtiesFinal;
  const names = form.partnerNames ?? [];
  const factors = form.factors ?? [];

  return (
    <MobileShell
      title="Tangani insiden" backTo={`/insiden/${i.no}`} bodyStyle={{ paddingBottom: 96 }}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setToast({ text: 'Draf data penutupan tersimpan.' })}>Simpan draf</button>
          <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={submit}><Ic d={P.tick} size={16} />Ajukan penutupan</button>
        </>
      }
      overlay={
        <>
          {pick === 'tim' && (
            <PickSheet title="Tim terlibat" multi options={PARTNER_OPTS.map((p) => p.name)} value={names} onClose={() => setPick(null)}
              onChange={(v) => update({ partnerNames: v, partners: typesOf(v) })} />
          )}
          {pick === 'sebab' && <PickSheet title="Penyebab" options={CAUSE_OPTS} value={form.cause ? [form.cause] : []} onClose={() => setPick(null)} onChange={(v) => update({ cause: v[0] })} />}
          {pick === 'faktor' && <PickSheet title="Faktor penyebab" multi options={FACTOR_OPTS} value={factors} onClose={() => setPick(null)} onChange={(v) => update({ factors: v })} />}
          <ToastLine toast={toast} onClose={() => setToast(null)} />
        </>
      }
    >
      <Link to={{ search: '' }} className="in-minim" onClick={(e) => { e.preventDefault(); toDetail(); }}>
        <span className="t">
          <span className="p-mono" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{i.no}</span>
          <b>{i.title}</b>
          <span className="p-cap">{due ? `Tenggat ${shortDay(due)}, ${due.slice(11, 16)}` : 'Tenggat belum ditetapkan'}{badge ? ` · ${badge.text}` : ''}</span>
        </span>
        <Ic d={P.chevDown} size={16} />
      </Link>

      <div className="sec">
        <div className="in-wh"><span className="no">1</span><div><h2 style={{ margin: 0, fontSize: 15 }}>Catatan penanganan</h2><span className="p-cap">Bisa berkali-kali selama penanganan.</span></div></div>
        <textarea className="p-input p-area" aria-label="Catatan penanganan" style={{ minHeight: 72, alignItems: 'flex-start' }} maxLength={MAX_NOTE}
          placeholder="Tulis langkah penanganan" value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="p-ibtn" style={{ width: 44, height: 44 }} aria-label="Ambil foto"><Ic d={P.cam} size={18} /></button>
          <button type="button" className="p-ibtn" style={{ width: 44, height: 44 }} aria-label="Lampirkan file"><Ic d={P.clip} size={18} /></button>
          <button type="button" className="p-btn p-btn-secondary" disabled={!note.trim()} style={{ flex: 1, justifyContent: 'center', minHeight: 44 }} onClick={save}>Simpan catatan</button>
        </div>
        <span className="p-cap">{h.notes.length} catatan tersimpan · lihat di Riwayat</span>
      </div>

      <div className="sec">
        <div className="in-wh"><span className="no">2</span><div><h2 style={{ margin: 0, fontSize: 15 }}>Data penutupan</h2><span className="p-cap">Wajib lengkap untuk ajukan penutupan.</span></div></div>
        <div className="in-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <span className="bar"><i style={{ width: `${(done / total) * 100}%` }}></i></span>
          <span>{done} dari {total}</span>
        </div>

        <Field label="Ringkasan penanganan" error={miss('actions')}>
          <textarea className={'p-input p-area' + (miss('actions') ? ' err' : '')} aria-label="Ringkasan penanganan" style={{ minHeight: 96, alignItems: 'flex-start' }} maxLength={1000}
            placeholder="Apa yang dilakukan sampai insiden selesai" value={form.actions} onChange={(e) => update({ actions: e.target.value })} />
          <TidyBar label="Ringkasan penanganan" value={form.actions} counter={`${form.actions.length}/1000`} onApply={(t) => update({ actions: t })} />
        </Field>

        <Field label="Tim terlibat" error={miss('partners')} help={`${handledLabel ? `Menurut pelapor: ${handledLabel}. ` : ''}Pilih mitranya, tanpa nama personel.`}>
          <PickInput label="Tim terlibat" text={names.join(', ')} error={!!miss('partners')} onClick={() => setPick('tim')} />
        </Field>

        <Field label="Penyebab" error={miss('cause')} help="Dari taksonomi PLT-06 (K-05).">
          <PickInput label="Penyebab" text={form.cause} error={!!miss('cause')} onClick={() => setPick('sebab')} />
        </Field>

        <Field label="Penjelasan" optional>
          <textarea className="p-input p-area" aria-label="Penjelasan penyebab" style={{ minHeight: 72, alignItems: 'flex-start' }} maxLength={500}
            placeholder="Jelaskan penyebabnya" value={form.causeDetail ?? ''} onChange={(e) => update({ causeDetail: e.target.value })} />
          <TidyBar label="Penjelasan" value={form.causeDetail ?? ''} counter={`${(form.causeDetail ?? '').length}/500`} onApply={(t) => update({ causeDetail: t })} />
        </Field>

        <Field label="Faktor penyebab" error={miss('factors')}>
          <PickInput label="Faktor penyebab" text={factors.length ? `${factors.length} dipilih` : ''} error={!!miss('factors')} onClick={() => setPick('faktor')} />
        </Field>

        <Field label="Bukti penyelesaian" error={miss('evidence')}>
          {(form.evidence ?? []).length > 0 && (
            <div className="p-files">
              {(form.evidence ?? []).map((f) => (
                <div className="p-file" key={f.name}>
                  <span className="fi">{extLabel(f.name)}</span>
                  <div className="grow">
                    <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                    <span className="p-cap">{formatSize(f.sizeKb)}</span>
                  </div>
                  <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label={`Hapus ${f.name}`}
                    onClick={() => update({ evidence: (form.evidence ?? []).filter((x) => x.name !== f.name) })}>
                    <Ic d="M18 6 6 18M6 6l12 12" size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={file} type="file" multiple hidden aria-label="Pilih file bukti" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="p-btn p-btn-secondary" style={{ flex: 1, justifyContent: 'center', minHeight: 44 }} onClick={() => file.current?.click()}><Ic d={P.cam} size={16} />Ambil foto</button>
            <button type="button" className="p-btn p-btn-secondary" style={{ flex: 1, justifyContent: 'center', minHeight: 44 }} onClick={() => file.current?.click()}><Ic d={P.clip} size={16} />Pilih file</button>
          </div>
        </Field>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Rincian korban per tingkat cedera</span>
          {d.axes.includes('man') ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {KB.filter(([k]) => k !== 'belum').map(([k, label]) => (
                <label key={k} className="p-field" style={{ gap: 4 }}>
                  <span className="p-cap">{label}</span>
                  <input className="p-input" type="number" min={0} aria-label={`Korban ${label}`} value={cas[k] ?? ''} placeholder="0"
                    onChange={(e) => {
                      const next = { ...cas };
                      if (e.target.value === '') delete next[k];
                      else next[k] = Math.max(0, parseInt(e.target.value, 10) || 0);
                      update({ casualtiesFinal: next });
                    }} />
                </label>
              ))}
            </div>
          ) : (
            <span className="p-input" aria-disabled="true" aria-label="Rincian korban per tingkat cedera: P3K, Perawatan medis, Tidak bisa kerja penuh, Tidak bisa bekerja / cacat, Meninggal"
              style={{ height: 'auto', minHeight: 44, background: 'var(--surface-subtle)', color: 'var(--ink-muted)' }}>
              <span style={{ flex: 1 }}>Tidak ada korban · Manusia tidak terdampak menurut laporan</span>
            </span>
          )}
          <span className="p-help">Wajib bila pelapor memilih Manusia terdampak. Level resmi dikoreksi bila berbeda dari laporan awal.</span>
        </div>

        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kerugian akhir <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
          <label className="p-input">
            <span className="affix">Rp</span>
            <input className="num" aria-label="Kerugian akhir" inputMode="numeric" style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }}
              value={form.lossFinalIdr === null ? '' : formatNumber(form.lossFinalIdr)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                update({ lossFinalIdr: digits ? parseInt(digits, 10) : null });
              }} />
          </label>
          {d.lossIdr ? <span className="p-help">Perkiraan pelapor {formatRupiah(d.lossIdr)}.</span> : null}
        </div>

        <ClosureExtraFields form={form} onChange={update} opsReported={!!d.ops && d.ops !== 'tidak'} occurredAt={i.occurredAt} showErrors={showErrors} stack />
      </div>
      <div className="sec"><ReviewerSelect options={reviewerOptions(me)} value={rev} onChange={setRev} /></div>
    </MobileShell>
  );
}
