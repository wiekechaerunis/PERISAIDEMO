// Board mobile: MV2 (Review + Keputusan), MV2m (peta serupa), MV3 (Setujui), MV4/MV4b (Aksi lain, Minta revisi), MV5 (Gabung), MV6 (Batalkan).
// Perilaku sama dengan IncidentReviewPage (desktop): keputusan lewat useDemoStore.decide(...), navigasi dan toast sama.
import { demoNow } from '@/services/mock/clock';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { MobileShell } from '../ui/MobileShell';
import { useDemoStore } from '@/services/mock/store';
import { historyIncidents } from '@/services/mock/seedHistory';

import {
  approve, cancelIncident, makeKerawanan, markRestricted, mergeInto, requestRevision, resolveDuplicate, setJenis,
  PIC_GROUPS, PIC_PEOPLE, type DecisionResult,
} from '@/services/mock/workflow';
import { cancelForMerge } from '@/services/mock/workflow.followup';
import { handlingDeadline } from '@/lib/deadline';
import { DEMO_USERS } from '@/lib/rbac';
import { STATUS_LABEL, type Incident, type Priority } from '@/services/types';
import { SEVERITIES, SEV_DOT, SEV_LABEL, type Severity } from '@/lib/severity';
import { formatNumber, formatWib, formatWibFull } from '@/lib/format';
import { findSimilar, type PatternKey, type SimilarMode } from '@/features/insiden/logic/similar';
import {
  approveToast, deadlineInfo, duplicateCandidates, initialForm, lateDemoDue, officialCategory, picName, reviewErrors,
  severityChanged, severityHelp, MAX_REASON, type ReviewForm,
} from '@/features/insiden/logic/review';
import { KAT, KAT_LAIN, KB, MAX_LAIN, jenisOf } from '@/features/insiden/components/step2Data';
import { Ic, SelectField, SevDot } from '@/features/insiden/components/review/parts';
import { NEW_CASE_STEPS } from '@/features/insiden/components/review/SimilarPanel';
import { SimilarMapScreen, SimilarMobile } from './Similar';
import { ActionsSheet, ApproveSheet, CancelSheet, KerawananSheet, MergeSheet, RestrictedSheet, RevisionSheet } from './Sheets';

type Sheet = null | 'approve' | 'aksi' | 'merge' | 'revisi' | 'batal' | 'krw' | 'terbatas';
interface Note { text: string; error?: boolean }

const REC_MODES = ['full', 'few', 'none', 'baru'];
const PRIORITIES: [Priority, string][] = [['tinggi', 'Tinggi'], ['normal', 'Normal'], ['rendah', 'Rendah']];
const ERR_PATH = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';
const CLOCK = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2';
const DOTS = 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z';
const HANDLED: Record<string, string> = { belum: 'Belum ada', int: 'Tim internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' };

export function MobileReviewPage() {
  const { no = '' } = useParams();
  const [sp] = useSearchParams();
  const state = sp.get('state');
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const [note, setNote] = useState<Note | null>(state === 'sudah-diputus' ? { text: 'Insiden ini sudah diputus Rudi Hartono. Halaman dimuat ulang.', error: true } : null);
  const close = useCallback(() => setNote(null), []);

  let body;
  if (state === 'memuat') body = <Empty title="Review insiden" heading="Memuat insiden…" text="Mohon tunggu sebentar." />;
  else if (state === 'kosong') body = <Empty title="Review insiden" heading="Tidak ada insiden yang menunggu pemeriksaan." text="Insiden baru yang diajukan akan muncul di sini dan di Tugas saya." />;
  else if (role !== 'pejabat') body = <Empty title="Review insiden" heading="Layar review hanya untuk Pejabat Berwenang." text="Ganti peran demo ke Pejabat Berwenang untuk memeriksa insiden." />;
  else if (!incident) body = <Empty title="Review insiden" heading="Insiden tidak ditemukan." text="Periksa nomor insiden atau kembali ke daftar Insiden." />;
  else if (incident.status !== 'review-internal') body = <Empty title="Review insiden" heading="Insiden ini tidak lagi menunggu pemeriksaan." text="Keputusan sudah dicatat. Buka detail insiden untuk melihat hasilnya." to={`/insiden/${incident.no}`} cta="Buka detail" />;
  else body = <ReviewBody key={incident.no} incident={incident} onNote={setNote} note={note} onCloseNote={close} />;
  return body;
}

function Toast({ note, onClose }: { note: Note; onClose: () => void }) {
  return (
    <div className="toastm" onClick={onClose}>
      <div className={note.error ? 'p-toast err' : 'p-toast'} role={note.error ? 'alert' : 'status'}>
        <span className="ti"><Icon name={note.error ? 'close' : 'check'} size={12} /></span>
        <span className="msg">{note.text}</span>
      </div>
    </div>
  );
}

function Empty({ title, heading, text, to, cta }: { title: string; heading: string; text: string; to?: string; cta?: string }) {
  return (
    <MobileShell title={title} backTo="/insiden">
      <div className="lk-es" style={{ justifyContent: 'center', padding: '40px 8px', textAlign: 'center' }}>
        <b>{heading}</b>
        <span style={{ color: 'var(--ink-muted)' }}>{text}</span>
        {to ? <Link className="p-btn p-btn-secondary" to={to}>{cta}</Link> : <Link className="p-btn p-btn-secondary" to="/insiden">Ke daftar Insiden</Link>}
      </div>
    </MobileShell>
  );
}

const opsText = (d: NonNullable<Incident['detail']>) =>
  d.ops === 'berhenti' ? `Berhenti${d.opsHours ? ` ${d.opsHours} jam` : ''}`
    : d.ops === 'sebagian' ? `Terganggu sebagian${d.opsHours ? ` ${d.opsHours} jam` : ''}` : 'Tidak terganggu';
const casualtyText = (d: NonNullable<Incident['detail']>) => {
  const parts = Object.entries(d.casualties).filter(([k, n]) => k === 'belum' || (n ?? 0) > 0)
    .map(([k, n]) => { const kb = KB.find((x) => x[0] === k); return kb ? (k === 'belum' ? kb[1] : `${kb[1]} ${formatNumber(n ?? 0)}`) : ''; })
    .filter(Boolean);
  return parts.length ? parts.join(', ') : 'Tidak terdampak';
};
const rupiahJt = (n: number) => `Rp${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;

function ReviewBody({ incident, onNote, note, onCloseNote }: { incident: Incident; onNote: (n: Note | null) => void; note: Note | null; onCloseNote: () => void }) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const demo = sp.get('state');
  const recParam = sp.get('rec');
  const rec = REC_MODES.includes(recParam ?? '') ? (recParam as SimilarMode | 'baru') : null;
  const allIncidents = useDemoStore((s) => s.incidents);
  const deadlines = useDemoStore((s) => s.config.deadlines);
  const decide = useDemoStore((s) => s.decide);
  const by = DEMO_USERS.pejabat.name;

  const [form, setForm] = useState<ReviewForm>(() => {
    const f = initialForm(incident, sp.get('pic') === 'grup' ? 'grup' : 'perorangan');
    if (demo === 'validasi') return { ...f, severity: f.severity === 'sedang' ? 'rendah' : 'sedang', reason: 'Turun' };
    if (rec === 'baru') return { ...f, steps: NEW_CASE_STEPS.map((s) => s.text) };
    return f;
  });
  const [showErrors, setShowErrors] = useState(demo === 'validasi');
  const [serverError, setServerError] = useState<string>();
  const dups0 = useMemo(() => (incident.possibleDuplicate ? duplicateCandidates(incident, allIncidents) : []), [incident, allIncidents]);
  const blocked = !!incident.possibleDuplicate && dups0.length > 0;
  const [sheet, setSheet] = useState<Sheet>(blocked && sp.get('daftar') !== 'tutup' ? 'merge' : null);
  const [view, setView] = useState<'review' | 'peta'>('review');
  const [pat, setPat] = useState<PatternKey | null>(null);
  const [foldReport, setFoldReport] = useState(false);
  const [foldFiles, setFoldFiles] = useState(true);
  const patch = (p: Partial<ReviewForm>) => {
    setServerError(undefined);
    setForm((f) => ({ ...f, ...p }));
  };

  const errors = reviewErrors(form, incident);
  const dueIso = demo === 'lewat-batas' ? lateDemoDue() : (incident.verifyDueAt ?? demoNow());
  const deadline = deadlineInfo(dueIso);
  const handleDue = handlingDeadline(demoNow(), form.severity, deadlines);

  const pool = useMemo(() => [...allIncidents, ...historyIncidents()], [allIncidents]);
  const similar = useMemo(() => findSimilar(incident, pool, rec === 'baru' ? 'none' : rec), [incident, pool, rec]);
  const newCase = rec === 'baru' || (similar.mode === 'none' && incident.category === 'Lainnya');
  const dups = dups0;

  const fail = (r: Extract<DecisionResult, { ok: false }>) => {
    setSheet(null);
    if (/sudah diputus/i.test(r.reason)) onNote({ text: 'Insiden ini sudah diputus penyetuju lain. Halaman dimuat ulang.', error: true });
    else if (/alasan/i.test(r.reason)) {
      setServerError(r.reason);
      setShowErrors(true);
    } else onNote({ text: r.reason, error: true });
  };
  const toggleStep = (t: string) => patch({ steps: form.steps.includes(t) ? form.steps.filter((x) => x !== t) : [...form.steps, t] });

  const onApprove = () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setSheet('approve');
  };
  const confirmApprove = () => {
    const changed = severityChanged(form, incident);
    const r = decide((s) =>
      approve(s, incident.no, {
        by, category: officialCategory(form), severity: form.severity, severityReason: changed ? form.reason.trim() : undefined,
        priority: form.priority, pic: picName(form), picKind: form.picKind, steps: form.steps,
      }),
    );
    if (!r.ok) return fail(r);
    if ((form.jenis ?? null) !== (incident.detail?.jenis ?? null)) decide((s) => setJenis(s, incident.no, form.jenis));
    navigate(`/insiden/${incident.no}`, { state: { toast: approveToast(incident.no, form.steps.length, picName(form)) } });
  };
  const merge = (parent: string) => {
    // Gabung membatalkan tindak lanjut anak secara otomatis (T9).
    const r = decide((s) => {
      const m = mergeInto(s, incident.no, parent, by, 'Kejadian yang sama.');
      return m.ok ? cancelForMerge(m.state, incident.no, parent) : m;
    });
    if (!r.ok) return fail(r);
    navigate('/insiden', { state: { toast: `${incident.no} digabung ke ${parent}.` } });
  };
  const link = (parent: string) => {
    const r = decide((s) => resolveDuplicate(s, incident.no, by, parent));
    if (!r.ok) return fail(r);
    setSheet(null);
    onNote({ text: `Ditautkan dengan ${parent}. Lanjut pemeriksaan.` });
  };
  const separate = () => {
    const r = decide((s) => resolveDuplicate(s, incident.no, by, null));
    if (!r.ok) return fail(r);
    setSheet(null);
    onNote({ text: 'Tetap sebagai insiden terpisah. Lanjut pemeriksaan.' });
  };
  const revisi = (reason: string) => {
    const r = decide((s) => requestRevision(s, incident.no, by, reason));
    if (!r.ok) return fail(r);
    navigate('/insiden', { state: { toast: `Revisi diminta. ${incident.no} dikembalikan ke pelapor.` } });
  };
  const batal = (reason: string) => {
    const r = decide((s) => cancelIncident(s, incident.no, by, reason));
    if (!r.ok) return fail(r);
    navigate('/insiden', { state: { toast: `Insiden ${incident.no} dibatalkan.` } });
  };
  const kerawanan = (reason: string) => {
    const r = decide((s) => makeKerawanan(s, incident.no, by, reason));
    if (!r.ok) return fail(r);
    const krw = useDemoStore.getState().kerawanan[0];
    navigate('/insiden?tab=kerawanan', { state: { toast: `Kerawanan tercatat sebagai ${krw.no}.${r.skkNotified ? ' SKK Migas diberi tahu.' : ''}` } });
  };
  const terbatas = () => {
    const r = decide((s) => markRestricted(s, incident.no, by));
    if (!r.ok) return fail(r);
    setSheet(null);
    onNote({ text: 'Insiden ditandai terbatas.' });
  };

  if (view === 'peta') {
    return <SimilarMapScreen result={similar} target={incident} pat={pat} onPat={setPat} onBack={() => setView('review')} />;
  }

  const d = incident.detail;
  const filed = incident.timeline?.[0]?.at;
  const files = d?.attachments ?? [];
  const changed = severityChanged(form, incident);
  const jl = jenisOf(form.category);
  const nErr = Object.keys(errors).length + (serverError ? 1 : 0);
  const err = showErrors && nErr > 0;
  const kasusBaru = form.category === KAT_LAIN;
  const grup = form.picKind === 'grup';
  const kota = incident.location.split(' · ')[0];
  const ph = kasusBaru ? 'mis. Drone terlihat dekat panel listrik; perlu penanganan lebih cepat.' : 'mis. Pompa kembali menyala setelah 30 menit; kerugian kecil.';
  const fold = (set: (v: boolean) => void, v: boolean) => ({
    role: 'button' as const, tabIndex: 0, 'aria-expanded': !v, style: { cursor: 'pointer' },
    onClick: () => set(!v), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!v); } },
  });
  const mergeSheet = sheet === 'merge' && (
    <MergeSheet candidates={dups} onClose={() => setSheet(null)} onMerge={merge} onLink={link} onSeparate={separate} />
  );

  return (
    <MobileShell
      title="Review insiden" backTo="/insiden"
      actions={
        <button type="button" className="ib44" aria-label="Aksi lain: Jadikan kerawanan, Batalkan, Tandai terbatas" onClick={() => setSheet('aksi')}>
          <Ic d={DOTS} size={20} />
        </button>
      }
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" aria-label="Minta revisi dan aksi lain" style={{ width: 48, padding: 0, justifyContent: 'center' }} onClick={() => setSheet('aksi')}>
            <Ic d={DOTS} size={18} />
          </button>
          <button
            type="button" className="p-btn p-btn-primary" aria-disabled={blocked} onClick={() => !blocked && onApprove()}
            style={{ flex: 1, justifyContent: 'center', ...(blocked ? { opacity: 0.45, pointerEvents: 'none' } : {}) }}
          >
            Setujui
          </button>
        </>
      }
      overlay={
        <>
          {sheet === 'approve' && <ApproveSheet form={form} dueIso={handleDue} onClose={() => setSheet(null)} onConfirm={confirmApprove} />}
          {sheet === 'aksi' && (
            <ActionsSheet
              onClose={() => setSheet(null)}
              onPick={(k) => setSheet(k)}
            />
          )}
          {mergeSheet}
          {sheet === 'revisi' && <RevisionSheet onClose={() => setSheet(null)} onConfirm={revisi} />}
          {sheet === 'batal' && <CancelSheet incident={incident} onClose={() => setSheet(null)} onConfirm={batal} />}
          {sheet === 'krw' && <KerawananSheet incident={incident} onClose={() => setSheet(null)} onConfirm={kerawanan} />}
          {sheet === 'terbatas' && <RestrictedSheet incident={incident} pic={picName(form)} onClose={() => setSheet(null)} onConfirm={terbatas} />}
          {note && <Toast note={note} onClose={onCloseNote} />}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <b style={{ fontSize: 20, lineHeight: '28px' }}>{incident.title}</b>
        <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{incident.no}</span>
        <div style={{ display: 'flex', gap: 6 }}><span className="p-tag t-info">{STATUS_LABEL[incident.status]}</span></div>
      </div>

      {blocked && (
        <div className="in-bn caution" role="region" aria-label="Kemungkinan laporan ganda">
          <Ic d={ERR_PATH} size={16} />
          <div className="body">
            <b>Sepertinya sudah dilaporkan.</b> {dups.length} insiden berkategori sama di dekat lokasi ini. Putuskan dulu sebelum menyetujui.
            <div className="acts"><button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ background: 'var(--surface)' }} onClick={() => setSheet('merge')}>Pilih tindakan</button></div>
          </div>
        </div>
      )}

      <div className="sec" style={{ gap: 8 }}>
        <div className="hd" {...fold(setFoldReport, foldReport)}>
          <h2>Laporan pelapor</h2>
          <span className="p-cap">{incident.reporter}{filed ? ` · ${formatWib(filed).split(', ')[1]}` : ''}</span>
          <Ic d={foldReport ? 'm6 9 6 6 6-6' : 'M18 15l-6-6-6 6'} size={18} />
        </div>
        {!foldReport && (
          <>
            <dl className="kv">
              <dt>Waktu kejadian</dt><dd>{formatWibFull(incident.occurredAt)}</dd>
              <dt>Lokasi</dt><dd>{kota} · {incident.wk}</dd>
              <dt>Dampak</dt><dd>{d?.securityImpact || incident.title}</dd>
              <dt>Sudah menangani</dt><dd>{d?.handledBy.length ? d.handledBy.map((h) => HANDLED[h] ?? h).join(', ') : 'Belum ada'} (menurut pelapor)</dd>
            </dl>
            <div className="stats">
              <div><span className="k">Operasi</span><b>{d ? opsText(d) : 'Tidak terganggu'}</b></div>
              <div><span className="k">Korban</span><b>{d ? casualtyText(d) : 'Tidak terdampak'}</b></div>
              <div><span className="k">Kerugian</span><b>{d?.lossIdr ? rupiahJt(d.lossIdr) : 'Belum diisi'}</b></div>
            </div>
          </>
        )}
      </div>

      <div className="sec" style={{ gap: 8 }}>
        <div className="hd" {...fold(setFoldFiles, foldFiles)}>
          <h2>Lampiran</h2>
          <span className="p-cap">{files.length} file</span>
          <Ic d={foldFiles ? 'm6 9 6 6 6-6' : 'M18 15l-6-6-6 6'} size={18} />
        </div>
        {!foldFiles && (files.length === 0 ? <span className="p-cap">Tidak ada lampiran.</span> : (
          <div className="p-files">
            {files.map((f) => (
              <div className="p-file" key={f.name}>
                <span className="fi">{(f.name.split('.').pop() ?? '').toUpperCase()}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                  {f.caption && <span className="p-cap">{f.caption}</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <SimilarMobile
        result={similar} target={incident} steps={form.steps} onToggleStep={toggleStep} pic={picName(form)} pat={pat}
        onOpenMap={() => setView('peta')} newCase={newCase} onSetSteps={(steps) => patch({ steps })}
      />

      <div className="sec in-warn-card" style={{ background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', borderColor: 'color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
            <Ic d={ERR_PATH} size={15} />
          </span>
          <h2 style={{ margin: 0, fontSize: 15 }}>Butuh keputusan pemeriksaan</h2>
        </div>
        {err ? (
          <div className="in-bn err" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
            <Ic d={ERR_PATH} size={16} />
            <div className="body" role="alert"><b>{nErr} isian perlu dilengkapi.</b></div>
          </div>
        ) : deadline.late ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--caution-ink)', fontSize: 12, lineHeight: '17px' }}>
            <Ic d={CLOCK} size={14} />{deadline.text} · {formatWibFull(dueIso)}
          </span>
        ) : (
          <span className="p-cap" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Ic d={CLOCK} size={14} />Batas {formatWibFull(dueIso)} · {deadline.text}
          </span>
        )}
        <SelectField
          label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Kategori<span className="p-req">*</span></span>}
          ariaLabel="Kategori" display={form.category} group={`Kategori insiden · ${KAT.length} pilihan`} selected={form.category}
          options={KAT.map(([, l, c]) => ({ key: l, label: l, caption: c }))} onPick={(k) => patch({ category: k, jenis: null })}
        />
        {jl.length > 0 && (
        <SelectField
          label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis</span>}
          ariaLabel="Jenis" disabled={!jl.length} placeholder={!jl.length || !form.jenis}
          display={!jl.length ? 'Tidak ada jenis untuk kategori ini' : (form.jenis ?? 'Pilih jenis')} group={`Jenis · ${form.category}`} selected={form.jenis}
          options={jl.map((l) => ({ key: l, label: l }))} onPick={(k) => patch({ jenis: k })}
        />
        )}
        {kasusBaru && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Sebutkan kategori<span className="p-req">*</span></span>
            <span className={'p-input' + (err && errors.categoryOther ? ' err' : '')}>
              <input
                aria-label="Sebutkan kategori" maxLength={MAX_LAIN} value={form.categoryOther} onChange={(e) => patch({ categoryOther: e.target.value })}
                style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0, width: '100%' }}
              />
            </span>
            {err && errors.categoryOther && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{errors.categoryOther}</span>}
          </div>
        )}
        <SelectField
          label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Keparahan resmi<span className="p-req">*</span></span>}
          ariaLabel="Keparahan resmi" lead={<SevDot dot={SEV_DOT[form.severity]} />}
          display={<b style={{ fontWeight: 600 }}>{SEV_LABEL[form.severity]}</b>}
          selected={form.severity} onPick={(k) => patch({ severity: k as Severity })}
          options={SEVERITIES.map((s) => ({ key: s, label: SEV_LABEL[s], lead: <SevDot dot={SEV_DOT[s]} /> }))}
          help={<span className="p-help">{severityHelp(incident)}</span>}
        />
        {changed && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan perubahan keparahan<span className="p-req">*</span></span>
            <textarea
              className={'p-input p-area' + (err && errors.reason ? ' err' : '')} aria-label="Alasan perubahan keparahan" maxLength={MAX_REASON}
              placeholder={ph} value={form.reason} onChange={(e) => patch({ reason: e.target.value })} style={{ minHeight: err && errors.reason ? 88 : 64 }}
            />
            {err && errors.reason ? (
              <span className="p-help err" role="alert"><Icon name="warn" size={14} />{errors.reason}</span>
            ) : (
              <span className="p-help row"><span>Keparahan awal dan resmi tampil berdampingan di Detail.</span><span>{form.reason.length}/{MAX_REASON}</span></span>
            )}
          </div>
        )}
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Prioritas<span className="p-req">*</span></span>
          <div className="in-chips">
            {PRIORITIES.map(([k, l]) => (
              <button key={k} type="button" className="p-chip" aria-pressed={form.priority === k} style={{ minHeight: 44 }} onClick={() => patch({ priority: k })}>{l}</button>
            ))}
          </div>
          <span className="p-help">Hanya urutan antrean.</span>
        </div>
        <div className="p-field">
          <div className="in-pic-hd">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC penanganan<span className="p-req">*</span></span>
            <div className="in-seg" role="radiogroup" aria-label="Jenis PIC">
              <button type="button" role="radio" aria-checked={!grup} className={!grup ? 'on' : ''} style={{ minHeight: 36 }} onClick={() => patch({ picKind: 'perorangan' })}>Perorangan</button>
              <button type="button" role="radio" aria-checked={grup} className={grup ? 'on' : ''} style={{ minHeight: 36 }} onClick={() => patch({ picKind: 'grup' })}>Grup</button>
            </div>
          </div>
          {grup ? (
            <SelectField
              label={null} ariaLabel="PIC penanganan"
              display={(() => { const g = PIC_GROUPS.find((x) => x.name === form.group) ?? PIC_GROUPS[0]; return `${g.name} · ${g.caption}`; })()}
              selected={form.group} onPick={(k) => patch({ group: k })} options={PIC_GROUPS.map((g) => ({ key: g.name, label: g.name, caption: g.caption }))}
              help={<span className="p-help">Semua anggota diberi tahu. Anggota pertama yang mengambil alih menjadi PIC; anggota lain hanya bisa melihat.</span>}
            />
          ) : (
            <SelectField
              label={null} ariaLabel="PIC penanganan" display={form.person}
              selected={form.person} onPick={(k) => patch({ person: k })} options={PIC_PEOPLE.map((p) => ({ key: p.name, label: p.name, caption: p.caption }))}
              help={<span className="p-help">Cakupannya meliputi {incident.wk}.</span>}
            />
          )}
        </div>
      </div>
    </MobileShell>
  );
}
