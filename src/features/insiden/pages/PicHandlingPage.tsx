// Halaman kerja PIC penanganan. Board: P12 (detail PIC), P12g/P12h (PIC grup), P14 (Tangani), P15 (Eskalasi), P16 (Data penutupan),
// P17 (Menunggu penutupan), PS1 (Lewat tenggat), PS2/PS3 (Kronologi kosong/gagal), PS4 (Catatan gagal), PS6 (Data belum lengkap),
// PS9 (Memuat), PS11 (Dikembalikan). `?state=lewat-tenggat|kronologi-kosong|kronologi-gagal|catatan-gagal|belum-lengkap|memuat|dikembalikan`.
// Rute: /insiden/:no (detail) dan /insiden/:no/tangani (halaman kerja); mode dibaca dari path.
import { demoNow } from '@/services/mock/clock';
import { ReviewerSelect } from '@/components/ui/ReviewerSelect';
import { reviewerBy, reviewerOptions, reviewerTarget } from '@/lib/rbac';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { formatDateShort, formatWibFull } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG, type Closure, type Incident } from '@/services/types';
import {
  closureDone, emptyClosure, escalate, handlingOf, requestClosure, respondStep, saveClosure, saveNote, takeOver, MAX_NOTE, CLOSURE_REQUIRED,
} from '@/services/mock/workflow.handling';
import { DetailShell, type ToastMsg } from '../components/detail/DetailShell';
import { IncidentSummaryCard } from '../components/detail/IncidentSummaryCard';
import { AttachmentsCard } from '../components/detail/AttachmentsCard';
import { RestrictedView } from '../components/detail/StateViews';
import { detailOf, accessOf } from '../components/detail/detailLogic';
import { HandlingLoading, HandlingShell } from '../components/handling/HandlingShell';
import {
  AuditPanel, ClosureReadonly, D, DueCard, EscalateDialog, EscalationCard, HistoryCard, HistoryItem, NextStepCard, PicSummaryCard,
  type HFilter,
} from '../components/handling/parts';
import { ClosureForm } from '../components/handling/ClosureForm';
import { Ic as P } from '../components/review/parts';
import { collapseHistory, effectiveDue, historyEntries, isOverdue, isPicOf, parseState, picMode, PEJABAT_NAME, DEMO_RETURN, SAMPLE_CLOSURE, typesOf, dueBadge, type HandlingState } from '../logic/handling';

import { TlCard } from '@/features/tindak-lanjut/components/TlCard';
import { AddTlHost } from '@/features/tindak-lanjut/components/AddTlHost';

const SAMPLE_NOTE = 'Gembok panel diganti tipe anti potong. Kunci dipegang Danru.';
const ERR_NOTE = 'Catatan belum tersimpan. Teks Anda masih ada; coba lagi.';

const PREVIEW_CLOSURE: Closure = {
  ...emptyClosure(), ...SAMPLE_CLOSURE, cause: 'Celah pengamanan fisik',
  partnerNames: ['PT Garda Nusantara Sejahtera · BUJP', 'Polres Musi Banyuasin · Polri'], partners: ['bujp', 'polri'],
  evidence: [{ name: 'pompa-menyala.jpg', sizeKb: 2150, caption: 'Kondisi akhir pompa' }, { name: 'berita-acara-penggantian.pdf', sizeKb: 640, caption: 'Berita acara penggantian kabel' }],
  lossFinalIdr: 21_400_000,
};

/** `incidentNo` dan `tlNew` dipakai rute /tindak-lanjut/baru (T1/T1b): halaman Tangani dengan dialog Tambah tindak lanjut terbuka. */
export function PicHandlingPage({ mode, incidentNo, tlNew }: { mode?: 'detail' | 'tangani'; incidentNo?: string; tlNew?: { dari: string | null; langkah: string | null } }) {
  const { no: routeNo = '' } = useParams();
  const no = incidentNo ?? routeNo;
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const all = useDemoStore((s) => s.incidents);
  const incident = all.find((i) => i.no === no);
  const st = parseState(params.get('state'));
  const clearState = () => {
    const p = new URLSearchParams(params);
    p.delete('state');
    setParams(p, { replace: true });
  };
  const m = mode ?? (pathname.endsWith('/tangani') ? 'tangani' : 'detail');

  if (st === 'memuat') {
    return (
      <HandlingShell title={m === 'tangani' ? 'Tangani insiden' : 'Detail insiden'} busy><HandlingLoading /></HandlingShell>
    );
  }
  if (!incident || accessOf(incident, role) === 'terbatas' || !isPicOf(incident, role)) {
    return (
      <DetailShell title="Insiden" crumb={false} bell={false} centered><RestrictedView /></DetailShell>
    );
  }
  const tlSpec = tlNew ?? (params.get('tl') ? { dari: params.get('tl'), langkah: params.get('langkah') } : null);
  return (
    <>
      {m === 'tangani' ? <WorkView i={incident} st={st} clearState={clearState} /> : <DetailView i={incident} st={st} clearState={clearState} />}
      {tlSpec && <AddTlHost incident={incident} dari={tlSpec.dari} langkah={tlSpec.langkah} fromRoute={!!tlNew} />}
    </>
  );
}

export const PicWorkPage = () => <PicHandlingPage mode="tangani" />;

const statusTags = (i: Incident, escalated: boolean) => (
  <>
    {i.status === 'minta-ditutup' ? (
      <>
        <span className="p-tag t-info">Dalam penanganan</span>
        <span className="p-tag t-caution">Minta ditutup</span>
      </>
    ) : (
      <span className={`p-tag ${STATUS_TAG[i.status]}`}>{STATUS_LABEL[i.status]}</span>
    )}
    {escalated && <span className="p-tag t-caution">Dieskalasi</span>}
  </>
);

/* ============================ Detail (P12 ...) ============================ */

function DetailView({ i, st, clearState }: { i: Incident; st: HandlingState | null; clearState: () => void }) {
  const role = useDemoStore((s) => s.role);
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const me = DEMO_USERS[role].name;
  const h = handlingOf(i);
  const mode = picMode(i, me);
  const due = effectiveDue(i, st);
  const overdue = isOverdue(due);
  const manual = !!h.escalatedTo;
  const escalated = manual || overdue || !!i.escalated;
  const working = i.status === 'dalam-penanganan';
  const d = detailOf(i);

  const [filter, setFilter] = useState<HFilter>('semua');
  const [expanded, setExpanded] = useState(false);
  const [audit, setAudit] = useState(false);
  const [dlg, setDlg] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const hideNotes = st === 'kronologi-kosong';
  const entries = historyEntries(i, due, hideNotes);
  const noteCount = hideNotes ? 0 : h.notes.length;
  const filtered = entries.filter((e) => (filter === 'catatan' ? e.kind === 'note' || e.kind === 'wa' : filter === 'perubahan' ? e.kind === 'sys' || e.kind === 'esc' : true));
  const { shown, hidden } = collapseHistory(filtered, expanded);

  const stored = h.closure;
  const returnedReason = working && stored?.returnReason ? { text: stored.returnReason, by: PEJABAT_NAME, at: stored.requestedAt ?? demoNow() } : st === 'dikembalikan' ? DEMO_RETURN : null;
  const closure = stored && closureDone(stored) === CLOSURE_REQUIRED.length ? stored : st === 'dikembalikan' ? PREVIEW_CLOSURE : undefined;
  const krw = i.fromKrw ? kerawanan.find((k) => k.no === i.fromKrw) : undefined;

  const escalatedLine = manual ? `dieskalasi ke ${h.escalatedName ?? h.escalatedTo}` : overdue || i.escalated ? `dieskalasi otomatis ke ${PEJABAT_NAME}` : 'belum dieskalasi';
  const decide = useDemoStore.getState().decide;

  const doTake = () => {
    const r = decide((s) => takeOver(s, i.no, me));
    setToast(r.ok ? { text: 'Anda mengambil alih penanganan. Anggota lain diberi tahu.' } : { text: r.reason, tone: 'err' });
  };
  const [, setSp] = useSearchParams();
  const doStep = (step: string, as: 'done' | 'ignored' | null) => {
    // Jadikan tindak lanjut: buka form T1b dengan isi dari saran; langkah baru ditandai selesai setelah disimpan.
    if (as === 'done') {
      setSp((p) => {
        const n = new URLSearchParams(p);
        n.set('tl', 'saran');
        n.set('langkah', step);
        return n;
      });
      return;
    }
    decide((s) => respondStep(s, i.no, step, as));
  };
  const doEscalate = (a: { to: 'pejabat' | 'skk'; name: string; reason: string }): string | null => {
    const r = decide((s) => escalate(s, i.no, me, a));
    if (!r.ok) return r.reason;
    setDlg(false);
    setToast({ text: `Insiden dieskalasi ke ${a.name.split(' · ')[0]}.` });
    return null;
  };

  const tangani = (
    <Link to={`/insiden/${i.no}/tangani`} className="p-btn p-btn-primary">
      {returnedReason ? 'Perbaiki data penutupan' : 'Tangani insiden'}<P d={D.arrow} size={16} />
    </Link>
  );
  const acts = working || i.status === 'minta-ditutup'
    ? mode === 'grup-lain' ? null : (
      <button type="button" className="p-btn p-btn-secondary" onClick={() => setDlg(true)}><P d={D.esc} size={16} />Eskalasi</button>
    ) : null;

  const history = (
    <HistoryCard
      entries={entries} shown={shown} hidden={hidden} expanded={expanded} onToggle={() => setExpanded((v) => !v)} filter={filter}
      onFilter={(f) => { setFilter(f); setExpanded(false); }} onAudit={() => setAudit(true)} failed={st === 'kronologi-gagal'} onRetry={clearState}
      empty={noteCount === 0 && st !== 'kronologi-gagal'}
    />
  );
  const files = d.attachments;

  /* P17: menunggu penutupan */
  if (i.status === 'minta-ditutup' && stored) {
    const last = entries.find((e) => e.kind === 'note');
    const req = stored.requestedAt ?? demoNow();
    return (
      <HandlingShell title="Detail insiden" tags={statusTags(i, escalated)} acts={acts} toast={toast} onToastClose={() => setToast(null)}
        overlay={<>{dlg && <EscalateDialog onClose={() => setDlg(false)} onConfirm={doEscalate} />}{audit && <AuditPanel incident={i} due={due} onClose={() => setAudit(false)} />}</>}>
        <div className="lk-grid">
          <div className="c8 lk-stack">
            <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
              <P d={D.info} size={16} />
              <div className="body"><b>Menunggu ditutup oleh {reviewerBy(stored.reviewers)}.</b> Diajukan {formatDateShort(req)}, {req.slice(11, 16)} · batas tinjau 2 hari kerja.</div>
            </div>
            <ClosureReadonly c={stored} reported={d.lossIdr} />
            <details className="in-fold">
              <summary>
                <span className="t"><b>Isi laporan &amp; lampiran</b><span className="p-cap">{i.title} · {i.severity ? SEV_LABEL[i.severity] : '-'} · {files.length} file</span></span>
                <span className="chev"><P d={D.chev} size={16} /></span>
              </summary>
              <div className="fb"><IncidentSummaryCard incident={i} />{files.length > 0 && <AttachmentsCard files={files} />}</div>
            </details>
            <details className="in-fold">
              <summary>
                <span className="t"><b>Riwayat · {entries.length}</b><span className="p-cap">{last ? `Terakhir: ${last.bold} ${last.rest?.replace(' · ', '')}, ${last.tm}` : 'Belum ada catatan'}</span></span>
                <span className="chev"><P d={D.chev} size={16} /></span>
              </summary>
              <div className="fb">{history}</div>
            </details>
          </div>
          <aside className="c4 lk-stack">
            <DueCard i={i} due={due} />
            <PicSummaryCard i={i} mode={mode} closureNames={stored.partnerNames} />
            <TlCard i={i} canAdd={(i.status as string) === 'dalam-penanganan' || (i.status as string) === 'minta-ditutup'} />
          </aside>
        </div>
      </HandlingShell>
    );
  }

  return (
    <HandlingShell title="Detail insiden" tags={statusTags(i, escalated)} acts={acts} toast={toast} onToastClose={() => setToast(null)}
      overlay={<>{dlg && <EscalateDialog onClose={() => setDlg(false)} onConfirm={doEscalate} />}{audit && <AuditPanel incident={i} due={due} onClose={() => setAudit(false)} />}</>}>
      <div className="lk-grid">
        <div className="c8 lk-stack">
          {mode === 'grup-lain' && (
            <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
              <P d={D.eye} size={16} />
              <div className="body">Penanganan sudah diambil alih <b>{h.takenBy}</b> dari {i.pic ?? 'grup'}, {takenAt(i)}. Anda hanya bisa melihat.</div>
            </div>
          )}
          <IncidentSummaryCard incident={i} />
          {files.length > 0 && <AttachmentsCard files={files} />}
          {history}
          {closure && returnedReason && <ClosureReadonly c={closure} reported={d.lossIdr} />}
        </div>
        <aside className="c4 lk-stack">
          {mode === 'grup-lain' ? (
            <DueCard i={i} due={due} />
          ) : working ? (
            <NextStepCard
              i={i} mode={mode} due={due} escalatedLine={escalatedLine} notesCount={noteCount}
              closure={stored ?? (st === 'dikembalikan' ? PREVIEW_CLOSURE : undefined)} returned={returnedReason}
              onTake={doTake} onStep={doStep} onTangani={tangani}
            />
          ) : (
            <DueCard i={i} due={due} />
          )}
          <PicSummaryCard i={i} mode={mode} closureNames={returnedReason ? (closure ?? stored)?.partnerNames : undefined} />
          {escalated && mode !== 'grup-lain' && <EscalationCard i={i} due={due} auto={!manual} />}
          {mode !== 'grup-lain' && mode !== 'grup-belum' && <TlCard i={i} canAdd={(i.status as string) === 'dalam-penanganan' || (i.status as string) === 'minta-ditutup'} />}
          {krw && (
            <section className="p-card in-sec">
              <h2 className="in-h">Tautan</h2>
              <a href="#krw" className="in-dup" style={{ textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
                <span className="in-mi"><P d={D.doc} size={16} /></span>
                <span className="t"><b>{krw.title}</b><span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{krw.no} · Kerawanan</span></span>
              </a>
            </section>
          )}
        </aside>
      </div>
    </HandlingShell>
  );
}

function takenAt(i: Incident): string {
  const e = (i.timeline ?? []).find((t) => t.text.startsWith('Mengambil alih'));
  return e ? `${formatDateShort(e.at)} ${e.at.slice(11, 16)}` : 'baru saja';
}

/* ============================ Tangani (P14, P16, PS4, PS6) ============================ */

function WorkView({ i, st, clearState }: { i: Incident; st: HandlingState | null; clearState: () => void }) {
  const role = useDemoStore((s) => s.role);
  const me = DEMO_USERS[role].name;
  const navigate = useNavigate();
  const h = handlingOf(i);
  const mode = picMode(i, me);
  const d = detailOf(i);
  const due = effectiveDue(i, st);
  const decide = useDemoStore.getState().decide;

  const initial: Closure = h.closure ?? (st === 'belum-lengkap' ? { ...emptyClosure(), ...SAMPLE_CLOSURE, partners: typesOf(SAMPLE_CLOSURE.partnerNames) } : emptyClosure());
  const [form, setForm] = useState<Closure>(initial);
  const [open, setOpen] = useState(closureDone(initial) > 0 || st === 'belum-lengkap' || !!h.closure?.returnReason);
  const [rev, setRev] = useState<string[] | null>(null);
  const [showErrors, setShowErrors] = useState(st === 'belum-lengkap');
  const [note, setNote] = useState(st === 'catatan-gagal' ? SAMPLE_NOTE : '');
  const [noteErr, setNoteErr] = useState(st === 'catatan-gagal');
  const [toast, setToast] = useState<ToastMsg | null>(st === 'catatan-gagal' ? { text: ERR_NOTE, tone: 'err' } : null);
  const [detail, setDetail] = useState(false);
  const [dlg, setDlg] = useState(false);

  if (i.status !== 'dalam-penanganan' || mode === 'grup-belum' || mode === 'grup-lain') return <Navigate to={`/insiden/${i.no}`} replace />;

  const entries = historyEntries(i, due, false);
  const recent = entries.filter((e) => e.kind === 'note' || e.kind === 'wa').slice(0, 3);
  const done = closureDone(form);
  const complete = done === CLOSURE_REQUIRED.length;
  const badge = due ? dueBadge(due) : null;

  const update = (patch: Partial<Closure>) => {
    setForm((f) => ({ ...f, ...patch }));
    decide((s) => saveClosure(s, i.no, me, patch));
  };
  const save = () => {
    if (!note.trim()) return;
    const r = decide((s) => saveNote(s, i.no, me, note));
    if (r.ok) {
      setNote('');
      setNoteErr(false);
      if (st === 'catatan-gagal') clearState();
      setToast({ text: 'Catatan ditambahkan ke Riwayat' });
    } else {
      setNoteErr(true);
      setToast({ text: ERR_NOTE, tone: 'err' });
    }
  };
  const submit = () => {
    if (!complete) {
      setShowErrors(true);
      return;
    }
    const r = decide((s) => requestClosure(s, i.no, me, rev));
    if (r.ok) navigate(`/insiden/${i.no}`, { state: { toast: `Penutupan diajukan ke ${reviewerTarget(rev, reviewerOptions(me))}` } });
    else setToast({ text: r.reason, tone: 'err' });
  };
  const doEscalate = (a: { to: 'pejabat' | 'skk'; name: string; reason: string }): string | null => {
    const r = decide((s) => escalate(s, i.no, me, a));
    if (!r.ok) return r.reason;
    setDlg(false);
    setToast({ text: `Insiden dieskalasi ke ${a.name.split(' · ')[0]}.` });
    return null;
  };

  const acts = <button type="button" className="p-btn p-btn-secondary" onClick={() => setDlg(true)}><P d={D.esc} size={16} />Eskalasi</button>;
  const sev = i.severity;
  const handledLabel = d.handledBy.length ? d.handledBy.map((x) => ({ belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' }[x] ?? x)).join(', ') : '';

  return (
    <HandlingShell
      title="Tangani insiden" backTo={`/insiden/${i.no}`} acts={acts} toast={toast} onToastClose={() => setToast(null)}
      crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: i.no, to: `/insiden/${i.no}` }, { label: 'Tangani insiden' }]}
      overlay={<>
        {dlg && <EscalateDialog onClose={() => setDlg(false)} onConfirm={doEscalate} />}
        {detail && (
          <>
            <div className="lk-scrim" onClick={() => setDetail(false)}></div>
            <aside className="lk-side wide" role="dialog" aria-modal="true" aria-label="Detail insiden">
              <div className="sh">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 16 }}>Detail insiden</b><span className="p-cap">Hanya dibaca. Isian Anda tetap tersimpan.</span></div>
                <button type="button" className="p-ibtn ghost" style={{ width: 32, height: 32 }} aria-label="Tutup panel" onClick={() => setDetail(false)}><P d={D.close} size={16} /></button>
              </div>
              <div className="sb" style={{ overflow: 'auto' }}>
                <IncidentSummaryCard incident={i} />
                {d.attachments.length > 0 && <AttachmentsCard files={d.attachments} />}
              </div>
            </aside>
          </>
        )}
      </>}
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <section className="p-card in-sec">
            <div className="in-wh"><span className="no">1</span><div><h2 className="in-h">Catatan penanganan</h2><span className="p-cap">Bisa berkali-kali selama penanganan.</span></div></div>
            <div className="in-compose">
              <textarea
                className={'p-input p-area' + (noteErr ? ' err' : '')} aria-label="Catatan penanganan" style={{ minHeight: 88, alignItems: 'flex-start' }} maxLength={MAX_NOTE}
                placeholder="Tulis langkah penanganan, mis. lapor polisi atau perbaikan" value={note} onChange={(e) => setNote(e.target.value)}
              />
              {noteErr && <span style={{ color: 'var(--error-ink)', fontSize: 12 }}>{ERR_NOTE}</span>}
              <div className="row">
                <button type="button" className="p-btn p-btn-ghost p-btn-sm"><P d={D.clip} size={16} />Lampirkan</button>
                {noteErr ? (
                  <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={save}><P d={D.retry} size={16} />Coba simpan lagi</button>
                ) : (
                  <button type="button" className="p-btn p-btn-secondary p-btn-sm" disabled={!note.trim()} onClick={save}>Simpan catatan</button>
                )}
              </div>
            </div>
            <div className="lk-divider" style={{ margin: '2px 0' }}></div>
            <span className="p-lbl">Catatan terakhir</span>
            <ol className="p-tl in-kr" aria-label="Catatan terakhir">
              {recent.map((e) => <HistoryItem key={e.key} e={e} />)}
            </ol>
            <Link to={`/insiden/${i.no}`} className="lk-alink" style={{ fontSize: 12 }}>Semua catatan ada di Riwayat ({entries.length})</Link>
          </section>

          <section className="p-card in-sec">
            <div className="in-wh"><span className="no">2</span><div><h2 className="in-h">Data penutupan</h2><span className="p-cap">Diisi sekali, setelah penanganan selesai.</span></div></div>
            {!open ? (
              <div className="in-ask">
                <span>Sudah selesai ditangani?</span>
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setOpen(true)}><P d={D.tick} size={16} />Isi data penutupan</button>
              </div>
            ) : (
              <ClosureForm form={form} onChange={update} showErrors={showErrors} hasMan={d.axes.includes('man')} reportedLoss={d.lossIdr} reportedHandled={handledLabel} />
            )}
          </section>

          <div style={{ alignSelf: 'stretch', maxWidth: 420 }}><ReviewerSelect options={reviewerOptions(me)} value={rev} onChange={setRev} /></div>

          <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
            <P d={D.info} size={16} />
            <div className="body">Catatan langsung masuk Riwayat. Data penutupan tersimpan sebagai draf.</div>
          </div>
          <div className="in-wsfoot">
            <Link to={`/insiden/${i.no}`} className="p-btn p-btn-ghost"><P d="M19 12H5M12 19l-7-7 7-7" size={16} />Kembali ke detail</Link>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="p-btn p-btn-secondary" onClick={() => setToast({ text: 'Draf data penutupan tersimpan.' })}>Simpan draf</button>
              <span className="in-tw">
                <button type="button" className="p-btn p-btn-primary" aria-disabled={!complete} aria-describedby={complete ? undefined : 'mt2'} onClick={submit}>
                  <P d={D.tick} size={16} />Ajukan penutupan
                </button>
                {!complete && <span className="in-tip r" id="mt2" role="tooltip">Lengkapi 5 isian wajib data penutupan dulu.</span>}
              </span>
            </span>
          </div>
        </div>
        <aside className="c4 lk-stack in-sticky">
          <section className="p-card in-sec in-mini" aria-label="Ringkasan insiden">
            <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.no}</span>
            <b style={{ fontSize: 15, lineHeight: '21px' }}>{i.title}</b>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sev && <span className={`p-tag ${SEV_TAG_CLS[sev]}`}><span className="dot"></span>{SEV_LABEL[sev]}</span>}
              <span className="p-tag t-info">{STATUS_LABEL[i.status]}</span>
            </div>
            <dl className="lk-kv1" style={{ gridTemplateColumns: '96px minmax(0, 1fr)', margin: 0 }}>
              <dt>Tenggat</dt>
              <dd>
                <b>{due ? `${formatDateShort(due)} ${due.slice(0, 4)}, ${due.slice(11, 16)}` : 'Belum ditetapkan'}</b>
                {badge && <div><span className={badge.cls}><P d={D.clock} size={13} />{badge.text}</span></div>}
              </dd>
              <dt>Kategori</dt><dd>{i.category}</dd>
              <dt>Kejadian</dt><dd>{formatWibFull(i.occurredAt)}</dd>
              <dt>Lokasi</dt><dd>{d.patokan || i.location}</dd>
              <dt>Dampak</dt><dd>{d.securityImpact || i.title}</dd>
              <dt>Lampiran</dt><dd>{d.attachments.length} file</dd>
            </dl>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setDetail(true)}><P d={D.doc} size={16} />Lihat detail lengkap</button>
          </section>
          <TlCard i={i} canAdd={(i.status as string) === 'dalam-penanganan' || (i.status as string) === 'minta-ditutup'} />
        </aside>
      </div>
    </HandlingShell>
  );
}

