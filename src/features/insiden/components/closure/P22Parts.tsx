// Layar Periksa penutupan (Pejabat Berwenang, Menunggu penutupan) 1:1 board P22-ReviewTutup, P22r-RingkasanDibuka, P22c-ReviewTutupCocok.
// Isi dari data mock insiden; teks contoh board hanya acuan bentuk. ADJ-13: ringkasan dibuka atas permintaan, tanpa panel AI lain;
// "Perlu dicek" kosong menulis "Tidak ada yang perlu dicek"; temuan AI menempel di Ringkasan penanganan ("AI · Belum cocok").
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { FollowUp, Incident } from '@/services/types';
import { FOLLOWUP_LABEL, LEGAL_STATUS_LABEL, SECURITY_OUTCOME_LABEL } from '@/services/types';
import { formatWib } from '@/lib/format';
import { initials } from '@/lib/rbac';
import { SEV_LABEL } from '@/lib/severity';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { closureSummary } from '@/services/mock/workflow.handling';
import { detailOf, registeredAt } from '../detail/detailLogic';
import { closureFilled, dueRemaining, jt, mismatches, reviewDeadline, timeShort } from '../../logic/closure';
import { extLabel } from '../../logic/attachments';
import { lpoCalc } from '../handling/LpoSection';
import { approvedAt, approvedBy } from './SyncParts';
import { Ic } from '../review/parts';
import { SelectField } from '../review/parts';

/** Kunci sorotan (in-hl) dari tombol Lihat: data penutupan, bukti, kerugian, tindak lanjut, klaim, operasi pulih. */
export type P22Hl = 'dp' | 'bk' | 'rg' | 'tl' | 'kl' | 'op' | null;

const I = {
  spark: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  tool: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  up: 'm18 15-6-6-6 6',
  down: 'm6 9 6 6 6-6',
  right: 'M9 18l6-6-6-6',
  yes: 'M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z',
  no: 'M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.6 2H17v12l-4 8a3 3 0 0 1-4-3.9z',
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  check: 'M20 6 9 17l-5-5',
};

const MS = (iso: string) => new Date(iso.length === 16 ? iso + ':00Z' : iso + 'Z').getTime();
/** "1 hr 20 j" (board P22, KPI Lama penanganan). */
export function durShort(from: string, to: string): string {
  const h = Math.max(0, Math.round((MS(to) - MS(from)) / 3_600_000));
  const d = Math.floor(h / 24);
  return [d ? `${d} hr` : '', `${h % 24} j`].filter(Boolean).join(' ');
}
const firstSentence = (t: string) => {
  const k = t.indexOf('. ');
  return (k < 0 ? t : t.slice(0, k)).replace(/\.$/, '');
};
const Dot = () => <span style={{ color: 'var(--ink-subtle)' }}> · </span>;

/** Tindak lanjut modul TL untuk insiden ini (sumber status asli). */
function tlOf(i: Incident, fus: FollowUp[]): FollowUp[] {
  const own = fus.filter((f) => f.incidentNo === i.no);
  if (own.length) return own;
  // cadangan: ringkasan tindak lanjut yang tersimpan di insiden (nomor TL dan status aslinya)
  return (i.handling?.followUps ?? []).map((f) => ({
    no: f.tl ?? f.id, incidentNo: i.no, action: f.title, pic: f.owner, dueAt: f.dueAt,
    status: f.tlStatus ?? (f.status === 'dikerjakan' ? 'berjalan' : f.status === 'selesai' ? 'selesai' : f.status === 'dibatalkan' ? 'dibatalkan' : 'belum-dimulai'),
    source: 'manual', createdBy: i.pic ?? '', createdAt: i.occurredAt, evidence: [], notes: [], history: [],
  }));
}

export interface CheckItem { key: string; text: ReactNode; go: Exclude<P22Hl, null> }

/** Isi "Perlu dicek" (ADJ-13 butir 3): klaim tanpa dukungan, TL diperiksa PIC-nya sendiri, selisih data antar-bagian. */
export function checksOf(i: Incident, fus: FollowUp[]): CheckItem[] {
  const c = i.handling?.closure;
  const d = detailOf(i);
  const out: CheckItem[] = [];
  for (const m of mismatches(i)) {
    const tl = i.handling?.followUps?.find((f) => f.title === m.followUp)?.tl;
    out.push({ key: `kl-${m.followUp}`, go: 'kl', text: <>{m.claim.charAt(0).toUpperCase() + m.claim.slice(1)} disebut di data penutupan, tetapi {tl ?? `“${m.followUp}”`} masih <b>{m.status}</b>.</> });
  }
  for (const f of tlOf(i, fus).filter((x) => x.status === 'selesai' && x.verifiedBy && x.verifiedBy === x.pic)) {
    out.push({ key: `tl-${f.no}`, go: 'tl', text: <>{f.no} selesai dan diperiksa oleh PIC-nya sendiri.</> });
  }
  const restored = c?.restoredAt ?? c?.aiRestoredAt;
  if (restored && d.opsHours) {
    const h = Math.round((MS(restored) - MS(i.occurredAt)) / 3_600_000);
    if (h > d.opsHours * 2) {
      out.push({
        key: 'op', go: 'op',
        text: <>Laporan menulis operasi berhenti <b>{d.opsHours} jam</b>, tetapi operasi baru pulih {timeShort(restored.length === 16 ? restored + ':00' : restored)} (<b>±{h} jam</b> sejak kejadian).{c?.lpo?.choice === 'ada' ? ' Angka produksi hilang ikut terpengaruh.' : ''}</>,
      });
    }
  }
  return out;
}

/** Kartu "Ringkasan untuk keputusan" (.rk). Tertutup bawaan (kelas `tutup`); "Ringkas untuk saya" / "Tutup". */
/** `closed`: varian Detail ditutup (P24, ADJ-13 butir 6) "Ringkasan insiden" 4 poin tanpa Perlu dicek. */
export function DecisionSummaryCard({ i, hl, setHl, closed = false }: { i: Incident; hl: P22Hl; setHl: (h: P22Hl) => void; closed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [jk, setJk] = useState(false);
  const [st, setSt] = useState<number | null>(null);
  const [vote, setVote] = useState<'ya' | 'tidak' | null>(null);
  const fus = useFollowUps();
  const c = i.handling?.closure;
  const d = detailOf(i);
  const checks = checksOf(i, fus);
  const steps = (c?.aiSteps ?? (i.handling?.notes ?? []).map((n) => ({ at: n.at, text: n.text, source: 'Catatan PIC', orig: undefined as string | undefined }))).map((s) => {
    const files = i.handling?.noteFiles?.[s.at] ?? [];
    const src = [...(i.timeline ?? []), ...(i.handling?.notes ?? [])].find((e) => e.at === s.at);
    return { ...s, orig: s.orig ?? `Isi asli: "${src?.text ?? s.text}"${files.length ? ` + ${files.join(', ')}` : ''} ·` };
  });
  const est = d.lossIdr;
  const fin = c?.lossFinalIdr ?? null;
  const pct = est && fin != null ? Math.round(((fin - est) / est) * 100) : null;
  const restored = c?.restoredAt ?? c?.aiRestoredAt;
  const lpo = c?.lpo;
  const lpoVol = lpo?.choice === 'ada' ? lpoCalc(lpo).volume : null;
  const running = tlOf(i, fus).filter((f) => !['selesai', 'dibatalkan'].includes(f.status));
  const go = (k: Exclude<P22Hl, null>) => () => setHl(hl === k ? null : k);
  const ev = c?.evidence ?? [];
  return (
    <section className={'p-card s2-card rk' + (open ? '' : ' tutup')} aria-label={closed ? 'Ringkasan insiden' : 'Ringkasan untuk keputusan'}>
      <div className="rk-hd">
        <span className="rk-tile"><Ic d={I.spark} size={18} /></span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <b style={{ fontSize: 15, lineHeight: '22px' }}>{closed ? 'Ringkasan insiden' : 'Ringkasan untuk keputusan'}</b>
            <span className="in-ai"><Ic d={I.spark} size={12} />AI</span>
          </span>
          <span className="p-cap">
            {closed
              ? open ? 'Kejadian, penanganan, dampak akhir, dan yang masih berjalan' : 'Inti insiden ini dalam 4 poin'
              : open ? 'Kejadian, penanganan, hasil, dan yang perlu dicek' : 'Kejadian, penanganan, hasil, dan yang perlu dicek dalam 4 poin'}
          </span>
        </div>
        <button type="button" className={open ? 'p-btn p-btn-secondary' : 'p-ai'} style={{ flex: 'none' }} aria-expanded={open} onClick={() => setOpen(!open)}>
          <Ic d={open ? I.up : I.spark} size={15} />
          <span className="lbl">{open ? 'Tutup' : closed ? 'Ringkas' : 'Ringkas untuk saya'}</span>
        </button>
      </div>
      {open && (
        <>
          <div className="rk-list">
            <div className="rk-it">
              <span className="ic"><Ic d={I.warn} size={15} /></span>
              <div><span className="k">Kejadian</span><div className="v">{firstSentence(d.securityImpact || d.story || i.title)} · {timeShort(i.occurredAt)}.</div></div>
            </div>
            <div className="rk-it">
              <span className="ic"><Ic d={I.tool} size={15} /></span>
              <div>
                <span className="k">Yang dilakukan</span>
                <div className="v">
                  {steps.length ? steps.map((s) => s.text.replace(/\.$/, '')).join('; ') + '.' : closureSummary(c) || 'Belum ada catatan penanganan.'}
                  {ev.length > 0 && ` Bukti: ${ev.map((e) => (e.caption || e.name).toLowerCase()).join(' dan ')}.`}
                  {steps.length > 0 && (
                    <div>
                      <button type="button" className="rk-lnk" aria-expanded={jk} onClick={() => setJk(!jk)}>
                        {jk ? 'Sembunyikan jejak' : `Lihat jejak · ${steps.length} langkah`}<Ic d={jk ? I.up : I.down} size={14} />
                      </button>
                    </div>
                  )}
                  {jk && (
                    <ol className="cl-tl" style={{ marginTop: 8 }}>
                      {steps.map((s, n) => (
                        <li key={s.at}>
                          <span className="dot">{n + 1}</span>
                          <button type="button" aria-pressed={st === n} onClick={() => setSt(st === n ? null : n)}>
                            <span className="w">{timeShort(s.at)} · <b className="srcl">{s.source}</b></span>
                            <span className="t">{s.text}</span>
                            <span className="src" style={{ display: st === n ? 'flex' : 'none' }}>
                              {s.orig} <Link to={`/insiden/${i.no}?tab=riwayat`}>Lihat di Riwayat</Link>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
            <div className="rk-it">
              <span className="ic"><Ic d={I.chart} size={15} /></span>
              <div>
                <span className="k">Dampak akhir</span>
                <div className="v">
                  {fin != null ? <>Kerugian <b>{jt(fin)}</b>{pct ? ` (${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}%)` : ''}</> : 'Kerugian akhir belum diisi'}
                  {lpoVol != null && <><Dot />produksi hilang <b>{lpoVol} bbl</b> (usulan)</>}
                  {restored && <><Dot />operasi pulih {timeShort(restored.length === 16 ? restored + ':00' : restored)}</>}
                  {c?.legal && <><Dot />{c.legal.status === 'dilaporkan' ? 'LP dibuat' : LEGAL_STATUS_LABEL[c.legal.status]}{c.result === 'tertangkap' || c.result === 'keduanya' ? ', pelaku tertangkap' : ', pelaku belum tertangkap'}</>}
                </div>
              </div>
            </div>
            <div className="rk-it">
              <span className="ic"><Ic d={I.clock} size={15} /></span>
              <div>
                <span className="k">{closed ? 'Masih berjalan' : 'Masih berjalan setelah ditutup'}</span>
                <div className="v">
                  {running.length === 0
                    ? 'Tidak ada tindak lanjut yang masih berjalan.'
                    : <>{running.length} tindak lanjut: {running.map((f, n) => (
                        <span key={f.no}>{n > 0 && <Dot />}{f.action.replace(/\.$/, '').toLowerCase()} (<b>{FOLLOWUP_LABEL[f.status]}</b>, {formatWib(f.dueAt).replace(/ 20\d\d,.*$/, '')})</span>
                      ))}</>}
                </div>
              </div>
            </div>
          </div>
          {!closed && (<div className="rk-cek">
            <span className="t"><Ic d={I.warn} size={15} />Perlu dicek<span className="n">{checks.length}</span></span>
            {checks.length === 0 ? (
              <div className="rk-row"><span>Tidak ada yang perlu dicek</span></div>
            ) : (
              checks.map((x) => (
                <div key={x.key} className="rk-row">
                  <span>{x.text}</span>
                  <button type="button" className="go" aria-pressed={hl === x.go} onClick={go(x.go)}>Lihat<Ic d={I.right} size={13} /></button>
                </div>
              ))
            )}
          </div>)}
          <div className="rk-ft">
            <span>Dibuat AI dari laporan, hasil penanganan, dan Riwayat. Cocokkan dengan bukti.</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flex: 'none' }}>
              Membantu?
              <button type="button" className="p-ibtn ghost" style={{ width: 26, height: 26 }} aria-label="Membantu" aria-pressed={vote === 'ya'} onClick={() => setVote('ya')}><Ic d={I.yes} size={14} /></button>
              <button type="button" className="p-ibtn ghost" style={{ width: 26, height: 26 }} aria-label="Tidak membantu" aria-pressed={vote === 'tidak'} onClick={() => setVote('tidak')}><Ic d={I.no} size={14} /></button>
            </span>
          </div>
        </>
      )}
    </section>
  );
}

/** "Lampiran laporan awal" (P22): lipatan foto pelapor di bawah isi laporan. */
export function InitialFilesCard({ i }: { i: Incident }) {
  const [open, setOpen] = useState(false);
  const files = detailOf(i).attachments;
  if (!files.length) return null;
  return (
    <section className="p-card s2-card" aria-label="Lampiran laporan awal" style={{ padding: '14px 20px', gap: 10 }}>
      <button type="button" className="s2-ai" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: '18px', color: 'var(--ink-muted)' }}>
          <Ic d={I.clip} size={14} />
          <span><b style={{ color: 'var(--ink)', fontWeight: 600 }}>Lampiran laporan awal</b> · {files.length} file dari pelapor, kondisi saat kejadian</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', flex: 'none' }}>
          {open ? 'Sembunyikan' : 'Lihat'}<Ic d={open ? I.up : I.down} size={14} />
        </span>
      </button>
      {open && (
        <div className="p-files">
          {files.map((f) => (
            <div className="p-file" key={f.name}>
              <span className="fi">{extLabel(f.name)}</span>
              <div className="grow"><b>{f.name}</b><span className="p-cap">{(f.sizeKb / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB{f.caption ? ` · ${f.caption}` : ''}</span></div>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label={`Pratinjau ${f.name}`}><Ic d={I.eye} size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Sorot kalimat klaim di ringkasan penanganan (kata pertama klaim cocok dengan kalimat). */
function splitClaim(text: string, claim?: string): [string, string | null, string] {
  if (!claim) return [text, null, ''];
  const key = claim.split(' ')[0].toLowerCase();
  const parts = text.split(/(?<=\.)\s+/);
  const n = parts.findIndex((p) => p.toLowerCase().includes(key));
  if (n < 0) return [text, null, ''];
  return [parts.slice(0, n).join(' '), parts[n], parts.slice(n + 1).join(' ')];
}

/** "Hasil penanganan" (P22): KPI, ringkasan penanganan + tanda AI · Belum cocok, Penyebab, Yang menangani, Bukti. */
/** `onCorrect`: varian Ditutup (P24) dengan tombol Koreksi data (ADJ-07, PD3) dan tanpa tanda klaim. */
/** `closed`: insiden Ditutup (P24 dengan `onCorrect`, P35 SKK hanya baca tanpa `onCorrect`). */
export function HandlingResultCard({ i, hl, setHl, grupFrom, onCorrect, closed = !!onCorrect }: { i: Incident; hl: P22Hl; setHl: (h: P22Hl) => void; grupFrom?: string; onCorrect?: () => void; closed?: boolean }) {
  const c = i.handling?.closure;
  const d = detailOf(i);
  if (!c) return null;
  const fill = closureFilled(i);
  const est = d.lossIdr;
  const fin = c.lossFinalIdr;
  const pct = est && fin != null ? Math.round(((fin - est) / est) * 100) : null;
  const lpo = c.lpo;
  const calc = lpo?.choice === 'ada' ? lpoCalc(lpo) : null;
  const asked = c.requestedAt ?? registeredAt(i);
  const appr = approvedAt(i);
  const due = i.handleDueAt;
  const inTime = !due || asked <= due;
  // ADJ-10: diukur sampai ditutup; saat Periksa penutupan sampai waktu diajukan
  const end = c.closedAt ?? asked;
  const mis = mismatches(i);
  const m0 = closed ? undefined : mis[0];
  const tl0 = m0 ? i.handling?.followUps?.find((f) => f.title === m0.followUp) : undefined;
  // `summary` = ringkasan hasil yang tampil di Data penutupan (lebih lengkap dari isian actions), fallback ke closureSummary
  const [pre, claimTxt, post] = splitClaim(c.summary || closureSummary(c), m0?.claim);
  const restored = c.restoredAt;
  const files = [...(c.evidence ?? []), ...(lpo?.files ?? []).map((f) => ({ ...f, caption: 'Dasar angka produksi hilang' }))];
  const hlc = (k: Exclude<P22Hl, null>) => (hl === k ? 'in-hl' : undefined);
  return (
    <section className={'p-card s2-card' + (hl === 'dp' ? ' in-hl' : '')} id="data-penutupan" aria-labelledby="s2-hs">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 id="s2-hs">Hasil penanganan</h2>
          <span className="p-cap">
            {closed
              ? `Diisi ${c.requestedBy ?? i.pic ?? 'PIC'} (PIC)${c.closedBy ? `, disetujui ${c.closedBy}${onCorrect && c.closedAt ? ` ${timeShort(c.closedAt)}` : ''}` : ''}${onCorrect ? ' · angka dampak dan proses hukum bisa dikoreksi tanpa buka kembali' : ''}`
              : <>Diisi {c.requestedBy ?? i.pic ?? 'PIC'} (PIC{grupFrom ? `, diambil alih dari ${grupFrom}` : ''}) · diajukan {formatWib(asked)}</>}
          </span>
        </div>
        {closed ? onCorrect && (
          <button type="button" className="p-btn p-btn-secondary" style={{ minHeight: 32, flex: 'none' }} onClick={onCorrect}><Ic d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" size={15} />Koreksi data</button>
        ) : (
          <span className={fill.done === fill.total ? 'p-tag t-ok' : 'p-tag t-caution'}>{fill.done === fill.total ? 'Lengkap' : 'Belum lengkap'}</span>
        )}
      </div>
      <div className="s2-kpi">
        <div className={hlc('rg')}>
          <span className="k">Kerugian akhir</span>
          <b>{fin != null ? jt(fin) : '—'}</b>
          <span className="c">{closed && est ? `Awal ${jt(est)}` : pct == null ? (est ? `Perkiraan pelapor ${jt(est)}` : 'Perkiraan pelapor belum diisi') : pct === 0 ? `Sama dengan perkiraan pelapor ${jt(est!)}` : `${pct > 0 ? 'Naik' : 'Turun'} ${Math.abs(pct)}% dari perkiraan pelapor ${jt(est!)}`}</span>
        </div>
        <div>
          <span className="k">Produksi hilang (LPO)</span>
          <b>{calc?.volume != null ? `${calc.volume} ${lpo?.kind === 'gas' ? 'MMSCF' : 'bbl'}` : lpo?.choice === 'belum' ? 'Belum dihitung' : 'Tidak ada'}</b>
          <span className="c">{calc?.value != null ? `US$${calc.value.toLocaleString('id-ID')} · usulan` : 'opsional'}</span>
        </div>
        <div>
          <span className="k">Lama penanganan</span>
          <b>{appr ? durShort(appr, end) : '—'}</b>
          <span className="c">Total {durShort(registeredAt(i), end)} · {inTime ? 'dalam tenggat' : 'melewati tenggat'}</span>
        </div>
        <div>
          <span className="k">Proses hukum</span>
          <b>{c.legal ? (c.legal.status === 'dilaporkan' ? 'Lapor polisi' : LEGAL_STATUS_LABEL[c.legal.status]) : 'Tidak diproses'}</b>
          <span className="c">{c.result === 'tertangkap' || c.result === 'keduanya' ? 'Pelaku tertangkap' : c.result ? `Hasil pengamanan: ${SECURITY_OUTCOME_LABEL[c.result]}` : '—'}</span>
        </div>
      </div>
      <p className="s2-p">
        <span className="s2-lbl" style={{ display: 'block', marginBottom: 2 }}>Ringkasan penanganan</span>
        {pre}
        {claimTxt && (
          <>
            {' '}
            <span className={hlc('kl')} style={{ background: 'color-mix(in srgb, var(--caution-bg) 80%, transparent)', boxShadow: 'inset 0 -2px 0 color-mix(in srgb, var(--caution-ink) 45%, transparent)', borderRadius: 3, padding: '0 2px' }}>{claimTxt}</span>
          </>
        )}
        {post && ` ${post}`}
      </p>
      {m0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: -6, fontSize: 12, lineHeight: '17px', color: 'var(--ink-muted)' }}>
          <span className="in-ai" style={{ flex: 'none' }}><Ic d={I.spark} size={12} />AI</span>
          <span>
            <b style={{ color: 'var(--caution-ink)', fontWeight: 600 }}>Belum cocok:</b> tindak lanjut {tl0?.tl ?? ''} “{m0.followUp}” masih {m0.status} dan belum ada catatan di Riwayat.{' '}
            <button type="button" onClick={() => setHl(hl === 'tl' ? null : 'tl')} style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer' }}>Lihat tindak lanjut</button>
          </span>
        </div>
      )}
      <div className="s2-grp">
        <span className="h">Penyebab</span>
        <dl className="s2-kv">
          <dt>Penyebab utama</dt><dd>{c.cause || '–'}{c.causeDetail && <span className="s">{c.causeDetail}</span>}</dd>
          <dt>Faktor pendukung</dt><dd>{c.factors?.length ? c.factors.join(' · ') : '–'}</dd>
        </dl>
      </div>
      <div className="s2-grp">
        <span className="h">Yang menangani</span>
        <dl className="s2-kv">
          <dt>Tim terlibat</dt><dd>{(c.partnerNames ?? []).map((p) => <span key={p} style={{ display: 'block' }}>{p.replace(' · ', ' (').replace(/\(([^)]*)$/, '($1)')}</span>)}{!(c.partnerNames ?? []).length && '—'}</dd>
          <dt>Operasi pulih</dt><dd className={hlc('op')}>{restored ? `${formatWib(restored.length === 16 ? restored + ':00' : restored)} WIB` : '—'}</dd>
          {c.legal?.lpNo && (<><dt>Nomor LP</dt><dd><span className="p-mono">{c.legal.lpNo}</span></dd></>)}
        </dl>
      </div>
      <div className={'s2-grp' + (hl === 'bk' ? ' in-hl' : '')}>
        <span className="h">Bukti</span>
        <div className="p-files">
          {files.map((f) => (
            <div className="p-file" key={f.name}>
              <span className="fi">{extLabel(f.name)}</span>
              <div className="grow"><b>{f.name}</b>{f.caption && <span className="p-cap">{f.caption}</span>}</div>
              <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label={`Pratinjau ${f.name}`}><Ic d={I.eye} size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CONTRACT_OPTIONS: Record<string, string[]> = {
  'PT Garda Nusantara Sejahtera': ['KTR-2026-0014', 'KTR-2025-0102'],
  'Polres Musi Banyuasin': ['PKS-2025-0031'],
};

/** Kartu kanan "Butuh persetujuan Anda" (P22, kelas in-warn-card, sticky): Batas putusan, Diajukan, Tenggat PIC, Kesiapan, Kontrak, Catatan. */
export function ApprovalCard({ i, now, hl, setHl, contracts, onContracts, note, onNote, onReturn, onClose, grupFrom }: {
  i: Incident; now: string; hl: P22Hl; setHl: (h: P22Hl) => void; contracts: { partner: string; ref: string }[];
  onContracts: (c: { partner: string; ref: string }[]) => void; note: string; onNote: (v: string) => void; onReturn: () => void; onClose: () => void; grupFrom?: string;
}) {
  const fus = useFollowUps();
  const c = i.handling?.closure;
  const fill = closureFilled(i);
  const asked = c?.requestedAt ?? now;
  const deadline = reviewDeadline(asked);
  const rem = dueRemaining(deadline, now);
  const due = i.handleDueAt;
  const inTime = !due || asked <= due;
  const mis = mismatches(i);
  const tls = tlOf(i, fus);
  const running = tls.filter((f) => !['selesai', 'dibatalkan'].includes(f.status)).length;
  const self = tls.filter((f) => f.status === 'selesai' && f.verifiedBy && f.verifiedBy === f.pic).length;
  const ev = [...(c?.evidence ?? []), ...(c?.lpo?.files ?? [])];
  const go = (k: Exclude<P22Hl, null>) => () => setHl(hl === k ? null : k);
  const Row = ({ k, cls, icon, title, sub, extra }: { k: Exclude<P22Hl, null>; cls: string; icon: string; title: ReactNode; sub: string; extra?: ReactNode }) => (
    <button type="button" aria-pressed={hl === k} onClick={go(k)}>
      <span className={cls}><Ic d={icon} size={11} /></span>
      <span className="tx">{title}{extra}<span className="s">{sub}</span></span>
      <span className="go">Lihat</span>
    </button>
  );
  return (
    <section className="p-card s2-card in-warn-card" style={{ padding: 20, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
      <h2 className="in-h" style={{ margin: 0 }}>Butuh persetujuan Anda</h2>
      <dl className="s2-kv" style={{ gridTemplateColumns: '104px minmax(0, 1fr)' }}>
        <dt>Batas putusan</dt><dd><b>{formatWib(deadline)}</b><span className="s">{rem.late ? rem.text : `${rem.text.replace(/^sisa /, 'sisa ')}`}</span></dd>
        <dt>Diajukan</dt><dd>{c?.requestedBy ?? i.pic ?? 'PIC'} (PIC){grupFrom ? `, diambil alih dari ${grupFrom}` : ''}<span className="s">{formatWib(asked)}</span></dd>
        <dt>Tenggat PIC</dt>
        <dd>
          <b style={{ color: inTime ? 'var(--status-success-ink)' : 'var(--error-ink)' }}>{inTime ? 'Dalam tenggat' : 'Melewati tenggat'}</b>
          <span className="s">Dinilai saat diajukan{due ? ` · tenggat ${formatWib(due).replace(/ 20\d\d,/, ',')}` : ''}</span>
        </dd>
      </dl>
      <div className="cl-ready" style={{ paddingTop: 12, borderTop: '1px solid color-mix(in srgb, var(--caution-ink) 20%, transparent)' }}>
        <span className="hd">Kesiapan</span>
        <Row k="dp" cls={fill.done === fill.total ? 'ok' : 'wr'} icon={fill.done === fill.total ? I.check : I.warn} title={fill.done === fill.total ? 'Data penutupan lengkap' : 'Data penutupan belum lengkap'} sub={`${fill.done} dari ${fill.total} isian wajib`} />
        <Row k="bk" cls="ok" icon={I.check} title="Bukti terlampir" sub={`${ev.length} file`} />
        {(running > 0 || self > 0) && (
          <Row k="tl" cls="nt" icon={I.clock} title={[running ? `${running} tindak lanjut berjalan` : '', self ? `${self} diperiksa sendiri` : ''].filter(Boolean).join(', ')} sub="Tidak menghalangi penutupan" />
        )}
        {mis.length > 0 && (
          <Row
            k="kl" cls="wr" icon="M12 9v4M12 17h.01" title={`${mis.length} klaim belum cocok `}
            extra={<span className="p-tag t-info" style={{ height: 18, fontSize: 10, marginLeft: 4, verticalAlign: 1 }}>AI</span>}
            sub={`${mis[0].claim.charAt(0).toUpperCase() + mis[0].claim.slice(1)}, TL masih ${mis[0].status}`}
          />
        )}
      </div>
      {contracts.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kontrak mitra yang terlibat<span className="p-req">*</span></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {contracts.map((k, n) => (
              <SelectField
                key={k.partner} label={null} ariaLabel={`Kontrak ${k.partner}`} selected={k.ref} placeholder={!k.ref}
                display={k.ref ? <>{k.partner} · <span className="p-mono" style={{ fontSize: 12 }}>{k.ref}</span></> : `Pilih kontrak ${k.partner}`}
                options={(CONTRACT_OPTIONS[k.partner] ?? [k.ref]).filter(Boolean).map((r) => ({ key: r, label: r }))}
                onPick={(r) => onContracts(contracts.map((x, m) => (m === n ? { ...x, ref: r } : x)))}
              />
            ))}
          </div>
          <span className="p-help">Diisi awal dari kontrak aktif di WK ini.</span>
        </div>
      )}
      <div className="p-field" style={{ gap: 6 }}>
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Catatan <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
        <textarea className="p-input p-area" aria-label="Catatan penutupan" value={note} onChange={(e) => onNote(e.target.value)} placeholder="mis. Pastikan tindak lanjut yang berjalan selesai sebelum tenggatnya." style={{ minHeight: 64, background: 'var(--surface)' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="p-btn p-btn-secondary" style={{ flex: 1, justifyContent: 'center', background: 'var(--surface)' }} onClick={onReturn}>Kembalikan ke PIC</button>
        <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Tutup insiden</button>
      </div>
      <span className="s2-foot">Keputusan dicatat di jejak audit atas nama Anda.</span>
    </section>
  );
}

/** "Info laporan" (P22): Diperiksa, PIC (+ Ganti PIC), Terkait. */
/** `skk`: tampilan SKK (P35) dengan baris KKKS dan tanpa Terkait. `full`: bentuk P31/P33 (keparahan resmi, avatar PIC,
 *  "(Anda)" bila pemeriksa = `me`, Terkait dengan keterangan Kerawanan). */
export function ReportInfoCard({ i, onReassign, krwTitle, skk, full, me }: { i: Incident; onReassign?: () => void; krwTitle?: string; skk?: boolean; full?: boolean; me?: string }) {
  const by = approvedBy(i);
  const at = approvedAt(i);
  if (full) {
    const sub = [at && timeShort(at), i.severity && `keparahan resmi ${SEV_LABEL[i.severity]}`].filter(Boolean).join(' · ');
    return (
      <section className="p-card in-sec">
        <h2 className="in-h">Info laporan</h2>
        <dl className="lk-kv1" style={{ gridTemplateColumns: '96px minmax(0, 1fr)' }}>
          <dt>Diperiksa</dt><dd>{by ? `${by}${by === me ? ' (Anda)' : ''}` : '—'}{sub && <div className="sub">{sub}</div>}</dd>
          <dt>PIC</dt>
          <dd>
            {i.pic ? (
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initials(i.pic)}</span>{i.pic}
              </span>
            ) : '—'}
            {onReassign && <> <button type="button" className="lk-alink" style={{ fontSize: 12, background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={onReassign}>Ganti PIC</button></>}
          </dd>
          {i.fromKrw && (<><dt>Terkait</dt><dd><Link to={`/kerawanan/${i.fromKrw}`}>{krwTitle ?? i.fromKrw}</Link><div className="sub p-mono">{i.fromKrw} · Kerawanan</div></dd></>)}
        </dl>
      </section>
    );
  }
  return (
    <section className="p-card s2-card" style={{ padding: 20 }}>
      <h2 className="in-h" style={{ margin: 0 }}>Info laporan</h2>
      <dl className="s2-kv" style={{ gridTemplateColumns: '104px minmax(0, 1fr)' }}>
        {skk && (<><dt>KKKS</dt><dd>{i.org}<span className="s">{i.wk}</span></dd></>)}
        <dt>Diperiksa</dt><dd>{by ?? '—'}{at && <span className="s">{timeShort(at)}</span>}</dd>
        <dt>PIC</dt><dd>{i.pic ?? '—'}{onReassign && <> <button type="button" className="lk-alink" style={{ fontSize: 12, background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={onReassign}>Ganti PIC</button></>}</dd>
        {!skk && i.fromKrw && (<><dt>Terkait</dt><dd><Link to={`/kerawanan/${i.fromKrw}`}>{krwTitle ?? i.fromKrw}</Link><span className="s p-mono">{i.fromKrw}</span></dd></>)}
      </dl>
    </section>
  );
}

/** "Kondisi sekitar" (P22): kartu terlipat dengan ringkasan satu baris; isi lengkap dari SurroundCard saat dibuka. */
export function SurroundFold({ minim, children }: { minim: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="p-card s2-card" style={{ padding: '16px 20px' }}>
      <button type="button" className="s2-ai" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><b style={{ fontSize: 14 }}>Kondisi sekitar</b><span className="in-ai"><Ic d={I.spark} size={12} />AI</span></span>
          <span className="p-cap">{minim ? 'Perkiraan kerawanan belum tersedia · baru 1 insiden dalam 90 hari' : 'Kerawanan 30 hari ke depan: Tinggi · 12 kabar gangguan 30 hari terakhir'}</span>
        </span>
        <Ic d={open ? I.up : I.down} size={16} />
      </button>
      {open && children}
    </section>
  );
}


/** Kartu kanan "Ditutup" (P24): Ditutup oleh, Tenggat (dinilai saat diajukan, ADJ-09), Eskalasi, Buka kembali. */
export function ClosedCard({ i, closedAt, reopenUntil }: { i: Incident; closedAt: string | null; reopenUntil?: string }) {
  const c = i.handling?.closure;
  const due = i.handleDueAt;
  const asked = c?.requestedAt;
  const inTime = !due || !asked || asked <= due;
  return (
    <section className="p-card s2-card" style={{ padding: 20, background: 'color-mix(in srgb, var(--status-success-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--status-success-ink) 25%, var(--status-success-bg))' }}>
      <h2 className="in-h" style={{ margin: 0 }}>Ditutup</h2>
      <dl className="s2-kv" style={{ gridTemplateColumns: '104px minmax(0, 1fr)' }}>
        <dt>Ditutup oleh</dt><dd>{c?.closedBy ?? '—'}{closedAt && <span className="s">{formatWib(closedAt)} WIB</span>}</dd>
        <dt>Tenggat</dt>
        <dd>
          <b style={{ color: inTime ? 'var(--status-success-ink)' : 'var(--error-ink)' }}>{inTime ? 'Dalam tenggat' : 'Melewati tenggat'}</b>
          <span className="s">Dinilai saat diajukan{asked ? ` ${timeShort(asked)}` : ''}{due ? ` · tenggat ${timeShort(due)}` : ''}</span>
        </dd>
        <dt>Eskalasi</dt><dd>{i.escalated ? 'Dieskalasi' : 'Tidak dieskalasi'}</dd>
        {reopenUntil && (<><dt>Buka kembali</dt><dd>Sampai {reopenUntil}<span className="s">30 hari sejak ditutup</span></dd></>)}
      </dl>
    </section>
  );
}

/** Tindak lanjut tampilan SKK (P35): hanya yang sudah selesai diperiksa; sisanya disebut jumlahnya. */
export function SkkFollowUpsCard({ i }: { i: Incident }) {
  const fus = useFollowUps();
  const all = tlOf(i, fus).filter((f) => f.status !== 'dibatalkan');
  if (!all.length) return null;
  const done = all.filter((f) => f.status === 'selesai');
  const rest = all.length - done.length;
  return (
    <section className="p-card s2-card">
      <h2>Tindak lanjut · {all.length}</h2>
      <div>
        {done.map((f) => (
          <div key={f.no} className="s2-tl">
            <span>{f.action}<span className="p-cap" style={{ display: 'block' }}>{f.pic} · {formatWib(f.dueAt).replace(/ 20\d\d,.*$/, '')}</span></span>
            <span className="p-tag t-ok">Selesai</span>
          </div>
        ))}
      </div>
      {rest > 0 && (
        <span className="s2-foot"><b style={{ color: 'var(--ink)', fontWeight: 600 }}>{rest} masih berjalan.</b> Rinciannya tampil setelah selesai diperiksa PIC insiden.</span>
      )}
    </section>
  );
}
