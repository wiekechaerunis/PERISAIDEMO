// Board: P22 (+P22c, P22g, P22k), P23, P24, P25, P26, P27, P28, P29, P33, P34, PS1 (sisi Pejabat), PS5, PS7, PS8, PS10.
// Layar Pejabat Berwenang untuk insiden berjalan: Dalam penanganan, Minta ditutup, Ditutup. Rute: /insiden/:no (peran pejabat).
// Query demo: ?state=aksi|riwayat|riwayat-kosong|tenggat-error|buka-lewat30|tanpa-pic|arahan|lewat-tenggat|ditutup, ?variant=cocok|grup|data-minim, ?dialog=tutup|kembalikan|ganti-pic|tenggat|buka.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { demoNow } from '@/services/mock/clock';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { markRestricted } from '@/services/mock/workflow';
import {
  canReopen, changeDueDate, closeIncident, closedAtOf, followUpDirective, openFollowUps, reassignPic, reopen, returnToPic, reopenLimit,
  type CloseInput,
} from '@/services/mock/workflow.closure';
import type { DecisionResult } from '@/services/mock/workflow';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { DEMO_USERS } from '@/lib/rbac';
import { formatDate, formatDateShort } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG, type Incident } from '@/services/types';
import { DetailShell, type ToastMsg } from '../components/detail/DetailShell';
import { RestrictedView } from '../components/detail/StateViews';
import { IncidentSummaryCard } from '../components/detail/IncidentSummaryCard';
import { AttachmentsCard } from '../components/detail/AttachmentsCard';
import { accessOf, detailOf, registeredAt } from '../components/detail/detailLogic';
import { Ic } from '../components/review/parts';
import { RestrictedDialog } from '../components/review/ReviewDialogs';
import {
  AuditPanel, ClosedDataCard, ClosureDataCard, ContentFold, DueCard, EscalationCard, FollowUpsCard, NextStep, P, RiwayatCard, RiwayatFold,
  SummaryCard, SurroundCard,
} from '../components/closure/ClosureBlocks';
import { BriefCard, DecisionPanel } from '../components/closure/ReviewParts';
import { CloseDialog, DueDialog, NoReopenDialog, ReassignDialog, ReopenDialog, ReturnDialog, type CloseResult } from '../components/closure/ClosureDialogs';
import { dueRemaining, durFull, timeShort, withDemoState } from '../logic/closure';

type Dialog = null | 'tutup' | 'kembalikan' | 'ganti-pic' | 'tenggat' | 'buka' | 'nobuka' | 'terbatas';
type Hl = 'dp' | 'bk' | 'rg' | 'tl' | null;
const DIALOGS = ['tutup', 'kembalikan', 'ganti-pic', 'tenggat', 'buka'];
const GRUP_FROM = 'Tim Pengamanan ADR Area 2';

export function PejabatHandlingPage() {
  const { no = '' } = useParams();
  const role = useDemoStore((s) => s.role);
  const incident = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  if (role !== 'pejabat' || !incident || accessOf(incident, role) === 'terbatas') {
    return (
      <DetailShell title="Insiden" crumb={false} bell={false} centered>
        <RestrictedView />
      </DetailShell>
    );
  }
  return <Body key={incident.no} stored={incident} />;
}

function Body({ stored }: { stored: Incident }) {
  const [sp] = useSearchParams();
  const decide = useDemoStore((s) => s.decide);
  const fus = useFollowUps();
  const by = DEMO_USERS.pejabat.name;
  const variant = sp.get('variant');
  const [demo, setDemo] = useState<string | null>(sp.get('state'));
  const q = sp.get('dialog');
  const initialDialog = (): Dialog =>
    demo === 'tenggat-error' ? 'tenggat' : demo === 'buka-lewat30' ? 'nobuka' : q && DIALOGS.includes(q) ? (q as Dialog) : null;
  const [dialog, setDialog] = useState<Dialog>(initialDialog);
  const [panel, setPanel] = useState<null | 'semua' | 'akses'>(demo === 'riwayat' ? 'semua' : demo === 'riwayat-kosong' ? 'akses' : null);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [hl, setHl] = useState<Hl>(null);
  const [note, setNote] = useState('');
  const [closeError, setCloseError] = useState<string>();

  let i = stored;
  if (demo && !['aksi', 'riwayat', 'riwayat-kosong', 'tenggat-error'].includes(demo)) i = withDemoState(stored, demo, demoNow());
  if (variant === 'cocok' && i.handling?.closure) {
    const c = i.handling.closure;
    i = { ...i, handling: { ...i.handling, closure: { ...c, claims: [], summary: (c.summary ?? c.outcome).replace(' Gembok panel diganti tipe anti potong.', '') } } };
  }
  const grupFrom = variant === 'grup' ? GRUP_FROM : undefined;
  const [contracts, setContracts] = useState(i.handling?.closure?.contracts ?? []);

  const run = (r: DecisionResult, ok: string): boolean => {
    if (r.ok) {
      setDemo(null);
      setDialog(null);
      setToast({ text: ok });
      return true;
    }
    setToast({ text: r.reason, tone: 'err' });
    return false;
  };

  const doClose = (r: CloseResult) => {
    const input: CloseInput = {
      confirmedContracts: contracts.every((k) => !!k.ref), contracts, note: r.note, followUp: r.followUp, cancelReason: r.cancelReason, at: demoNow(),
    };
    const res = decide((s) => closeIncident(s, i.no, by, input));
    if (res.ok) {
      setDemo(null);
      setDialog(null);
      setCloseError(undefined);
      setToast({ text: `Insiden ${i.no} ditutup` });
    } else setCloseError(res.reason);
  };
  const doReturn = (reason: string) =>
    run(decide((s) => returnToPic(s, i.no, by, reason, demoNow())), `Insiden dikembalikan ke ${i.pic ?? 'PIC'}. Alasan Anda tampil di Detail.`);
  const doReassign = (pic: string, picKind: 'perorangan' | 'grup', reason: string) =>
    run(decide((s) => reassignPic(s, i.no, by, { pic, picKind, reason, at: demoNow() })), `PIC diganti ke ${pic}. PIC lama dan baru diberi tahu.`);
  const doDue = (date: string, reason: string) =>
    run(decide((s) => changeDueDate(s, i.no, by, date, reason, demoNow())), `Tenggat penanganan diubah ke ${formatDate(date)}.`);
  const doReopen = (reason: string) => {
    const r = decide((s) => reopen(s, i.no, by, reason, demoNow()));
    if (!r.ok && /lebih dari 30 hari/.test(r.reason)) return setDialog('nobuka');
    run(r, `Insiden ${i.no} dibuka kembali. Status Dalam penanganan.`);
  };
  const doDirective = (idx: number) => run(decide((s) => followUpDirective(s, i.no, by, idx, demoNow())), 'Arahan SKK dijadikan tindak lanjut.');
  const doRestrict = () => run(decide((s) => markRestricted(s, i.no, by)), 'Insiden ditandai terbatas.');

  const tryReopen = () => setDialog(canReopen(i, demoNow()) ? 'buka' : 'nobuka');
  const info = (text: string) => setToast({ text });

  const open = openFollowUps(i, fus);
  const st = i.status;
  const tags = (
    <>
      {st === 'ditutup' ? <span className="p-tag t-ok">Ditutup</span> : <span className="p-tag t-info">Dalam penanganan</span>}
      {st === 'minta-ditutup' && <span className="p-tag t-caution">{STATUS_LABEL[st]}</span>}
      {st === 'dalam-penanganan' && i.escalated && <span className="p-tag t-caution">Dieskalasi</span>}
      {st === 'ditutup' && open.length > 0 && <span className="p-tag t-info">Tindak lanjut berjalan</span>}
    </>
  );
  void STATUS_TAG;

  const menu: MenuItem[] =
    st === 'ditutup'
      ? [{ label: 'Buka kembali', icon: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', onClick: tryReopen }]
      : [
          { label: 'Ganti PIC', icon: P.person, onClick: () => setDialog('ganti-pic') },
          { label: 'Ubah tenggat', icon: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18', onClick: () => setDialog('tenggat') },
          { label: 'Eskalasi', icon: P.up, onClick: () => info('Eskalasi dilakukan PIC dari layar Tangani, atau otomatis saat tenggat lewat.') },
          { sep: true },
          { label: 'Tandai terbatas', icon: P.lock, onClick: () => setDialog('terbatas') },
        ];
  const acts = st === 'dalam-penanganan' || st === 'minta-ditutup' || st === 'ditutup' ? <ActionMenu items={menu} initialOpen={demo === 'aksi'} /> : null;

  const overlay = (
    <div className="cl-over">
      {dialog === 'tutup' && <CloseDialog incident={i} now={demoNow()} contracts={contracts} note={note} error={closeError} onClose={() => { setDialog(null); setCloseError(undefined); }} onConfirm={doClose} />}
      {dialog === 'kembalikan' && <ReturnDialog incident={i} onClose={() => setDialog(null)} onConfirm={doReturn} />}
      {dialog === 'ganti-pic' && <ReassignDialog incident={i} onClose={() => setDialog(null)} onConfirm={doReassign} />}
      {dialog === 'tenggat' && <DueDialog incident={i} today={demoNow()} preset={demo === 'tenggat-error' ? { date: '2026-10-27', reason: 'Polsek' } : undefined} onClose={() => setDialog(null)} onConfirm={doDue} />}
      {dialog === 'buka' && <ReopenDialog incident={i} closedAt={closedAtOf(i)} onClose={() => setDialog(null)} onConfirm={doReopen} />}
      {dialog === 'nobuka' && <NoReopenDialog incident={i} closedAt={closedAtOf(i) ?? ''} onClose={() => setDialog(null)} />}
      {dialog === 'terbatas' && <RestrictedDialog incident={i} pic={i.pic ?? '—'} onClose={() => setDialog(null)} onConfirm={() => doRestrict()} />}
      {panel && <AuditPanel i={i} initial={panel === 'akses' ? 'Akses' : 'Semua'} onClose={() => setPanel(null)} />}
    </div>
  );
  const audit = () => setPanel('semua');

  let body: ReactNode;
  if (st === 'minta-ditutup') {
    body = (
      <div className="lk-grid">
        <div className="c7 lk-stack">
          <BriefCard i={i} hl={hl} setHl={setHl} onAudit={audit} />
          <ClosureDataCard i={i} hl={hl} grupFrom={grupFrom} />
          <FollowUpsCard i={i} hl={hl === 'tl'} />
          <ContentFold i={i} />
          <RiwayatFold i={i} onAudit={audit} />
        </div>
        <aside className="c5 lk-stack">
          <DecisionPanel
            i={i} now={demoNow()} hl={hl} setHl={setHl} contracts={contracts} onContracts={setContracts} note={note} onNote={setNote}
            onReturn={() => setDialog('kembalikan')} onClose={() => setDialog('tutup')} grupFrom={grupFrom}
          />
          <SummaryCard i={i} title="Info insiden" picExtra={<> <button type="button" className="lk-alink" style={{ fontSize: 12, background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setDialog('ganti-pic')}>Ganti PIC</button></>} />
          <SurroundCard i={i} minim={variant === 'data-minim'} />
        </aside>
      </div>
    );
  } else if (st === 'ditutup') {
    const c = i.handling?.closure;
    const closedAt = closedAtOf(i);
    const reg = durFull(registeredAt(i), closedAt ?? demoNow());
    const due = i.handleDueAt;
    body = (
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
            <Ic d={P.info} size={16} />
            <div className="body">
              <b>Ditutup {closedAt ? timeShort(closedAt) : '—'}{c?.closedBy ? ` oleh ${c.closedBy}` : ''}.</b>
              {open.length > 0 ? ` ${open.length} tindak lanjut masih berjalan · ` : ' '}bisa dibuka kembali{closedAt ? ` s.d. ${formatDateShort(reopenLimit(closedAt))}` : ''}.
            </div>
          </div>
          <ClosedDataCard i={i} />
          <FollowUpsCard i={i} note="Tetap berjalan setelah insiden ditutup, sampai diperiksa PIC insiden." />
          <ContentFold i={i} />
          <RiwayatFold i={i} onAudit={audit} />
        </div>
        <aside className="c4 lk-stack">
          <SummaryCard i={i} title="Ringkasan" />
          <section className="p-card in-sec">
            <h2 className="in-h">Penutupan</h2>
            <div className="in-times">
              <div className="row"><span className="k">Ditutup</span><span className="v">{closedAt ? formatWibFullLocal(closedAt) : '—'}</span><span className="c">{c?.closedBy}</span></div>
              <div className="row"><span className="k">Lama penanganan</span><span className="v">{reg}</span>
                <span className="c">{due && closedAt && closedAt > due ? <b style={{ color: 'var(--err-ink)' }}>Lewat tenggat</b> : <b style={{ color: 'var(--status-success-ink)' }}>Dalam tenggat</b>}{due ? ` · tenggat ${formatWibFullLocal(due)}` : ''}</span></div>
              <div className="row"><span className="k">Eskalasi</span><span className="v">{i.escalated ? 'Dieskalasi' : 'Tidak dieskalasi'}</span></div>
              {closedAt && <div className="row"><span className="k">Buka kembali</span><span className="v">Sampai {formatDate(reopenLimit(closedAt))}</span><span className="c">30 hari sejak ditutup</span></div>}
            </div>
          </section>
        </aside>
      </div>
    );
  } else if (st === 'dalam-penanganan') {
    const dirs = i.handling?.directives ?? [];
    const dIdx = dirs.map((d, n) => (d.followUp ? -1 : n)).filter((n) => n >= 0).at(-1) ?? -1;
    const dir = dIdx >= 0 ? dirs[dIdx] : null;
    const rem = i.handleDueAt ? dueRemaining(i.handleDueAt, demoNow()) : null;
    body = (
      <div className="lk-grid">
        <div className="c8 lk-stack">
          {!i.pic && (
            <div className="in-bn caution sm" style={{ alignSelf: 'stretch' }}>
              <Ic d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={16} />
              <div className="body">{i.handling?.picPrev ? <><b>PIC tidak aktif.</b> {i.handling.picPrev} nonaktif sejak {formatDateShort(i.handling.picInactiveSince ?? demoNow())}.</> : <b>Insiden belum punya PIC.</b>}</div>
            </div>
          )}
          {dir && (
            <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
              <Ic d={P.info} size={16} />
              <div className="body"><b>Arahan baru dari {dir.by} (SKK).</b> “{dir.text.split('. ')[0].replace(/\.$/, '')}.”</div>
            </div>
          )}
          <IncidentSummaryCard incident={i} />
          <AttachmentsCard files={detailOf(i).attachments} />
          {!i.pic && (
            <NextStep icon={P.person} title="Tunjuk PIC baru" meta={`Tenggat ${i.handleDueAt ? formatDateShort(i.handleDueAt) : '—'}${rem ? ` · ${rem.text}` : ''}`}
              action={<button type="button" className="p-btn p-btn-primary" onClick={() => setDialog('ganti-pic')}><Ic d={P.person} size={16} />Tunjuk PIC</button>} />
          )}
          {dir && (
            <NextStep icon={P.flag} title="Jadikan arahan ini tindak lanjut?" meta={timeShort(dir.at)}
              action={<button type="button" className="p-btn p-btn-primary" onClick={() => doDirective(dIdx)}><Ic d={P.plus} size={16} />Jadikan tindak lanjut</button>} />
          )}
          <RiwayatCard i={i} onAudit={audit} />
        </div>
        <aside className="c4 lk-stack">
          <DueCard i={i} now={demoNow()} withEsc={!i.escalated} />
          <FollowUpsCard i={i} />
          <SummaryCard i={i} title="Ringkasan" picExtra={i.pic ? <> <button type="button" className="lk-alink" style={{ fontSize: 12, background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setDialog('ganti-pic')}>Ganti PIC</button></> : undefined} />
          <EscalationCard i={i} />
        </aside>
      </div>
    );
  } else {
    body = (
      <div className="in-status">
        <h2>Insiden ini belum berjalan.</h2>
        <p>Status {STATUS_LABEL[st]}. Layar ini untuk insiden Dalam penanganan, Minta ditutup, dan Ditutup.</p>
        <Link to={`/insiden/${i.no}/review`} className="p-btn p-btn-secondary" style={{ marginTop: 8 }}>Buka review</Link>
      </div>
    );
  }

  return (
    <DetailShell title="Detail insiden" tags={tags} acts={acts} toast={toast} onToastClose={() => setToast(null)} overlay={overlay}>
      {body}
    </DetailShell>
  );
}

const formatWibFullLocal = (iso: string) => `${formatDate(iso)}, ${iso.slice(11, 16)} WIB`;

interface MenuItem { label?: string; icon?: string; onClick?: () => void; sep?: boolean }

/** Menu "Aksi lain" (in-menuwrap, board P22/P24/P29/P33). */
function ActionMenu({ items, initialOpen }: { items: MenuItem[]; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div className="in-menuwrap" ref={ref}>
      <button type="button" className="p-btn p-btn-secondary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Ic d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" size={16} />Aksi lain
      </button>
      {open && (
        <div className="in-menu" role="menu" aria-label="Aksi lain">
          {items.map((m, n) =>
            m.sep ? <div key={n} className="sep" role="separator"></div> : (
              <button key={m.label} type="button" role="menuitem" onClick={() => { setOpen(false); m.onClick?.(); }}><Ic d={m.icon ?? ''} size={16} />{m.label}</button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
