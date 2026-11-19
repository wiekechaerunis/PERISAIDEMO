// Board mobile: M8 (Pelapor, setelah diajukan + toast), M6 (SKK belum diperiksa), M11 (dari WhatsApp), MS07 (Tarik kembali), MS12 (Terbatas).
// Dipakai dispatcher `/insiden/:no` untuk status Menunggu pemeriksaan, Perlu perbaikan, Dibatalkan, Digabung, Terbatas.
// Perilaku sama dengan IncidentDetailPage: Tarik kembali lewat decide(withdraw), ?state=memuat|gagal.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { useWaSource } from '@/features/whatsapp/logic/source';
import { withdraw } from '@/services/mock/workflow';
import { DEMO_USERS, isSkk } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical } from '@/lib/severity';
import { formatWibFull } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG, type Incident } from '@/services/types';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { extLabel, formatSize } from '@/features/insiden/logic/attachments';
import { OPS } from '@/features/insiden/components/step2Data';
import {
  accessOf, addMinutes, buildTimeline, casualtyText, detailOf, draftFromIncident, formatDuration, handledText,
  isOwner, registeredAt, similarTo, submittedEntry,
} from '@/features/insiden/components/detail/detailLogic';
import { MobileShell } from '../ui/MobileShell';
import { D, Pi, Sheet, Toast } from './parts';
import { AXIS_LABEL, rupiahShort } from './step4Logic';

const TOAST_WITHDRAWN = 'Laporan ditarik kembali. Anda bisa mengubah isinya lagi, lalu mengajukan ulang.';
const BANNER = { padding: '10px 12px', fontSize: 12, lineHeight: '17px' } as const;
const TIP = {
  kejadian: 'Kapan kejadian terjadi menurut pelapor.',
  registrasi: 'Waktu insiden diajukan dan resmi tercatat. Batas penanganan dihitung dari sini.',
  pertama: 'Waktu pesan pertama tentang kejadian ini masuk di grup WhatsApp. Diisi otomatis.',
};
const TL_ICON = { send: D.send, plus: 'M12 5v14M5 12h14', clock: D.clock, check: D.check, undo: D.undo } as const;

interface ToastState {
  text: string;
  tone?: 'ok' | 'err';
}

/** Ikon info + tooltip tekan (anatomi `in-tw`/`in-tip` board M8). */
function Tip({ label, text, defaultOpen }: { label: string; text: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <span className={open ? 'in-tw open' : 'in-tw'}>
      <button type="button" className="ib" style={{ width: 32, height: 32 }} aria-label={`Penjelasan ${label}`} onClick={() => setOpen((v) => !v)}>
        <Pi d={D.info} size={15} />
      </button>
      <span className="in-tip" role="tooltip" style={{ left: 0, transform: 'none', width: 240 }}>{text}</span>
    </span>
  );
}

function Row({ k, tip, children }: { k: string; tip?: ReactNode; children: ReactNode }) {
  return (
    <div className="row">
      <span className="k">{k}{tip}</span>
      {children}
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return (
    <div className="card" style={{ height: h, background: 'var(--surface)' }}>
      <span className="p-sk" style={{ height: 14, width: '60%' }}></span>
      <span className="p-sk" style={{ height: 10, width: '85%' }}></span>
      <span className="p-sk" style={{ height: 10, width: '40%' }}></span>
    </div>
  );
}

const whoOf = (bold: string, rest?: string) => {
  if (bold === 'SKK Migas diberi tahu') return 'Semua Pengawas SKK · jalur cepat';
  return (rest ?? '').replace(/^( oleh | · )/, '');
};

export function MobileIncidentDetail() {
  const { no = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast ?? null;
  const role = useDemoStore((s) => s.role);
  const all = useDemoStore((s) => s.incidents);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [routeOpen, setRouteOpen] = useState(!!routeToast);
  useEffect(() => setRouteOpen(!!routeToast), [routeToast]);

  const incident = all.find((i) => i.no === no);
  const WA_SOURCE = useWaSource(incident);
  const me = DEMO_USERS[role].name;
  const view = params.get('state');
  const shown: ToastState | null = toast ?? (routeToast && routeOpen ? { text: routeToast } : null);
  const closeToast = () => {
    setRouteOpen(false);
    setToast(null);
  };
  const toastEl = shown && <Toast text={shown.text} tone={shown.tone} onClose={closeToast} bottom={16} />;

  if (view === 'memuat') {
    return (
      <MobileShell title="Detail insiden" backTo="/insiden">
        <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton h={160} />
          <Skeleton h={140} />
        </div>
      </MobileShell>
    );
  }
  if (view === 'gagal') {
    const retry = () => {
      const p = new URLSearchParams(params);
      p.delete('state');
      setParams(p, { replace: true });
    };
    return (
      <MobileShell title="Detail insiden" backTo="/insiden">
        <div className="lk-es" role="alert" style={{ flex: 1, justifyContent: 'center', padding: '40px 16px' }}>
          <b>Detail insiden tidak dapat dimuat.</b>
          <span style={{ color: 'var(--ink-muted)' }}>Periksa koneksi Anda, lalu coba lagi.</span>
          <button type="button" className="p-btn p-btn-secondary" style={{ minHeight: 44, marginTop: 8 }} onClick={retry}>
            <Pi d={D.retry} />Muat ulang
          </button>
        </div>
      </MobileShell>
    );
  }
  if (!incident || accessOf(incident, role) === 'terbatas') {
    return (
      <MobileShell title="Detail insiden" backTo="/insiden">
        <div className="lk-es" style={{ flex: 1, justifyContent: 'center', padding: '40px 16px' }}>
          <span style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--surface-sunken)', color: 'var(--ink-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pi d={D.lock} size={24} />
          </span>
          <b>Anda tidak punya akses ke insiden ini.</b>
          <span style={{ color: 'var(--ink-muted)', maxWidth: 300 }}>Insiden ini terbatas atau di luar cakupan Anda. Hubungi Pejabat Berwenang bila perlu melihatnya.</span>
          <Link to="/insiden" className="p-btn p-btn-secondary" style={{ minHeight: 44 }}>Kembali ke daftar</Link>
        </div>
      </MobileShell>
    );
  }

  const i: Incident = incident;
  const d = detailOf(i);
  const skkRole = isSkk(role);
  const owner = isOwner(i, role);
  const isWa = i.source === 'wa';
  const inReview = i.status === 'review-internal';
  const similar = similarTo(i, all);
  const dup = similar[0];
  const reg = registeredAt(i);
  const submitted = !!submittedEntry(i) && i.status !== 'draf';
  const sev = i.severity;
  const variant = skkRole ? 'skk' : isWa ? 'wa' : 'pelapor';
  const showDialog = confirm && owner && inReview;
  const files = d.attachments;

  const loadDraft = () => useDraftStore.getState().patch(draftFromIncident(i));
  const continueDraft = () => {
    loadDraft();
    navigate('/insiden/baru/kejadian');
  };
  const doWithdraw = () => {
    const r = useDemoStore.getState().decide((s) => withdraw(s, i.no, me));
    setConfirm(false);
    if (r.ok) {
      loadDraft();
      setToast({ text: TOAST_WITHDRAWN });
    } else {
      setToast({ text: r.reason, tone: 'err' });
    }
  };

  const statusTag =
    skkRole && inReview ? (
      <span className="p-tag t-caution">Belum diperiksa</span>
    ) : (
      <span className={`p-tag ${STATUS_TAG[i.status]}`}>{STATUS_LABEL[i.status]}</span>
    );

  const lokasi = variant === 'skk' ? `${i.location.split(' · ')[0]} · ${i.wk}` : i.location;
  const axes = d.axes.map((a) => AXIS_LABEL[a]).join(', ');
  const opsLabel = d.ops ? `${OPS.find(([k]) => k === d.ops)?.[1] ?? ''}${d.ops !== 'tidak' && d.opsHours ? ` ${d.opsHours} jam` : ''}` : 'Tidak terdampak';
  const hhmm = (t?: string) => t?.match(/\d\d:\d\d/)?.[0];

  const actions = owner && inReview ? (
    <button type="button" className="ib44" aria-label="Aksi lain: Tarik kembali" aria-haspopup="dialog" onClick={() => setConfirm(true)}>
      <Pi d={D.more} size={20} />
    </button>
  ) : skkRole ? (
    <button type="button" className="ib44" aria-label="Notifikasi">
      <Pi d={D.bell} size={20} />
    </button>
  ) : undefined;

  return (
    <MobileShell
      title="Detail insiden"
      backTo="/insiden"
      actions={actions}
      footer={
        owner && i.status === 'draf' ? (
          <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={continueDraft}>Lanjutkan draf</button>
        ) : undefined
      }
      overlay={
        <>
          {showDialog && (
            <Sheet labelledBy="sh-t" onClose={() => setConfirm(false)}>
              <div className="sb">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <b id="sh-t" style={{ fontSize: 17, lineHeight: '24px' }}>Tarik kembali jadi draf?</b>
                </div>
                <span style={{ color: 'var(--ink-subtle)' }}>Anda bisa mengubah isinya lagi, lalu mengajukan ulang.</span>
                <dl className="kv">
                  <dt>Status</dt><dd>Menunggu pemeriksaan → Draf</dd>
                  <dt>Pemeriksaan</dt><dd>Dibatalkan</dd>
                  {(!!i.skkNotified || isHighOrCritical(sev)) && (<><dt>SKK Migas</dt><dd>Diberi tahu bahwa laporan ditarik</dd></>)}
                </dl>
              </div>
              <div className="sf">
                <button type="button" className="p-btn p-btn-primary" onClick={doWithdraw}>Tarik kembali</button>
                <button type="button" className="p-btn p-btn-secondary" onClick={() => setConfirm(false)}>Batal</button>
              </div>
            </Sheet>
          )}
          {toastEl}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b role="heading" aria-level={1} style={{ fontSize: 20, lineHeight: '28px' }}>{i.title}</b>
        <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.no}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statusTag}
          {sev && <span className={`p-tag ${SEV_TAG_CLS[sev]}`}><span className="dot"></span>{SEV_LABEL[sev]}</span>}
        </div>
      </div>

      {skkRole && inReview && (
        <div className="in-bn info sm" style={{ fontSize: 12, lineHeight: '17px' }}>
          <Pi d={D.info} />
          <div className="body"><b>Belum diperiksa Pejabat Berwenang KKKS.</b> Isi masih bisa berubah.</div>
        </div>
      )}
      {i.status === 'perlu-perbaikan' && (
        <div className="in-bn caution" role="status" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body">
            <b>Perlu perbaikan.</b> {i.revisionReason}
            {owner && (
              <div className="acts">
                <button type="button" className="p-btn p-btn-primary" style={{ minHeight: 44 }} onClick={continueDraft}>Perbaiki laporan</button>
              </div>
            )}
          </div>
        </div>
      )}
      {i.status === 'dibatalkan' && (
        <div className="in-bn err" role="status" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body"><b>Insiden dibatalkan.</b> {i.cancelReason}</div>
        </div>
      )}
      {i.status === 'digabung' && i.mergedInto && (
        <div className="in-bn info" role="status" style={BANNER}>
          <Pi d={D.info} />
          <div className="body"><b>Digabung ke</b> <Link to={`/insiden/${i.mergedInto}`}>{i.mergedInto}</Link>.</div>
        </div>
      )}
      {!skkRole && i.possibleDuplicate && dup && (
        <div className="in-bn caution" style={BANNER}>
          <Pi d={D.warn} />
          <div className="body">
            <b>Kemungkinan sama</b> dengan <Link to={`/insiden/${dup.no}`}>{dup.no}</Link>. Pejabat Berwenang memutuskan saat pemeriksaan.
          </div>
        </div>
      )}

      <div className="sec">
        <div className="in-times">
          {variant === 'skk' && <Row k="KKKS"><span className="v">{i.org}</span></Row>}
          <Row k="Waktu kejadian" tip={<Tip label="waktu kejadian" text={TIP.kejadian} />}>
            <span className="v">{formatWibFull(i.occurredAt)}</span>
          </Row>
          {variant === 'wa' && (
            <Row k="Pertama dilaporkan" tip={<Tip label="pertama dilaporkan" text={TIP.pertama} />}>
              <span className="v">{formatWibFull(WA_SOURCE.at)}</span>
            </Row>
          )}
          {submitted && (
            <Row k="Waktu registrasi" tip={variant === 'wa' ? undefined : <Tip label="waktu registrasi" text={TIP.registrasi} defaultOpen={variant === 'skk'} />}>
              <span className="v">{formatWibFull(reg)}</span>
              <span className="c">
                {variant === 'wa' ? `${formatDuration(WA_SOURCE.at, reg)} setelah pesan pertama` : `${formatDuration(i.occurredAt, reg)} setelah kejadian`}
              </span>
            </Row>
          )}
          {variant === 'skk' && submitted && isHighOrCritical(sev) && (
            <Row k="Anda diberi tahu">
              <span className="v">{formatWibFull(addMinutes(reg, 1))}</span>
              <span className="c">Dikirim langsung · lonceng dan email</span>
            </Row>
          )}
          {variant === 'pelapor' && inReview && i.verifyDueAt && (
            <Row k="Batas pemeriksaan"><span className="v">{formatWibFull(i.verifyDueAt)}</span></Row>
          )}
        </div>
      </div>

      <div className="sec">
        <h2>Kejadian</h2>
        <dl className="kv">
          <dt>Kategori</dt><dd>{i.category}</dd>
          <dt>Lokasi</dt><dd>{lokasi}</dd>
          {variant !== 'wa' && (<><dt>Yang terdampak</dt><dd>{axes || '—'}</dd></>)}
          <dt>Dampak keamanan</dt><dd>{d.securityImpact || i.title}</dd>
          <dt>Sudah menangani</dt>
          <dd>{handledText(d)}{d.handledBy.length ? ' (menurut pelapor)' : ''}</dd>
          {variant === 'pelapor' && (<><dt>PIC</dt><dd style={i.pic ? undefined : { color: 'var(--ink-muted)' }}>{i.pic ?? 'Ditunjuk saat pemeriksaan'}</dd></>)}
        </dl>
        <div className="stats">
          <div><span className="k">Operasi</span><b>{opsLabel}</b></div>
          <div><span className="k">Korban</span><b>{casualtyText(d)}</b></div>
          <div><span className="k">Kerugian</span><b>{d.lossIdr ? rupiahShort(d.lossIdr) : '—'}</b></div>
        </div>
      </div>

      {isWa && (
        <div className="sec">
          <h2>Sumber WhatsApp</h2>
          <div className="in-wa">
            <span className="who">Grup <b>{WA_SOURCE.group}</b> · {WA_SOURCE.sender}</span>
            <div className="bub">{WA_SOURCE.text}</div>
            <span className="who">{formatWibFull(WA_SOURCE.at)} · {WA_SOURCE.photos} foto</span>
          </div>
          <a href="#whatsapp" className="lk-alink" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }} onClick={(e) => e.preventDefault()}>
            Buka di Pemantauan WhatsApp
          </a>
        </div>
      )}

      {!isWa && files.length > 0 && (
        <div className="sec">
          <div className="hd">
            <h2>Lampiran · {files.length} file</h2>
            {inReview && !skkRole && role !== 'pejabat' && (
              <span className="lk-lock" style={{ fontSize: 12 }}><Pi d={D.lock} size={14} />Terkunci</span>
            )}
          </div>
          <div className="p-files">
            {files.map((f) => (
              <div className="p-file" key={f.name}>
                <span className="fi">{extLabel(f.name)}</span>
                <div className="grow">
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                  <span className="p-cap">{formatSize(f.sizeKb)}</span>
                  {f.caption && (
                    <span className="p-cap" style={{ color: 'var(--ink-subtle)' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Keterangan:</span> {f.caption}
                    </span>
                  )}
                </div>
                <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Pratinjau">
                  <Pi d={D.eye} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {skkRole && similar.length > 0 && (
        <div className="sec">
          <h2>Laporan lain yang mungkin sama</h2>
          {similar.map((o) => (
            <Link key={o.no} to={`/insiden/${o.no}`} className="in-dup" style={{ textDecoration: 'none' }}>
              <span className="t">
                <b>{o.title}</b>
                <span className="m"><span className="p-mono">{o.no}</span><span>· {(submittedEntry(o)?.at ?? o.occurredAt).slice(11, 16)} WIB</span></span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {variant === 'pelapor' && (
        <div className="sec">
          <h2>Riwayat</h2>
          <ol className="p-tl">
            {buildTimeline(i, dup).map((t, n) => (
              <li key={n}>
                <span className={t.cls ? `nd ${t.cls}` : 'nd'}><Pi d={TL_ICON[t.icon]} size={12} /></span>
                <div>
                  <div className="t"><b>{t.bold}</b>{t.cls !== 'next' && hhmm(t.tm) && <time>{hhmm(t.tm)}</time>}</div>
                  <div className="who">{t.cls === 'next' ? t.tm : whoOf(t.bold, t.rest)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </MobileShell>
  );
}
