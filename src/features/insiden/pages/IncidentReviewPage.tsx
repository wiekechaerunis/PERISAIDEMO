// Board: V12 (+V12b, V12e, V12f, V12g), V21/V21b, V13/V13g, V22, V31, V32, V33, V34, VS1–VS5 — FR-INS-21..28, 43, 55.
// Review/pemeriksaan Pejabat Berwenang untuk insiden berstatus Menunggu pemeriksaan. Rute: /insiden/:no/review.
// Query demo: ?rec=full|few|none|baru, ?state=validasi|sudah-diputus|kosong|memuat|lewat-batas, ?pic=grup.
import { demoNow } from '@/services/mock/clock';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useDemoStore } from '@/services/mock/store';
import { historyIncidents } from '@/services/mock/seedHistory';

import {
  approve, cancelIncident, makeKerawanan, markRestricted, mergeInto, requestRevision, resolveDuplicate, setJenis,
  type DecisionResult,
} from '@/services/mock/workflow';
import { cancelForMerge } from '@/services/mock/workflow.followup';
import { DEMO_USERS } from '@/lib/rbac';
import type { Incident } from '@/services/types';
import { findSimilar, type SimilarMode } from '../logic/similar';
import {
  approveToast, deadlineInfo, duplicateCandidates, initialForm, lateDemoDue, officialCategory, picName, reviewErrors,
  severityChanged, type ReviewForm,
} from '../logic/review';
import { AttachmentsCard, IncidentContentCard, RvToast } from '../components/review/parts';
import { ReviewShell, ReviewSkeleton } from '../components/review/ReviewShell';
import { DecisionCard } from '../components/review/DecisionCard';
import { DuplicateBanner } from '../components/review/DuplicateBanner';
import { NEW_CASE_STEPS, SimilarPanel } from '../components/review/SimilarPanel';
import {
  ApproveDialog, CancelDialog, KerawananDialog, MergeDialog, RestrictedDialog, RevisionDialog,
} from '../components/review/ReviewDialogs';

type Dialog = null | 'approve' | 'merge' | 'revisi' | 'batal' | 'krw' | 'terbatas';
interface Note { text: string; error?: boolean }

const REC_MODES = ['full', 'few', 'none', 'baru'];

export function IncidentReviewPage() {
  const { no = '' } = useParams();
  const [sp] = useSearchParams();
  const state = sp.get('state');
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const [note, setNote] = useState<Note | null>(state === 'sudah-diputus' ? { text: 'Insiden ini sudah diputus Rudi Hartono. Halaman dimuat ulang.', error: true } : null);
  const close = useCallback(() => setNote(null), []);

  let body;
  if (state === 'memuat') body = <ReviewSkeleton />;
  else if (state === 'kosong') body = <EmptyReview kind="kosong" />;
  else if (role !== 'pejabat') body = <EmptyReview kind="peran" />;
  else if (!incident) body = <EmptyReview kind="tidak-ada" />;
  else if (incident.status !== 'review-internal') body = <EmptyReview kind="diputus" no={incident.no} />;
  else body = <ReviewBody key={incident.no} incident={incident} onNote={setNote} />;
  return (
    <>
      {body}
      {note && <RvToast text={note.text} error={note.error} onClose={close} />}
    </>
  );
}

function EmptyReview({ kind, no }: { kind: 'kosong' | 'peran' | 'tidak-ada' | 'diputus'; no?: string }) {
  const msg = {
    kosong: ['Tidak ada insiden yang menunggu pemeriksaan.', 'Insiden baru yang diajukan akan muncul di sini dan di Tugas saya.'],
    peran: ['Layar review hanya untuk Pejabat Berwenang.', 'Ganti peran demo ke Pejabat Berwenang untuk memeriksa insiden.'],
    'tidak-ada': ['Insiden tidak ditemukan.', 'Periksa nomor insiden atau kembali ke daftar Insiden.'],
    diputus: ['Insiden ini tidak lagi menunggu pemeriksaan.', 'Keputusan sudah dicatat. Buka detail insiden untuk melihat hasilnya.'],
  }[kind];
  return (
    <AppShell nav="insiden" title="Insiden" subtitle="Laporan insiden organisasi Anda" action={{ to: '/insiden/baru', label: 'Buat laporan' }}>
      <section className="p-card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
        <div className="p-toolbar"><h2 className="p-h2">Insiden</h2></div>
        {kind === 'kosong' && (
          <div className="lk-quick">
            <div className="p-qf" role="radiogroup">
              <button type="button" role="radio" aria-checked="false">Semua</button>
              <button type="button" role="radio" aria-checked="true">Menunggu pemeriksaan<span className="c">0</span></button>
              <button type="button" role="radio" aria-checked="false">Lewat batas<span className="c">0</span></button>
            </div>
          </div>
        )}
        <div className="lk-es" style={{ flex: 1, justifyContent: 'center', padding: '40px 16px' }}>
          <span style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--surface-sunken)', color: 'var(--ink-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={24} />
          </span>
          <b>{msg[0]}</b>
          <span style={{ color: 'var(--ink-muted)', maxWidth: 300 }}>{msg[1]}</span>
          {kind === 'diputus' && <Link className="p-btn p-btn-secondary" to={`/insiden/${no}`}>Buka detail</Link>}
          {kind !== 'kosong' && kind !== 'diputus' && <Link className="p-btn p-btn-secondary" to="/insiden">Ke daftar Insiden</Link>}
        </div>
      </section>
    </AppShell>
  );
}

function ReviewBody({ incident, onNote }: { incident: Incident; onNote: (n: Note | null) => void }) {
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
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mergeNo, setMergeNo] = useState<string | null>(null);
  const patch = (p: Partial<ReviewForm>) => {
    setServerError(undefined);
    setForm((f) => ({ ...f, ...p }));
  };

  const errors = reviewErrors(form, incident);
  const dueIso = demo === 'lewat-batas' ? lateDemoDue() : (incident.verifyDueAt ?? demoNow());
  const deadline = deadlineInfo(dueIso);

  const pool = useMemo(() => [...allIncidents, ...historyIncidents()], [allIncidents]);
  const similar = useMemo(() => findSimilar(incident, pool, rec === 'baru' ? 'none' : rec), [incident, pool, rec]);
  const newCase = rec === 'baru' || (similar.mode === 'none' && incident.category === 'Lainnya');

  const dups = useMemo(() => (incident.possibleDuplicate ? duplicateCandidates(incident, allIncidents) : []), [incident, allIncidents]);
  const blocked = !!incident.possibleDuplicate && dups.length > 0;

  const fail = (r: Extract<DecisionResult, { ok: false }>) => {
    setDialog(null);
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
    setDialog('approve');
  };
  const confirmApprove = (due: { days: number; reason: string }) => {
    const changed = severityChanged(form, incident);
    const r = decide((s) =>
      approve(s, incident.no, {
        by, category: officialCategory(form), severity: form.severity, severityReason: changed ? form.reason.trim() : undefined,
        priority: form.priority, pic: picName(form), picKind: form.picKind, steps: form.steps, dueDays: due.days, dueReason: due.reason,
      }),
    );
    if (!r.ok) return fail(r);
    if ((form.jenis ?? null) !== (incident.detail?.jenis ?? null)) decide((s) => setJenis(s, incident.no, form.jenis));
    navigate(`/insiden/${incident.no}`, { state: { toast: approveToast(incident.no, form.steps.length, picName(form)) } });
  };
  const confirmMerge = () => {
    if (!mergeNo) return;
    // Gabung membatalkan tindak lanjut anak secara otomatis (T9).
    const r = decide((s) => {
      const m = mergeInto(s, incident.no, mergeNo, by, 'Kejadian yang sama.');
      return m.ok ? cancelForMerge(m.state, incident.no, mergeNo) : m;
    });
    if (!r.ok) return fail(r);
    navigate('/insiden', { state: { toast: `${incident.no} digabung ke ${mergeNo}.` } });
  };
  const link = (parent: string) => {
    const r = decide((s) => resolveDuplicate(s, incident.no, by, parent));
    if (!r.ok) return fail(r);
    onNote({ text: `Ditautkan dengan ${parent}. Lanjut pemeriksaan.` });
  };
  const separate = () => {
    const r = decide((s) => resolveDuplicate(s, incident.no, by, null));
    if (!r.ok) return fail(r);
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
    setDialog(null);
    onNote({ text: 'Insiden ditandai terbatas.' });
  };

  const mergeParent = allIncidents.find((x) => x.no === mergeNo);
  return (
    <ReviewShell
      late={deadline.late}
      actions={{ onRevision: () => setDialog('revisi'), onKerawanan: () => setDialog('krw'), onRestricted: () => setDialog('terbatas'), onCancel: () => setDialog('batal') }}
    >
      {blocked && (
        <DuplicateBanner
          candidates={dups} initiallyClosed={sp.get('daftar') === 'tutup'}
          onMerge={(n) => { setMergeNo(n); setDialog('merge'); }} onLink={link} onSeparate={separate}
        />
      )}
      <div className="lk-grid">
        <div className="c7 lk-stack">
          <IncidentContentCard incident={incident} />
          <AttachmentsCard files={incident.detail?.attachments ?? []} />
          <SimilarPanel
            result={similar} target={incident} steps={form.steps} onToggleStep={toggleStep} pic={picName(form)} newCase={newCase}
            onSetSteps={(steps) => patch({ steps })}
          />
        </div>
        <aside className="c5 lk-stack">
          <DecisionCard
            incident={incident} form={form} onChange={patch} dueIso={dueIso} deadline={deadline} showErrors={showErrors}
            errors={errors} serverError={serverError} blocked={blocked} onApprove={onApprove}
          />
        </aside>
      </div>
      {dialog === 'approve' && <ApproveDialog form={form} defaultDays={deadlines[form.severity]} startIso={demoNow()} onClose={() => setDialog(null)} onConfirm={confirmApprove} />}
      {dialog === 'merge' && mergeParent && <MergeDialog incident={incident} parent={mergeParent} onClose={() => setDialog(null)} onConfirm={confirmMerge} onOther={() => setDialog(null)} />}
      {dialog === 'revisi' && <RevisionDialog incident={incident} onClose={() => setDialog(null)} onConfirm={revisi} />}
      {dialog === 'batal' && <CancelDialog incident={incident} onClose={() => setDialog(null)} onConfirm={batal} />}
      {dialog === 'krw' && <KerawananDialog incident={incident} onClose={() => setDialog(null)} onConfirm={kerawanan} />}
      {dialog === 'terbatas' && <RestrictedDialog incident={incident} pic={picName(form)} onClose={() => setDialog(null)} onConfirm={terbatas} />}
    </ReviewShell>
  );
}
