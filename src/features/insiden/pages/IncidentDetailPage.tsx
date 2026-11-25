// Board: I15 (Pelapor, setelah diajukan), I23 (dari WhatsApp), I32 (SKK, belum diperiksa), V14 (disetujui),
// S07 (Batalkan pengajuan, ADJ-17), S12 (Terbatas). B-18: tab Detail | Riwayat (n). B-19/B-20: Ringkasan + kartu Lokasi terpisah.
// ?state=memuat|gagal menampilkan state Memuat / Gagal dimuat (bentuk detail dari S08/S11).
import { TlCard } from '@/features/tindak-lanjut/components/TlCard';
import { useState } from 'react';
import { LocationCard } from '../components/detail/LocationCard';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { withdraw } from '@/services/mock/workflow';
import { DEMO_USERS, isSkk } from '@/lib/rbac';
import { formatWibFull } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG, type Incident } from '@/services/types';
import { DetailShell, useDetailTab, type ToastMsg } from '../components/detail/DetailShell';
import { Ic } from '../components/detail/Ic';
import { IncidentSummaryCard } from '../components/detail/IncidentSummaryCard';
import { AttachmentsCard } from '../components/detail/AttachmentsCard';
import { HistoryCard } from '../components/detail/HistoryCard';
import { SummaryAside, variantOf } from '../components/detail/SummaryAside';
import { WithdrawDialog } from '../components/detail/WithdrawDialog';
import { useWaSource } from '@/features/whatsapp/logic/source';
import { LoadFailedView, LoadingView, RestrictedView } from '../components/detail/StateViews';
import {
  accessOf, buildTimeline, detailOf, isOwner, similarTo,
} from '../components/detail/detailLogic';

/** ADJ-17: toast berhasil Batalkan pengajuan */
const TOAST_WITHDRAWN = 'Pengajuan dibatalkan. Insiden kembali menjadi draf.';

export function IncidentDetailPage() {
  const { no = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const routeToast = (useLocation().state as { toast?: string } | null)?.toast;
  const role = useDemoStore((s) => s.role);
  const all = useDemoStore((s) => s.incidents);
  const [confirm, setConfirm] = useState(params.get('aksi') === 'batalkan');
  const tab = useDetailTab();
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const incident = all.find((i) => i.no === no);
  const WA_SOURCE = useWaSource(incident);
  const me = DEMO_USERS[role].name;
  const view = params.get('state');

  if (view === 'memuat') {
    return (
      <DetailShell title="Detail insiden" busy>
        <LoadingView />
      </DetailShell>
    );
  }
  if (view === 'gagal') {
    const retry = () => {
      const p = new URLSearchParams(params);
      p.delete('state');
      setParams(p, { replace: true });
    };
    return (
      <DetailShell title="Detail insiden" centered>
        <LoadFailedView onRetry={retry} />
      </DetailShell>
    );
  }
  if (!incident || accessOf(incident, role) === 'terbatas') {
    return (
      <DetailShell title="Insiden" crumb={false} bell={false} centered>
        <RestrictedView />
      </DetailShell>
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
  const official = ['dalam-penanganan', 'minta-ditutup', 'ditutup'].includes(i.status);
  const variant = variantOf(i, skkRole);
  const showDialog = confirm && owner && inReview;

  // PA-03: draf dan Perlu perbaikan dibuka di form langkah 1 mode "Ubah insiden"
  const continueDraft = () => navigate(`/insiden/${i.no}/ubah`);
  const doWithdraw = (reason: string) => {
    const r = useDemoStore.getState().decide((s) => withdraw(s, i.no, me, reason));
    setConfirm(false);
    if (r.ok) {
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
  // B-18: header hanya menampilkan status
  const tags = statusTag;

  let acts = null;
  if (owner && inReview) {
    acts = (
      <button type="button" className="p-btn p-btn-secondary" onClick={() => setConfirm(true)}>
        <Ic d="undo" size={16} />
        Batalkan pengajuan
      </button>
    );
  } else if (owner && i.status === 'perlu-perbaikan') {
    acts = <button type="button" className="p-btn p-btn-primary" onClick={continueDraft}>Perbaiki laporan</button>;
  } else if (owner && i.status === 'draf') {
    acts = <button type="button" className="p-btn p-btn-primary" onClick={continueDraft}>Lanjutkan draf</button>;
  } else if (role === 'pejabat' && i.status === 'dalam-penanganan') {
    acts = (
      <button type="button" className="p-btn p-btn-secondary" aria-haspopup="menu">
        <Ic d="more" size={16} />
        Aksi lain
      </button>
    );
  }

  const history = buildTimeline(i, dup);
  const files = d.attachments;

  return (
    <DetailShell
      title="Detail insiden"
      tags={tags}
      acts={acts}
      no={i.no}
      riwayatCount={history.length}
      toast={toast}
      onToastClose={() => setToast(null)}
      overlay={showDialog ? <WithdrawDialog no={i.no} skkNotified={!!i.skkNotified || i.severity === 'tinggi' || i.severity === 'kritis'} onCancel={() => setConfirm(false)} onConfirm={doWithdraw} /> : null}
    >
      {skkRole && inReview && (
        <div className="in-bn info sm" style={{ alignSelf: 'flex-start' }}>
          <Ic d="info" size={16} />
          <div className="body"><b>Belum diperiksa Pejabat Berwenang KKKS.</b> Isi masih bisa berubah.</div>
        </div>
      )}
      {i.status === 'dibatalkan' && (
        <div className="in-bn err" role="status">
          <Ic d="warn" size={18} />
          <div className="body"><b>Insiden dibatalkan.</b> {i.cancelReason}</div>
        </div>
      )}
      {i.status === 'digabung' && i.mergedInto && (
        <div className="in-bn info" role="status">
          <Ic d="info" size={18} />
          <div className="body"><b>Digabung ke</b> <Link to={`/insiden/${i.mergedInto}`}>{i.mergedInto}</Link>.</div>
        </div>
      )}
      {!skkRole && i.possibleDuplicate && dup && (
        <div className="in-bn caution">
          <Ic d="warn" size={18} />
          <div className="body">
            <b>Kemungkinan sama</b> dengan <Link to={`/insiden/${dup.no}`}>{dup.no}</Link>. Pejabat Berwenang akan memutuskan saat pemeriksaan.
          </div>
        </div>
      )}
      {tab === 'riwayat' ? (
        <div className="lk-stack" style={{ maxWidth: 880 }}>
          <HistoryCard items={history} />
        </div>
      ) : (
      <div className="lk-grid">
        <div className="c8 lk-stack">
          <IncidentSummaryCard incident={i} />
          {isWa && (
            <section className="p-card in-sec">
              <h2 className="in-h">Sumber WhatsApp</h2>
              <div className="in-wa">
                <span className="who">Grup <b>{WA_SOURCE.group}</b> · {WA_SOURCE.sender}</span>
                <div className="bub">{WA_SOURCE.text}</div>
                <span className="who">{formatWibFull(WA_SOURCE.at)} · {WA_SOURCE.photos} foto ikut dilampirkan</span>
              </div>
              <a href="#whatsapp" className="lk-alink" onClick={(e) => e.preventDefault()}>Buka di Pemantauan WhatsApp</a>
            </section>
          )}
          {!isWa && files.length > 0 && <AttachmentsCard files={files} locked={inReview && !skkRole && role !== 'pejabat'} />}
          {skkRole && similar.length > 0 && (
            <section className="p-card in-sec">
              <h2 className="in-h">Laporan lain yang mungkin sama</h2>
              {similar.map((o) => (
                <SimilarItem key={o.no} o={o} />
              ))}
            </section>
          )}
          {official && (
            <section className="p-card in-sec">
              <h2 className="in-h">Penanganan</h2>
              <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)' }}>
                <dt>PIC</dt><dd>{i.pic ?? 'Belum ditunjuk'}</dd>
                {i.handleDueAt && (<><dt>Tenggat</dt><dd>{formatWibFull(i.handleDueAt)}</dd></>)}
              </dl>
              {i.forwardedSteps && i.forwardedSteps.length > 0 && (
                <div>
                  <h3 className="p-lbl" style={{ margin: '0 0 6px 0' }}>Saran langkah dari insiden serupa</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{i.forwardedSteps.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              )}
              {!owner && !skkRole && role !== 'pejabat' && (
                <span className="p-cap">Anda melihat insiden ini sebagai pengguna di wilayah kerja Anda. Penanganan dilakukan oleh {i.pic ?? 'PIC yang ditunjuk'}.</span>
              )}
            </section>
          )}
          {official && <TlCard i={i} hideWhenEmpty />}
        </div>
        <aside className="c4 lk-stack">
          {i.status === 'perlu-perbaikan' && (
            <section className="p-card in-sec" style={{ gap: 12, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))' }}>
              <h2 className="p-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Ic d="warn" size={18} />Pemeriksa meminta perbaikan</h2>
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)' }}>
                <span style={{ fontSize: 14, lineHeight: '21px' }}>“{i.revisionReason}”</span>
              </div>
              <span className="p-cap">Waktu registrasi tetap. Laporan mirip hanya dicek ulang bila lokasi, waktu kejadian, atau kategori berubah.</span>
              {owner && <button type="button" className="p-btn p-btn-primary" style={{ justifyContent: 'center' }} onClick={continueDraft}>Perbaiki laporan</button>}
            </section>
          )}
          <SummaryAside incident={i} variant={variant} openTip={owner && inReview && !!routeToast} />
          <LocationCard incident={i} />
        </aside>
      </div>
      )}
    </DetailShell>
  );
}

function SimilarItem({ o }: { o: Incident }) {
  const sub = o.timeline?.find((t) => t.text.startsWith('Mengajukan laporan'))?.at ?? o.occurredAt;
  return (
    <Link to={`/insiden/${o.no}`} className="in-dup" style={{ textDecoration: 'none' }}>
      <span className="in-mi"><Ic d="warn" size={16} /></span>
      <span className="t">
        <b>{o.title}</b>
        <span className="m"><span className="p-mono">{o.no}</span><span>· diajukan {sub.slice(11, 16)} WIB</span></span>
      </span>
      <span className={`p-tag ${o.status === 'review-internal' ? 't-caution' : STATUS_TAG[o.status]}`}>
        {o.status === 'review-internal' ? 'Belum diperiksa' : STATUS_LABEL[o.status]}
      </span>
    </Link>
  );
}
