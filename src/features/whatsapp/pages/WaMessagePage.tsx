// Detail pesan (papan V2-10, V2-11, V2-12). K2: tanpa saran AI; K3: aksi Jadikan draf laporan, Tautkan ke insiden, Tandai rutin, Tandai tidak relevan, Buka kembali; K8: tanpa Teruskan ke SKK.
// Dialog Tautkan ke insiden (I24) dan Lepas tautan (I25) tetap memakai workflow.wa.
import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatWib, formatWibFull } from '@/lib/format';
import { DEMO_USERS, canProcessWa } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import { activeLink, linkMessageToIncident, unlinkMessage } from '@/services/mock/workflow.wa';
import { markRoutine, reopen } from '@/services/mock/workflow.wamon';
import { IrrelevantDialog } from '../components/IrrelevantDialog';
import { LinkDialog, UnlinkDialog } from '../components/Dialogs';
import { StatusTags } from '../components/MessageCard';
import { Ic, P } from '../components/monitor/nomor/icons';
import { PhotoPreview, SamplePhoto } from '../components/monitor/pesan/PhotoPreview';
import { ChildHeader, PesanShell } from '../components/monitor/pesan/PesanShell';
import { V2Toast, type PesanToast } from '../components/monitor/pesan/V2Toast';
import { shortWib } from '../components/monitor/pesan/util';
import { TOAST_UNLINKED, WA_ROUTES } from '../logic/draft';
import { useStartDraft } from '../logic/startDraft';

const INFO = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01';
const hm = (iso: string) => `${iso.slice(11, 16)} WIB`;

export function WaMessagePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast ?? null;
  const role = useDemoStore((s) => s.role);
  const message = useDemoStore((s) => s.waMessages.find((m) => m.id === id));
  const incidents = useDemoStore((s) => s.incidents);
  const rules = useDemoStore((s) => s.waRules ?? []);
  const groups = useDemoStore((s) => s.waGroups ?? []);
  const numbers = useDemoStore((s) => s.waNumbers ?? []);
  const { busy, error, start } = useStartDraft();
  const [dlg, setDlg] = useState<null | 'link' | 'unlink' | 'irrelevant'>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [toast, setToast] = useState<PesanToast | null>(routeToast ? { text: routeToast } : null);
  const closeToast = useCallback(() => setToast(null), []);

  if (!message) {
    return (
      <PesanShell>
        <ChildHeader title="Detail pesan" backTo={WA_ROUTES.inbox} backLabel="Pesan masuk" crumb={[['Pemantauan WhatsApp', WA_ROUTES.inbox], ['Detail pesan']]} />
        <div className="pr-page wa-scope">
          <section className="pr-card flex flex-col gap-3">
            <h2 className="m-0" style={{ font: 'var(--text-section-title)' }}>Pesan tidak ditemukan</h2>
            <p style={{ margin: 0 }}>Kembali ke <Link to={WA_ROUTES.inbox}>Pemantauan WhatsApp</Link>.</p>
          </section>
        </div>
      </PesanShell>
    );
  }

  const me = DEMO_USERS[role].name;
  const link = activeLink(message);
  const can = canProcessWa(role);
  const group = groups.find((g) => g.id === message.groupId);
  const number = numbers.find((n) => n.id === message.numberId);
  const ruleList = (message.ruleIds ?? []).map((rid) => rules.find((r) => r.id === rid)).filter((r): r is NonNullable<typeof r> => !!r);
  const total = 1 + (message.bubbles?.length ?? 0);
  const initial = (message.sender[0] ?? 'W').toUpperCase();

  const act = (fn: typeof markRoutine, okText: string) => {
    let err: string | null = null;
    useDemoStore.getState().updateWaMon((s) => {
      const r = fn(s, message.id, me);
      if (!r.ok) { err = r.reason; return {}; }
      return r.state;
    });
    setToast(err ? { text: err, err: true } : { text: okText });
  };
  const doLink = (no: string) => {
    const r = useDemoStore.getState().decide((s) => linkMessageToIncident(s, message.id, no, me));
    setDlg(null);
    setToast(r.ok ? { text: `Pesan ditautkan ke ${no}.` } : { text: r.reason, err: true });
  };
  const doUnlink = (reason: string) => {
    if (!link) return;
    const r = useDemoStore.getState().decide((s) => unlinkMessage(s, message.id, link.incidentNo, me, reason));
    setDlg(null);
    setToast(r.ok ? { text: TOAST_UNLINKED } : { text: r.reason, err: true });
  };

  return (
    <PesanShell
      overlay={
        dlg === 'link' ? <LinkDialog message={message} incidents={incidents} onCancel={() => setDlg(null)} onLink={doLink} />
        : dlg === 'unlink' ? <UnlinkDialog message={message} onCancel={() => setDlg(null)} onConfirm={doUnlink} />
        : null
      }
    >
      <ChildHeader
        title="Detail pesan" backTo={WA_ROUTES.inbox} backLabel="Pesan masuk"
        crumb={[['Pemantauan WhatsApp', WA_ROUTES.inbox], ['Pesan masuk', WA_ROUTES.inbox], [`${message.sender} · ${message.group} · ${shortWib(message.at)}`]]}
      />
      <div className="pr-page wa-scope">
        <div className="pr-grid v2-detail-grid">
          <div className="pr-c8 pr-stack">
            <section className="pr-card flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="v2-rt">
                  <h2 className="m-0" style={{ font: 'var(--text-section-title)' }}>{message.text}</h2>
                  <StatusTags m={message} />
                </div>
                <span className="pr-help">{total} pesan · {formatWib(message.at)}</span>
              </div>
              <div className="v2-msg">
                <span className="wa-av" aria-hidden="true">{initial}</span>
                <article className="wa-bubble v2-bub">
                  <div className="wa-bubble__who">
                    <b>{message.sender}</b><span className="wa-num">{message.senderRole}</span><span>{hm(message.at)}</span>
                    {ruleList.length > 0 && <span className="pr-tag pr-tag--muted v2-hit">Cocok aturan</span>}
                  </div>
                  <div className="wa-bubble__txt">{message.text}</div>
                </article>
              </div>
              {(message.bubbles ?? []).map((b) => (
                <div className="v2-msg" key={b.at + b.text}>
                  <span className="wa-av v2-avh" aria-hidden="true">{initial}</span>
                  <article className="wa-bubble v2-bub v2-follow">
                    <div className="wa-bubble__who"><b>{message.sender}</b><span className="wa-num">{message.senderRole}</span><span>{hm(b.at)} · lanjutan</span></div>
                    <div className="wa-bubble__txt">{b.text}</div>
                  </article>
                </div>
              ))}
              {message.photos.length > 0 && (
                <div className="v2-msg">
                  <span className="wa-av v2-avh" aria-hidden="true">{initial}</span>
                  <article className="wa-bubble v2-bub v2-follow">
                    <div className="wa-bubble__who"><b>{message.sender}</b><span className="wa-num">{message.senderRole}</span><span>{hm(message.at)} · lanjutan</span></div>
                    <div className="wa-files">
                      {message.photos.map((p, idx) => (
                        <button type="button" className="wa-file" key={p.id} aria-label={`Buka ${p.name}`} onClick={() => setPreview(idx)}>
                          <span className="wa-thumb" style={{ overflow: 'hidden', padding: 0 }}><SamplePhoto name={p.name} size="sm" /></span>
                          <span><b>{p.name}</b><small>{p.sizeKb} KB · buka</small></span>
                        </button>
                      ))}
                    </div>
                  </article>
                </div>
              )}
            </section>
          </div>
          <div className="pr-c4 pr-stack">
            <section className="pr-card flex flex-col gap-3">
              <h2 className="m-0" style={{ font: 'var(--text-section-title)' }}>Tindakan</h2>
              {error && <span className="pr-help" role="alert" style={{ color: 'var(--error-ink)' }}>{error}</span>}
              {can && message.status === 'baru' && (
                <>
                  <button type="button" className="pr-btn pr-btn--primary pr-btn--md" disabled={busy === message.id} onClick={() => void start(message)}>
                    {busy ? 'Membaca pesan…' : 'Jadikan draf laporan'}
                  </button>
                  <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => setDlg('link')}>
                    <Ic d={P.relink} />Tautkan ke insiden
                  </button>
                  <span className="pr-help">Pakai Tautkan bila pesan ini kabar lanjutan dari insiden yang sedang ditangani.</span>
                  <div className="flex gap-2">
                    <button type="button" className="pr-btn pr-btn--secondary pr-btn--md flex-1" onClick={() => act(markRoutine, 'Pesan ditandai rutin.')}>Tandai rutin</button>
                    <button type="button" className="pr-btn pr-btn--secondary pr-btn--md flex-1" onClick={() => setDlg('irrelevant')}>Tandai tidak relevan</button>
                  </div>
                </>
              )}
              {can && message.status === 'draf' && (
                <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={() => void start(message)}>Lanjutkan draf</button>
              )}
              {can && (message.status === 'rutin' || message.status === 'tidak-relevan') && (
                <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => act(reopen, 'Pesan dibuka kembali.')}>Buka kembali</button>
              )}
              {link && link.kind === 'tautan' && (
                <Link to={`/insiden/wa/tautan/${link.incidentNo}`} className="pr-btn pr-btn--secondary pr-btn--md">Lihat di Riwayat insiden</Link>
              )}
              {link && link.kind === 'tautan' && role === 'pejabat' && (
                <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => setDlg('unlink')}>Lepas tautan</button>
              )}
              {link && link.kind === 'laporan' && (
                <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={() => navigate(`/insiden/${link.incidentNo}`)}>Buka insiden</button>
              )}
              {!can && !link && <span className="pr-help">Anda hanya dapat melihat pesan ini.</span>}
            </section>
            <section className="pr-card">
              <h2 className="mt-0 mb-2.5" style={{ font: 'var(--text-section-title)' }}>Asal pesan</h2>
              <dl className="pr-kv1">
                <dt>Status</dt><dd><StatusTags m={message} /></dd>
                <dt>Grup</dt><dd>{message.group}</dd>
                <dt>Pengirim</dt><dd><span className="block">{message.sender}</span>{message.senderRole && <span className="wa-num">{message.senderRole}</span>}</dd>
                {number && <><dt>Nomor</dt><dd>{number.label}</dd></>}
                {group?.wk && <><dt>Wilayah kerja</dt><dd>{group.wk}</dd></>}
                <dt>Aturan</dt>
                <dd>
                  {ruleList.length ? (
                    <span className="v2-rls">
                      {ruleList.map((r) => <span className="v2-rl" key={r.id}>{r.name}<span className="v2-ri" title={r.name}><Ic d={INFO} size={12} /></span></span>)}
                    </span>
                  ) : '—'}
                </dd>
                {link && <><dt>{link.kind === 'laporan' ? 'Dijadikan laporan' : 'Ditautkan ke'}</dt><dd><Link to={`/insiden/${link.incidentNo}`}>{link.incidentNo}</Link><span className="block">oleh {link.by}, {formatWibFull(link.at)}</span></dd></>}
                {message.handledBy && message.handledAt && <><dt>Diproses</dt><dd>{message.handledBy}, {formatWibFull(message.handledAt)}</dd></>}
                {message.irrelevantReason && <><dt>Alasan tidak relevan</dt><dd>{message.irrelevantReason}</dd></>}
              </dl>
            </section>
          </div>
        </div>
      </div>
      {dlg === 'irrelevant' && <IrrelevantDialog messages={[message]} onClose={() => setDlg(null)} onDone={() => setToast({ text: 'Pesan ditandai tidak relevan.' })} />}
      {preview !== null && <PhotoPreview photos={message.photos} startIndex={preview} sender={message.sender} at={formatWibFull(message.at)} onClose={() => setPreview(null)} />}
      <V2Toast toast={toast} onClose={closeToast} />
    </PesanShell>
  );
}
