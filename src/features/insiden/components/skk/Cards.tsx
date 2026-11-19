// Kartu-kartu detail SKK untuk insiden disetujui (board P31, P35, P36). Semua dari store; hanya baca.
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { handleDaysOf } from '@/lib/deadline';
import { closureSummary } from '@/services/mock/workflow.handling';
import { TlCard } from '@/features/tindak-lanjut/components/TlCard';
import type { ReactNode } from 'react';
import type { Incident, Kerawanan } from '@/services/types';
import { SEV_LABEL } from '@/lib/severity';
import { formatRupiah, formatWibFull } from '@/lib/format';
import { closureMissing } from '@/services/mock/workflow.handling';
import { partnerLabel } from '../../logic/closure';
import { initialsOf } from '../../logic/handling';
import { InfoTip } from '../detail/InfoTip';
import { SevTag } from '../detail/SummaryAside';
import { detailOf, formatDuration, handledText, registeredAt, verifiedEntry } from '../detail/detailLogic';
import { SIc } from './icons';
import { closedInfo, dueLine, escalationOf, type EscalationInfo } from './skkLogic';

const PRIORITY = { tinggi: 'Tinggi', normal: 'Normal', rendah: 'Rendah' } as const;

export function NextStep({ meta, onGive }: { meta: string; onGive: () => void }) {
  return (
    <section className="in-next" aria-label="Langkah berikutnya">
      <span className="ic" aria-hidden="true"><SIc d="up" size={18} /></span>
      <div className="tx">
        <span className="k">Langkah berikutnya</span>
        <b>Beri arahan untuk PIC</b>
        <span className="mt">{meta}</span>
      </div>
      <span className="acts">
        <button type="button" className="p-btn p-btn-primary" onClick={onGive}><SIc d="flag" />Beri arahan</button>
      </span>
    </section>
  );
}

export function DueCard({ incident: i }: { incident: Incident }) {
  if (!i.handleDueAt) return null;
  const due = dueLine(i.handleDueAt);
  const reg = registeredAt(i);
  const sev = i.severity;
  return (
    <section className="p-card in-sec" style={{ gap: 8 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ gap: 2 }}>
          Tenggat penanganan
          <InfoTip label="tenggat penanganan" right text="Batas waktu menyelesaikan insiden, dihitung dari waktu registrasi sesuai keparahan. Bila diubah, alasan ada di riwayat." />
        </h2>
      </div>
      <span className="in-big">{formatWibFull(i.handleDueAt)}</span>
      <span className={due.late ? 'in-due late' : 'in-due ok'}><SIc d="clock" size={13} />{due.text}</span>
      {sev && <span className="p-cap">{SEV_LABEL[sev]} · {handleDaysOf(i, reg)} hari kerja sejak registrasi {formatWibFull(reg)}</span>}
    </section>
  );
}

export function SkkSummaryCard({ incident: i, closed, kerawanan }: { incident: Incident; closed?: boolean; kerawanan: Kerawanan[] }) {
  const d = detailOf(i);
  const reg = registeredAt(i);
  const ver = verifiedEntry(i);
  const krw = i.fromKrw ? kerawanan.find((k) => k.no === i.fromKrw) : undefined;
  const team = partnerLabel(i);
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Ringkasan</h2>
      <div className="in-times">
        <div className="row">
          <span className="k">Keparahan</span>
          {i.severity ? (
            <span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <SevTag sev={i.severity} />
              <span className="c">resmi{d.reporterSeverity ? ` · awal ${SEV_LABEL[d.reporterSeverity]}` : ''}</span>
            </span>
          ) : <span className="v">Belum ditentukan</span>}
        </div>
        <div className="row">
          <span className="k">Klasifikasi</span>
          <span className="v">{i.category}</span>
          {i.priority && <span className="c">Prioritas {PRIORITY[i.priority]}</span>}
        </div>
        <div className="row"><span className="k">Waktu registrasi</span><span className="v">{formatWibFull(reg)}</span></div>
        {ver && (
          <div className="row">
            <span className="k">Disetujui<InfoTip label="disetujui" right text="Waktu insiden disetujui dan menjadi data resmi." /></span>
            <span className="v">{formatWibFull(ver.at)}</span>
            <span className="c">{formatDuration(reg, ver.at)} setelah registrasi · {ver.by}</span>
          </div>
        )}
      </div>
      <div className="lk-divider" style={{ margin: 0 }}></div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)' }}>
        <dt>Pelapor</dt><dd>{i.reporter}</dd>
        <dt>PIC</dt>
        <dd>
          {i.pic ? (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initialsOf(i.pic)}</span>{i.pic}
            </span>
          ) : <span style={{ color: 'var(--ink-muted)' }}>Belum ditunjuk</span>}
        </dd>
        {closed ? (
          <>
            <dt>Tim terlibat</dt><dd>{team.length ? team.join(', ') : handledText(d)}</dd>
            {i.fromKrw && (
              <>
                <dt>Terkait</dt>
                <dd>
                  {krw && <a href="#kerawanan" onClick={(e) => e.preventDefault()}>{krw.title}</a>}
                  <div className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.fromKrw} · Kerawanan</div>
                </dd>
              </>
            )}
          </>
        ) : (
          <><dt>Sudah menangani</dt><dd>{handledText(d)}{d.handledBy.length ? ' (menurut pelapor)' : ''}</dd></>
        )}
      </dl>
    </section>
  );
}

export function FollowUpsCard({ incident: i, closed, hl }: { incident: Incident; closed?: boolean; hl?: boolean }) {
  return <TlCard i={i} hl={hl} hideWhenEmpty id="tindak-lanjut" note={closed ? 'Tetap berjalan setelah insiden ditutup, sampai diperiksa PIC insiden.' : undefined} />;
}


export function RelatedCard({ incident: i, kerawanan }: { incident: Incident; kerawanan: Kerawanan[] }) {
  if (!i.fromKrw) return null;
  const krw = kerawanan.find((k) => k.no === i.fromKrw);
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Tautan</h2>
      <a href="#kerawanan" className="in-dup" style={{ textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
        <span className="in-mi"><SIc d="doc" /></span>
        <span className="t">
          <b>{krw?.title ?? i.fromKrw}</b>
          <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.fromKrw} · Kerawanan</span>
        </span>
      </a>
    </section>
  );
}

/** Data penutupan (P35, P36): hanya baca. */
export function ClosureDataCard({ incident: i, hl, hlFiles, hlLoss }: { incident: Incident; hl?: boolean; hlFiles?: boolean; hlLoss?: boolean }) {
  const c = i.handling?.closure;
  const d = detailOf(i);
  const missing = closureMissing(c);
  const row = (k: string, v: ReactNode, cls?: string) => (<><dt>{k}</dt><dd className={cls}>{v}</dd></>);
  const sub = (t: string) => <div className="sub">{t}</div>;
  const team = partnerLabel(i);
  return (
    <section className={hl ? 'p-card in-sec in-hl' : 'p-card in-sec'} style={{ gap: 12 }} id="data-penutupan">
      <div className="lk-card-head">
        <h2 className="in-h">Data penutupan</h2>
        {c ? <span className={missing.length ? 'p-tag t-caution' : 'p-tag t-ok'}>{missing.length ? 'Belum lengkap' : 'Lengkap'}</span> : null}
      </div>
      {!c ? (
        <p className="p-cap" style={{ margin: 0 }}>Belum ada data penutupan yang diisi PIC.</p>
      ) : (
        <dl className="lk-kv1" style={{ gridTemplateColumns: '150px minmax(0, 1fr)' }}>
          {row('Ringkasan', closureSummary(c) || 'Belum diisi')}
          {row('Penyebab', <>{c.cause || 'Belum diisi'}{c.causeDetail && sub(c.causeDetail)}</>)}
          {row('Faktor penyebab', c.factors?.length ? c.factors.join(', ') : 'Belum diisi')}
          {row('Tim terlibat', <>{team.length ? team.join(', ') : 'Belum diisi'}{d.handledBy.length > 0 && sub(`Menurut pelapor saat melapor: ${handledText(d)}`)}</>)}
          {c.contracts && c.contracts.length > 0 && row('Kontrak mitra', (
            <>
              {c.contracts.map((k, n) => (
                <span key={k.ref}>{n > 0 && <br />}{k.partner} · <span className="p-mono" style={{ fontSize: 12 }}>{k.ref}</span></span>
              ))}
              {c.confirmedContracts && c.closedBy && sub(`Dikonfirmasi ${c.closedBy} saat penutupan`)}
            </>
          ))}
          {row('Bukti', c.evidence?.length ? c.evidence.map((f) => f.name).join(', ') : 'Belum diisi', hlFiles ? 'in-hl' : undefined)}
          {row('Kerugian akhir', c.lossFinalIdr != null ? <>{formatRupiah(c.lossFinalIdr)}{d.lossIdr != null && sub(`Perkiraan pelapor ${formatRupiah(d.lossIdr)}`)}</> : 'Belum diisi', hlLoss ? 'in-hl' : undefined)}
        </dl>
      )}
    </section>
  );
}

/** Kartu "Penutupan" kolom kanan P35. */
export function PenutupanCard({ incident: i }: { incident: Incident }) {
  const fus = useFollowUps();
  const ci = closedInfo(i, fus);
  const esc: EscalationInfo | null = escalationOf(i);
  if (!ci) return null;
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Penutupan</h2>
      <div className="in-times">
        <div className="row"><span className="k">Ditutup</span><span className="v">{formatWibFull(ci.at)}</span><span className="c">{ci.by}</span></div>
        <div className="row">
          <span className="k">Lama penanganan<InfoTip label="lama penanganan" right text="Jarak dari waktu registrasi sampai waktu penutupan." /></span>
          <span className="v">{ci.durFull}</span>
          {i.handleDueAt && (
            <span className="c">
              <b style={{ color: ci.inTime ? 'var(--status-success-ink)' : 'var(--error-ink)' }}>{ci.inTime ? 'Dalam tenggat' : 'Melewati tenggat'}</b> · tenggat {formatWibFull(i.handleDueAt)}
            </span>
          )}
        </div>
        <div className="row"><span className="k">Eskalasi</span><span className="v">{esc ? `Dieskalasi ke ${esc.to}` : 'Tidak dieskalasi'}</span></div>
      </div>
    </section>
  );
}

/** Lipatan `<details class="in-fold">` (P35, P36). */
export function Fold({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <details className="in-fold">
      <summary>
        <span className="t"><b>{title}</b><span className="p-cap">{caption}</span></span>
        <span className="chev"><SIc d="chev" size={16} /></span>
      </summary>
      <div className="fb">{children}</div>
    </details>
  );
}

