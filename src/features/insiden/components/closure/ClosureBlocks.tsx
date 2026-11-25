// Blok bersama layar Pejabat insiden berjalan: Data penutupan, Tindak lanjut, Riwayat, Ringkasan, Tenggat, Eskalasi, Kondisi sekitar, Jejak audit.
import { Link } from 'react-router-dom';
import { lpoText } from '../handling/LpoSection';
import { useState, type ReactNode } from 'react';
import { ClosureExtraRows, UpdateLegalButton } from './ClosureExtraRows';
import { handleDaysOf } from '@/lib/deadline';
import { closureSummary } from '@/services/mock/workflow.handling';
import type { Incident } from '@/services/types';
import { formatDate, formatRupiah, formatWib, formatWibFull } from '@/lib/format';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { initials } from '@/lib/rbac';
import { Ic } from '../review/parts';
import { InfoTip } from '../detail/InfoTip';
import { AttachmentsCard } from '../detail/AttachmentsCard';
import { IncidentSummaryCard } from '../detail/IncidentSummaryCard';
import { detailOf, handledText, registeredAt, verifiedEntry } from '../detail/detailLogic';
import {
  auditRows, closureFilled, partnerLabel, riwayat, type AuditGroup, type AuditRow, type RwItem,
} from '../../logic/closure';
import { dueRemaining, durFull } from '../../logic/closure';

export const P = {
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5',
  chev: 'm6 9 6 6 6-6',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  wa: 'M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5z',
  flag: 'M4 22V4M4 4h12l-2 4 2 4H4',
  up: 'M12 19V5M5 12l7-7 7 7',
  check: 'M20 6 9 17l-5-5',
  close: 'M18 6 6 18M6 6l12 12',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  merge: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  lockbox: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  pin: 'M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
} as const;
const ICON_BY: Record<string, string> = { clock: P.clock, check: P.check, tag: P.tag, person: P.person, merge: P.merge, send: P.send, lock: P.lock, up: P.up };

const TIP_RIWAYAT = 'Catatan penanganan dan perubahan insiden dalam satu urutan, terbaru di atas. Entri tidak bisa diubah atau dihapus; koreksi dengan catatan baru. Nilai lama dan baru ada di Jejak audit lengkap.';

/** Lipatan "Isi laporan & lampiran" / "Riwayat · n" (in-fold). */
export function Fold({ title, cap, children }: { title: string; cap: string; children: ReactNode }) {
  return (
    <details className="in-fold">
      <summary><span className="t"><b>{title}</b><span className="p-cap">{cap}</span></span><span className="chev"><Ic d={P.chev} size={16} /></span></summary>
      <div className="fb">{children}</div>
    </details>
  );
}

export function ContentFold({ i }: { i: Incident }) {
  const d = detailOf(i);
  return (
    <Fold title="Isi laporan & lampiran" cap={`${i.title} · ${i.severity ? SEV_LABEL[i.severity] : '—'} · ${d.attachments.length} file`}>
      <IncidentSummaryCard incident={i} />
      <AttachmentsCard files={d.attachments} />
    </Fold>
  );
}

function RwNode({ x }: { x: RwItem }) {
  const icon = x.kind === 'catatan' ? P.pen : x.kind === 'wa' ? P.wa : x.kind === 'arahan' ? P.flag : x.kind === 'esc' || x.kind === 'esc-auto' ? P.up : x.kind === 'sys' ? P.check : P.tag;
  const cls = x.kind === 'esc' ? 'nd warn' : x.kind === 'esc-auto' ? 'nd err' : x.kind === 'sys' && x.ok ? 'nd ok' : 'nd ';
  const srcCls = x.kind === 'arahan' ? 'src skk' : x.kind === 'wa' ? 'src wa' : 'src esc';
  return (
    <li className={x.kind === 'sys' && x.ok ? 'sys' : undefined}>
      <span className={cls} aria-hidden="true"><Ic d={icon} size={11} /></span>
      <div>
        <div className="hd">
          <b>{x.bold}</b>{x.by ? ` · ${x.by}` : ''}
          {x.kind === 'wa' && <span className={srcCls}><Ic d={P.wa} size={11} />Dari WhatsApp</span>}
          {x.kind === 'arahan' && <span className={srcCls}><Ic d={P.flag} size={11} />Arahan SKK</span>}
          {(x.kind === 'esc' || x.kind === 'esc-auto') && <span className={srcCls}><Ic d={P.up} size={11} />Eskalasi</span>}
        </div>
        <div className="tm">{formatWibFull(x.at)}</div>
        {x.body && <div className="body">{x.body}</div>}
        {x.files && x.files.length > 0 && <div className="att">{x.files.map((f) => <span key={f}><Ic d={P.clip} size={13} />{f}</span>)}</div>}
      </div>
    </li>
  );
}

/** Kartu Riwayat dengan saringan Semua/Catatan/Perubahan. `onAudit` membuka panel Jejak audit lengkap (P34). */
/** `all` = tab Riwayat (B-18): semua entri tampil. "Jejak audit lengkap" = tautan ke halaman Jejak audit (B-21). */
export function RiwayatCard({ i, bare, all: showAll }: { i: Incident; onAudit?: () => void; bare?: boolean; all?: boolean }) {
  const all = riwayat(i);
  const [f, setF] = useState<'Semua' | 'Catatan' | 'Perubahan'>('Semua');
  const [more, setMore] = useState(!!showAll);
  const list = all.filter((x) => (f === 'Semua' ? true : f === 'Catatan' ? ['catatan', 'wa', 'arahan'].includes(x.kind) : !['catatan', 'wa', 'arahan'].includes(x.kind)));
  const shown = more ? list : list.slice(0, 3);
  const hidden = list.length - shown.length;
  return (
    <section className="p-card in-sec" aria-label={bare ? undefined : 'Riwayat'}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ gap: 2 }}>Riwayat · {all.length}<InfoTip label="riwayat" text={TIP_RIWAYAT} /></h2>
        <Link to={`/insiden/${i.no}/jejak-audit`} className="lk-alink">Jejak audit lengkap</Link>
      </div>
      <div className="in-rf" role="radiogroup" aria-label="Saring riwayat">
        {(['Semua', 'Catatan', 'Perubahan'] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => { setF(k); setMore(false); }}>{k}</button>
        ))}
      </div>
      <ol className="p-tl in-kr" aria-label="Riwayat insiden">{shown.map((x, n) => <RwNode key={`${x.at}-${n}`} x={x} />)}</ol>
      {hidden > 0 && <button type="button" className="in-more" onClick={() => setMore(true)}><Ic d={P.chev} size={14} />Tampilkan {hidden} entri sebelumnya</button>}
    </section>
  );
}

export function RiwayatFold({ i, onAudit }: { i: Incident; onAudit: () => void }) {
  const all = riwayat(i);
  const last = all[0];
  return (
    <Fold title={`Riwayat · ${all.length}`} cap={last ? `Terakhir: ${last.bold}${last.by ? ` ${last.by.replace(/ ·.*$/, '')}` : ''}, ${formatWib(last.at).replace(/ 20\d\d,/, '')}` : 'Belum ada entri'}>
      <RiwayatCard i={i} onAudit={onAudit} bare />
    </Fold>
  );
}

/** Data penutupan (kiri). `hl` menyorot kartu/bagian saat dipilih dari Kesiapan atau Cek cepat. */
export function ClosureDataCard({ i, hl, grupFrom }: { i: Incident; hl: string | null; grupFrom?: string }) {
  const c = i.handling?.closure;
  const d = detailOf(i);
  if (!c) return null;
  const fill = closureFilled(i);
  const by = c.requestedBy ?? i.pic ?? 'PIC';
  const mis = (c.claims ?? []).length > 0 ? '' : '';
  void mis;
  return (
    <section className={'p-card in-sec' + (hl === 'dp' ? ' in-hl' : '')} style={{ gap: 12 }} id="data-penutupan">
      <div className="lk-card-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="in-h">Data penutupan</h2>
          <span className="p-cap">Diisi {by} (PIC{grupFrom ? `, diambil alih dari ${grupFrom}` : ''}){c.requestedAt ? ` · diajukan ${formatWib(c.requestedAt)}` : ''}</span>
        </div>
        <span className={fill.done === fill.total ? 'p-tag t-ok' : 'p-tag t-caution'}>{fill.done === fill.total ? 'Lengkap' : 'Belum lengkap'}</span>
      </div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '150px minmax(0, 1fr)' }}>
        <dt>Ringkasan</dt><dd>{closureSummary(c) || '—'}</dd>
        <dt>Penyebab utama</dt><dd>{c.cause || '–'}{c.causeDetail && <div className="sub">{c.causeDetail}</div>}</dd>
        <dt>Faktor pendukung</dt><dd>{c.factors?.length ? c.factors.join(', ') : '–'}</dd>
        {c.lpo && c.lpo.choice !== 'tidak' && (<><dt>Produksi hilang (LPO)</dt><dd>{lpoText(c.lpo)}</dd></>)}
        <dt>Tim terlibat</dt><dd>{partnerLabel(i).join(', ') || '—'}<div className="sub">Menurut pelapor saat melapor: {handledText(d)}</div></dd>
        <dt>Bukti</dt>
        <dd className={hl === 'bk' ? 'in-hl' : undefined}>
          <span className="cl-files">{(c.evidence ?? []).map((e) => (
            <a key={e.name} href="#bukti" className="cl-file" onClick={(ev) => ev.preventDefault()}><Ic d={P.clip} size={13} />{e.name}<span className="v"><Ic d={P.eye} size={13} />Lihat</span></a>
          ))}</span>
        </dd>
        <dt>Kerugian akhir</dt>
        <dd className={hl === 'rg' ? 'in-hl' : undefined}>{c.lossFinalIdr != null ? formatRupiah(c.lossFinalIdr) : '—'}{d.lossIdr != null && <div className="sub">Perkiraan pelapor {formatRupiah(d.lossIdr)}</div>}</dd>
        <ClosureExtraRows c={c} />
      </dl>
    </section>
  );
}

/** Data penutupan ringkas pada insiden Ditutup (P24). */
export function ClosedDataCard({ i }: { i: Incident }) {
  const c = i.handling?.closure;
  const d = detailOf(i);
  if (!c) return null;
  return (
    <section className="p-card in-sec" style={{ gap: 12 }}>
      <div className="lk-card-head"><h2 className="in-h">Data penutupan</h2><span className="p-tag t-ok">Lengkap</span></div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '150px minmax(0, 1fr)' }}>
        <dt>Ringkasan</dt><dd>{closureSummary(c) || '—'}</dd>
        <dt>Penyebab utama</dt><dd>{c.cause || '–'}{c.causeDetail && <div className="sub">{c.causeDetail}</div>}</dd>
        <dt>Faktor pendukung</dt><dd>{c.factors?.length ? c.factors.join(', ') : '–'}</dd>
        {c.lpo && c.lpo.choice !== 'tidak' && (<><dt>Produksi hilang (LPO)</dt><dd>{lpoText(c.lpo)}</dd></>)}
        <dt>Bukti</dt><dd>{(c.evidence ?? []).map((e) => e.name).join(', ') || '—'}</dd>
        <dt>Kerugian akhir</dt><dd>{c.lossFinalIdr != null ? formatRupiah(c.lossFinalIdr) : '—'}{d.lossIdr != null && <div className="sub">Perkiraan pelapor {formatRupiah(d.lossIdr)}</div>}</dd>
        <ClosureExtraRows c={c} action={<UpdateLegalButton i={i} />} />
      </dl>
    </section>
  );
}

export { TlCard as FollowUpsCard } from '@/features/tindak-lanjut/components/TlCard';

const Row = ({ k, v, c, tip }: { k: string; v: ReactNode; c?: ReactNode; tip?: [string, string] }) => (
  <div className="row">
    <span className="k">{k}{tip && <InfoTip label={tip[0]} text={tip[1]} right />}</span>
    <span className="v">{v}</span>
    {c && <span className="c">{c}</span>}
  </div>
);

/** Kartu Info insiden / Ringkasan (kolom kanan). */
export function SummaryCard({ i, title, children, picExtra, hidePic }: { i: Incident; title: string; children?: ReactNode; picExtra?: ReactNode; hidePic?: boolean }) {
  const reg = registeredAt(i);
  const ver = verifiedEntry(i);
  const d = detailOf(i);
  const c = i.handling?.closure;
  const sev = i.severity;
  const grp = i.handling?.picPrev;
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">{title}</h2>
      <div className="in-times">
        <div className="row"><span className="k">Keparahan</span><span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {sev && <span className={`p-tag ${SEV_TAG_CLS[sev]}`}><span className="dot"></span>{SEV_LABEL[sev]}</span>}
          <span className="c">resmi · awal {d.reporterSeverity ? SEV_LABEL[d.reporterSeverity] : '—'}</span></span></div>
        <Row k="Klasifikasi" v={i.category} c={i.priority ? `Prioritas ${i.priority[0].toUpperCase()}${i.priority.slice(1)}` : undefined} />
        <Row k="Waktu registrasi" v={formatWibFull(reg)} />
        {ver && <Row k="Disetujui" tip={['disetujui', 'Waktu insiden disetujui dan menjadi data resmi.']} v={formatWibFull(ver.at)} c={`${durFull(reg, ver.at).replace(/ \d+ menit$/, (m) => m)} setelah registrasi · ${ver.by}`} />}
      </div>
      <div className="lk-divider" style={{ margin: 0 }}></div>
      {!hidePic && (
        <dl className="lk-kv1" style={{ gridTemplateColumns: '110px minmax(0, 1fr)' }}>
          <dt>Pelapor</dt><dd>{i.reporter}</dd>
          <dt>PIC</dt>
          <dd>
            {i.pic ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initials(i.pic)}</span>{i.pic}</span>
              : grp ? <><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initials(grp)}</span>{grp}</span><div className="sub">Tidak aktif sejak {formatDate(i.handling?.picInactiveSince ?? '')}</div></>
                : 'Belum ditunjuk'}
            {picExtra}
          </dd>
          {c ? (<><dt>Tim terlibat</dt><dd>{partnerLabel(i).map((p) => p.replace(/ \(.+\)$/, '')).join(', ') || '—'}</dd></>) : (<><dt>Sudah menangani</dt><dd>{handledText(d)} (menurut pelapor)</dd></>)}
          {children}
        </dl>
      )}
    </section>
  );
}

export function DueCard({ i, now, withEsc }: { i: Incident; now: string; withEsc?: boolean }) {
  const due = i.handleDueAt;
  if (!due) return null;
  const r = dueRemaining(due, now);
  const reg = registeredAt(i);
  const days = Math.round((new Date(due + 'Z').getTime() - new Date((i.handling?.dueDefaultAt ?? due) + 'Z').getTime()) / 86400000);
  void days;
  const base = i.severity ? `${SEV_LABEL[i.severity]} · ${handleDaysOf(i, reg)} hari kerja sejak registrasi ${formatDate(reg).replace(/ 20\d\d$/, '')}, ${reg.slice(11, 16)}` : '';
  return (
    <section className="p-card in-sec" style={{ gap: 8 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ gap: 2 }}>Tenggat penanganan<InfoTip label="tenggat penanganan" right text="Batas waktu menyelesaikan insiden, dihitung dari waktu registrasi sesuai keparahan. Bila diubah, alasan ada di riwayat." /></h2>
      </div>
      <span className="in-big">{formatWibFull(due)}</span>
      <span className={r.late ? 'in-due late' : 'in-due ok'} style={{ alignSelf: 'flex-start' }}><Ic d={P.clock} size={13} />{r.text}</span>
      <span className="p-cap">{base}{i.handling?.dueChangeReason ? ' · tenggat diubah' : ''}</span>
      {withEsc && (<><div className="lk-divider" style={{ margin: '4px 0' }}></div><span className="p-cap" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Eskalasi</span><span>{i.escalated ? 'Dieskalasi' : 'Belum dieskalasi'}</span></span></>)}
    </section>
  );
}

export function EscalationCard({ i }: { i: Incident }) {
  const es = (i.timeline ?? []).filter((e) => e.text.startsWith('Eskalasi'));
  if (!i.escalated && es.length === 0) return null;
  return (
    <section className="p-card in-sec" style={{ gap: 10 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}><h2 className="in-h">Eskalasi</h2><span className="p-tag t-caution">Dieskalasi</span></div>
      <ol className="p-tl" aria-label="Riwayat eskalasi">
        {es.map((e) => {
          const auto = e.text.startsWith('Eskalasi otomatis');
          const head = e.text.split(': ')[0].replace(/^Eskalasi (otomatis )?ke /, 'Ke ');
          return (
            <li key={e.at}>
              <span className="nd warn" aria-hidden="true"><Ic d={P.up} size={11} /></span>
              <div>
                <div className="hd"><b>{auto ? `${head} · otomatis` : `${head}${i.handling?.escalatedTo === 'skk' ? ' · Pengawas SKK' : ''}`}</b></div>
                <div className="dt">{auto ? 'Tenggat terlewat' : `Manual oleh ${e.by}`}</div>
                <div className="tm">{formatWibFull(e.at)}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Kondisi sekitar WK (info tambahan; data demo tetap, ASSUMPTION: belum ada sumber Analitik). */
export function SurroundCard({ i, minim }: { i: Incident; minim: boolean }) {
  const wk = i.wk;
  const loc = i.location.split(' · ')[0];
  return (
    <section className="p-card in-sec gw" aria-label="Kondisi sekitar wilayah kerja">
      <div className="gw-hd">
        <span className="tile"><Ic d={P.pin} size={16} /></span>
        <div className="t"><h2 className="in-h">Kondisi sekitar · {wk}</h2><span className="p-cap">Info tambahan · tidak memengaruhi keputusan penutupan</span></div>
        {!minim && <span className="p-tag t-info" style={{ height: 22, fontSize: 11, gap: 4 }}><Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" size={11} />AI</span>}
      </div>
      {!minim ? (
        <div className="gw-risk">
          <div className="top"><span className="k">Perkiraan kerawanan 30 hari ke depan</span><span className="lv"><i></i>Tinggi</span></div>
          <div className="meter" aria-hidden="true"><span className="lo"></span><span className="me"></span><span className="hi on"></span><span className="cr"></span></div>
          <div className="lbl"><span>Rendah</span><span>Sedang</span><span className="on">Tinggi</span><span>Kritis</span></div>
          <span className="p-cap">Perkiraan AI dari 6 insiden dalam 90 hari terakhir di wilayah ini (termasuk insiden ini) dan kabar di sekitarnya.</span>
        </div>
      ) : (
        <div className="gw-empty"><Ic d={P.info} size={15} /><span><b>Perkiraan kerawanan belum tersedia</b>Perkiraan muncul setelah ada minimal 5 insiden di wilayah ini dalam 90 hari · baru 1</span></div>
      )}
      <div className={minim ? 'gw-grid one' : 'gw-grid'}>
        {!minim ? (
          <>
            <div className="gw-box">
              <span className="k">Lokasi paling sering terjadi insiden · 90 hari</span>
              <div className="gw-locs">
                <div className="lr cur"><span className="nm">{loc}</span><span className="bar"><i style={{ width: '100%' }}></i></span><b>3</b></div>
                <div className="lr"><span className="nm">Sumur ADR-11</span><span className="bar"><i style={{ width: '66%' }}></i></span><b>2</b></div>
                <div className="lr"><span className="nm">Sumur ADR-03</span><span className="bar"><i style={{ width: '33%' }}></i></span><b>1</b></div>
              </div>
              <span className="p-cap">Lokasi insiden ini, <b style={{ color: 'var(--sev-high-ink)' }}>sudah 3 kali</b> dalam 90 hari</span>
            </div>
            <div className="gw-box">
              <span className="k">Kabar gangguan keamanan · {i.area.split(' · ')[0]}</span>
              <div className="gw-num"><b>12</b><span>kabar dalam 30 hari</span><span className="up">▲ naik 3× dari bulan sebelumnya</span></div>
              <div className="gw-bars" aria-hidden="true">{[30, 10, 40, 30, 30, 60, 100, 100].map((h, n) => <span key={n} className={n > 5 ? 'hot' : ''} style={{ height: `${h}%` }}></span>)}</div>
              <div className="gw-wk"><span>8 minggu lalu</span><span>minggu ini</span></div>
              <div className="gw-leg"><span><i style={{ background: 'var(--chart-series-1)' }}></i>Berita 5</span><span><i style={{ background: 'var(--sev-medium-dot)' }}></i>Medsos 6</span><span><i style={{ background: 'var(--ink-muted)' }}></i>Rilis polisi 1</span></div>
            </div>
          </>
        ) : (
          <div className="gw-box">
            <span className="k">Lokasi paling sering terjadi insiden · 90 hari</span>
            <div className="gw-locs"><div className="lr cur"><span className="nm">{loc}</span><span className="bar"><i style={{ width: '100%' }}></i></span><b>1</b></div></div>
            <span className="p-cap">Belum ada insiden lain di wilayah ini dalam 90 hari</span>
          </div>
        )}
      </div>
      <div className="gw-ft"><Ic d={P.link} size={13} /><span>Insiden ini ikut dihitung di Analitik wilayah ini.</span><a href="#analitik" className="lk-alink" style={{ fontSize: 12, whiteSpace: 'nowrap' }} onClick={(e) => e.preventDefault()}>Lihat tren di Analitik</a></div>
    </section>
  );
}

const GROUPS: ('Semua' | AuditGroup)[] = ['Semua', 'Status', 'Klasifikasi', 'PIC dan eskalasi', 'Tenggat', 'Akses'];

/** P34 / PS8: panel samping Jejak audit lengkap. */
export function AuditPanel({ i, initial = 'Semua', onClose }: { i: Incident; initial?: 'Semua' | AuditGroup; onClose: () => void }) {
  const [g, setG] = useState<'Semua' | AuditGroup>(initial);
  const rows: AuditRow[] = auditRows(i).filter((r) => g === 'Semua' || r.group === g);
  return (
    <div className="cl-over">
      <div className="lk-scrim" onClick={onClose}></div>
      <aside className="lk-side" role="dialog" aria-modal="true" aria-label="Riwayat insiden">
        <div className="sh">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 16 }}>Jejak audit</b><span className="p-cap">Semua perubahan data dan akses, dengan nilai lama dan baru</span></div>
          <button type="button" className="p-ibtn ghost" style={{ width: 32, height: 32 }} aria-label="Tutup panel" onClick={onClose}><Ic d={P.close} size={16} /></button>
        </div>
        <div className="sb">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GROUPS.map((k) => <button key={k} type="button" className="p-chip" aria-pressed={g === k} style={{ height: 28 }} onClick={() => setG(k)}>{k}</button>)}
          </div>
          {rows.length > 0 ? (
            <ol className="p-tl" aria-label="Riwayat insiden">
              {rows.map((r, n) => (
                <li key={n}>
                  <span className="nd" aria-hidden="true"><Ic d={ICON_BY[r.icon]} size={11} /></span>
                  <div><div className="hd"><b>{r.title}</b></div><div className="tm">{r.who}</div>{r.note && <div className="note">{r.note}</div>}</div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="lk-es" style={{ flex: 1, justifyContent: 'center', padding: '40px 16px' }}>
              <span style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--surface-sunken)', color: 'var(--ink-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic d="M3 6h18M7 12h10M10 18h4" size={24} /></span>
              <b>Tidak ada riwayat untuk filter ini.</b>
              <span style={{ color: 'var(--ink-muted)', maxWidth: 300 }}></span>
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setG('Semua')}>Hapus filter</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/** "Langkah berikutnya" (in-next): Tunjuk PIC (PS5), Jadikan arahan tindak lanjut (P33). */
export function NextStep({ icon, title, meta, action }: { icon: string; title: string; meta: string; action: ReactNode }) {
  return (
    <section className="in-next" aria-label="Langkah berikutnya">
      <span className="ic" aria-hidden="true"><Ic d={icon} size={18} /></span>
      <div className="tx"><span className="k">Langkah berikutnya</span><b>{title}</b><span className="mt">{meta}</span></div>
      <span className="acts">{action}</span>
    </section>
  );
}

