// Board KD4 (Dinaikkan): kerawanan yang sudah dinaikkan/diajukan dibuka sebagai detail insiden dengan tautan asal KRW (satu catatan).
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { formatDate, formatRupiah, formatWib, formatWibFull } from '@/lib/format';
import { initials } from '@/lib/rbac';
import { SEV_EQUIV, SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import type { Incident, Kerawanan, ModuleConfig } from '@/services/types';
import { STATUS_LABEL, STATUS_TAG } from '@/services/types';
import { KB } from '../step2Data';
import { KerawananShell } from './KerawananShell';
import { Cap, Fact, FilesCard, MapLink, MetaChip, minutesBetween, P, TlItem } from './parts';
import { RvToast } from '../review/parts';

interface Props {
  /** kerawanan asal (sudah lewat resolveKerawanan) */
  k: Kerawanan;
  incident: Incident;
  cfg: ModuleConfig;
  /** Pejabat boleh membuka layar review bila insiden menunggu pemeriksaan */
  canReview: boolean;
  toast?: string | null;
  onToastClose?: () => void;
}

const opsText = (d: NonNullable<Incident['detail']>) =>
  d.ops === 'berhenti' ? `Berhenti${d.opsHours ? ` · ${d.opsHours} jam` : ''}`
    : d.ops === 'sebagian' ? `Terganggu sebagian${d.opsHours ? ` · ${d.opsHours} jam` : ''}` : 'Tidak terganggu';
const casualtyText = (d: NonNullable<Incident['detail']>) => {
  const t = KB.filter(([key]) => key in d.casualties).map(([key, l]) => (key === 'belum' ? l : `${l} · ${d.casualties[key] ?? 0}`));
  return t.length ? t.join(', ') : 'Tidak terdampak';
};

/** Baris Riwayat dari yang terbaru ke terlama. */
function History({ i, k, cfg }: { i: Incident; k: Kerawanan; cfg: ModuleConfig }) {
  const sev = i.severity;
  const registered = (
    <TlItem cls="nd" icon={P.plus}>
      <div className="hd"><b>Tercatat sebagai kerawanan</b> oleh {k.reporter}</div>
      <div className="dt"><span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span> · {minutesBetween(k.observedAt, k.recordedAt ?? k.observedAt)} menit setelah diketahui</div>
      <div className="tm">{formatWibFull(k.recordedAt ?? k.observedAt)}</div>
    </TlItem>
  );
  if (!i.raisedBy) {
    // dinaikkan di luar alur ini (data seed): pakai jejak audit insiden apa adanya
    const rows = [...(i.timeline ?? [])].reverse();
    return (
      <ol className="p-tl" aria-label="Riwayat insiden">
        {rows.map((t, n) => (
          <TlItem key={t.at + t.text} cls={n === 0 ? 'nd now' : 'nd'} icon={n === 0 ? P.person : P.up}>
            <div className="hd"><b>{t.text}</b> oleh {t.by}</div>
            <div className="tm">{formatWibFull(t.at)}</div>
          </TlItem>
        ))}
        {registered}
      </ol>
    );
  }
  const verified = !!i.verifiedBy;
  const days = sev ? cfg.deadlines[sev] : null;
  return (
    <ol className="p-tl" aria-label="Riwayat insiden">
      {verified && i.pic && (
        <TlItem cls="nd now" icon={P.person}>
          <div className="hd"><b>PIC {i.pic} ditetapkan</b> oleh {i.verifiedBy}</div>
          <div className="dt">
            {i.pic} diberi tahu.{i.handleDueAt && sev ? ` Tenggat ${formatDate(i.handleDueAt)} (${SEV_LABEL[sev]} · ${days} hari kerja).` : ''}
          </div>
          <div className="tm">{formatWibFull(i.verifiedAt ?? i.raisedAt ?? '')}</div>
        </TlItem>
      )}
      <TlItem cls={verified ? 'nd ok' : 'nd now'} icon={P.up}>
        <div className="hd"><b>{verified ? 'Dinaikkan jadi insiden dan disetujui' : 'Diajukan jadi insiden'}</b> oleh {i.raisedBy}</div>
        <div className="dt">Alasan: {i.raisedReason}</div>
        <div className="dt">{i.category} · {sev ? SEV_LABEL[sev] : '—'} · {STATUS_LABEL[i.status]}</div>
        <div className="tm">{formatWibFull(i.raisedAt ?? '')}</div>
      </TlItem>
      {registered}
    </ol>
  );
}

export function RaisedView({ k, incident: i, cfg, canReview, toast, onToastClose }: Props) {
  const d = i.detail;
  const sev = i.severity;
  const files = d?.attachments ?? k.attachments ?? [];
  const area = (k.area ?? '').replace(' · Dalam ', ' · ');
  const suggested = d?.suggestedSeverity ?? sev;
  return (
    <>
      <KerawananShell
        title="Detail insiden" back={{ to: '/insiden', label: 'Kembali ke Insiden' }}
        crumbs={[{ label: 'Insiden', to: '/insiden' }, { label: i.no }]}
        acts={canReview && i.status === 'review-internal' ? <Link to={`/insiden/${i.no}/review`} className="p-btn p-btn-primary">Buka review</Link> : undefined}
      >
        <div className="in-bn info sm" role="note" style={{ marginBottom: 16 }}>
          <Icon name="info" size={16} />
          <span>
            Dinaikkan dari kerawanan <span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span> · tercatat {formatWib(k.recordedAt ?? k.observedAt)} <span className="p-tz">WIB</span>
          </span>
        </div>
        <div className="lk-grid">
          <div className="c8 lk-stack">
            <article className="p-card" aria-labelledby="ins-judul" style={{ padding: 0, overflow: 'hidden', fontSize: 13, lineHeight: '18px' }}>
              <header style={{ padding: '24px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="p-mono" style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-muted)' }}>{i.no}</span>
                <h2 id="ins-judul" style={{ margin: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700 }}>{i.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  <MetaChip d={P.hat}>Jenis: Insiden</MetaChip>
                  <MetaChip d={P.tag}>{i.category}</MetaChip>
                  <MetaChip d={P.cal}>Kejadian {formatWibFull(i.occurredAt)}</MetaChip>
                  {sev && <MetaChip d={P.warn}>Keparahan: {SEV_LABEL[sev]} · setara {SEV_EQUIV[sev]}</MetaChip>}
                </div>
              </header>
              {d?.story && (
                <div style={{ padding: '20px 24px 4px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 className="p-lbl" style={{ margin: 0 }}>Kondisi yang ditemukan</h3>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{d.story}</p>
                </div>
              )}
              {d?.securityImpact && (
                <div style={{ padding: '16px 24px 4px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 className="p-lbl" style={{ margin: 0 }}>Dampak keamanan</h3>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{d.securityImpact}</p>
                </div>
              )}
              <dl style={{ margin: '16px 24px 20px 24px', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 28px' }}>
                <Fact term="Lokasi">
                  <span>{k.location}</span>
                  <Cap>{area}</Cap>
                  {d?.lat != null && d?.lng != null && <MapLink lat={d.lat} lng={d.lng} />}
                </Fact>
                <Fact term="Patokan"><span>{d?.patokan || k.patokan || '—'}</span></Fact>
                <Fact term="Pelapor">
                  <span>{i.reporter}</span>
                  <Cap>Tercatat sebagai kerawanan {formatWibFull(k.recordedAt ?? k.observedAt)}</Cap>
                </Fact>
                <Fact term="Sumber informasi"><span>{k.source ?? '—'}</span></Fact>
              </dl>
              {d && (
                <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                  {[
                    [P.ops, 'Kondisi operasi', opsText(d)],
                    [P.user, 'Korban', casualtyText(d)],
                    [P.wallet, 'Perkiraan kerugian', d.lossIdr ? formatRupiah(d.lossIdr) : 'Tidak diisi'],
                  ].map(([ic, t, v]) => (
                    <div key={t} style={{ background: 'var(--surface-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', gap: 12 }}>
                      <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--ink-muted)', marginTop: 1 }}><path d={ic} /></svg>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <h3 className="p-lbl" style={{ margin: 0 }}>{t}</h3>
                        <p style={{ margin: 0, lineHeight: '20px', fontWeight: 600 }}>{v}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
            {files.length > 0 && <FilesCard files={files} />}
            <section className="p-card in-sec">
              <h2 className="in-h">Riwayat</h2>
              <History i={i} k={k} cfg={cfg} />
            </section>
          </div>
          <aside className="c4 lk-stack">
            <section className="p-card in-sec">
              <h2 className="in-h">Info</h2>
              <dl className="lk-kv1">
                <dt>Nomor</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{i.no}</span></dd>
                <dt>Status</dt><dd><span className={'p-tag ' + STATUS_TAG[i.status]}>{STATUS_LABEL[i.status]}</span></dd>
                {sev && (
                  <>
                    <dt>Keparahan</dt>
                    <dd>
                      <span className={'p-tag ' + SEV_TAG_CLS[sev]}><span className="dot"></span>{SEV_LABEL[sev]}</span>
                      <div className="p-cap">{sev === suggested ? 'Otomatis dari dampak' : 'Diubah dari saran'}</div>
                    </dd>
                  </>
                )}
                <dt>Kategori</dt><dd>{i.category}</dd>
                <dt>PIC</dt>
                <dd>
                  {i.pic ? (
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initials(i.pic)}</span>{i.pic}
                    </span>
                  ) : (
                    <span className="p-cap">Ditetapkan Pejabat saat pemeriksaan</span>
                  )}
                </dd>
                {i.handleDueAt && sev && (
                  <>
                    <dt>Tenggat penanganan</dt>
                    <dd>{formatWib(i.handleDueAt)} <span className="p-tz">WIB</span><div className="p-cap">{SEV_LABEL[sev]} · {cfg.deadlines[sev]} hari kerja sejak registrasi</div></dd>
                  </>
                )}
                {i.verifiedBy && (
                  <>
                    <dt>Disetujui</dt><dd>{i.verifiedBy}<div className="p-cap">{formatWibFull(i.verifiedAt ?? '')}</div></dd>
                  </>
                )}
                <dt>Pelapor</dt><dd>{i.reporter}</dd>
                <dt>Asal laporan</dt>
                <dd>
                  Kerawanan <span className="p-mono" style={{ fontSize: 12 }}>{k.no}</span>
                  <div className="p-cap">{k.kind} · tercatat {formatWibFull(k.recordedAt ?? k.observedAt)}</div>
                </dd>
              </dl>
            </section>
          </aside>
        </div>
      </KerawananShell>
      {toast && <RvToast text={toast} onClose={onToastClose} />}
    </>
  );
}
