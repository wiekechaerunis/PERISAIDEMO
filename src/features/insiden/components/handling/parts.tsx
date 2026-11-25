// Bagian halaman kerja PIC (board P12, P14, P15, P17, PS*): kartu Langkah berikutnya, Riwayat, Ringkasan, Tindak lanjut, dialog Eskalasi.
import { Link } from 'react-router-dom';
import { lpoText } from './LpoSection';
import { demoNow } from '@/services/mock/clock';
import { useState, type ReactNode } from 'react';
import type { Closure, Incident } from '@/services/types';
import { SEV_LABEL } from '@/lib/severity';
import { formatDate, formatRupiah, formatWibFull } from '@/lib/format';

import { handleDaysOf } from '@/lib/deadline';
import { handlingOf, MAX_ESCALATION_REASON, closureDone, CLOSURE_REQUIRED } from '@/services/mock/workflow.handling';
import { Ic as P } from '../review/parts';
import { Modal } from '../review/ReviewDialogs';
import { SevTag } from '../detail/SummaryAside';
import { InfoTip } from '../detail/InfoTip';
import { formatDuration, registeredAt, verifiedEntry } from '../detail/detailLogic';
import {
  ESC_TARGETS, GROUP_MEMBERS, GROUP_NAME, PEJABAT_NAME, auditEntries, dueBadge, initialsOf,
  type AuditEntry, type HEntry, type PicMode,
} from '../../logic/handling';
import { STEP_CATALOG } from '@/services/mock/seedHistory';
import { Icon } from '@/components/ui/Icon';

export const D = {
  note: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  check: 'M20 6 9 17l-5-5',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  esc: 'M12 19V5M5 12l7-7 7 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  wa: 'M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5z',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  chev: 'm6 9 6 6 6-6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  retry: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  tick: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  close: 'M18 6 6 18M6 6l12 12',
  merge: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
};
const ENTRY_ICON = { note: D.note, check: D.check, clock: D.clock, esc: D.esc, merge: D.merge } as const;
const AUDIT_ICON = { check: D.check, tag: D.tag, person: D.user, clock: D.clock, send: D.send } as const;

export function TipW({ label, text, right, width }: { label: string; text: string; right?: boolean; width?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={open ? 'in-tw open' : 'in-tw'}>
      <button type="button" className="ib" aria-label={`Penjelasan ${label}`} onClick={() => setOpen((v) => !v)}><P d={D.info} size={14} /></button>
      <span className={right ? 'in-tip r' : 'in-tip'} role="tooltip" style={width ? { width } : undefined}>{text}</span>
    </span>
  );
}

const TIP_RIWAYAT = 'Catatan penanganan dan perubahan insiden dalam satu urutan, terbaru di atas. Entri tidak bisa diubah atau dihapus; koreksi dengan catatan baru. Nilai lama dan baru ada di Jejak audit lengkap.';
const TIP_TENGGAT = 'Batas waktu menyelesaikan insiden, dihitung dari waktu registrasi sesuai keparahan. Bila diubah, alasan ada di riwayat.';

/* ---------------- Riwayat ---------------- */

export type HFilter = 'semua' | 'catatan' | 'perubahan';

export function HistoryCard({
  entries, shown, hidden, expanded, onToggle, filter, onFilter, onAudit, failed, onRetry, empty, incidentNo,
}: {
  entries: HEntry[]; shown: HEntry[]; hidden: number; expanded: boolean; onToggle: () => void; filter: HFilter; onFilter: (f: HFilter) => void;
  onAudit: () => void; failed?: boolean; onRetry: () => void; empty: boolean; incidentNo: string;
}) {
  if (failed) {
    return (
      <section className="p-card in-sec">
        <h2 className="in-h">Riwayat</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 32, textAlign: 'center' }} role="alert">
          <span className="in-mi" style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--error-bg)', color: 'var(--error-ink)' }}><P d={D.warn} size={16} /></span>
          <b>Riwayat tidak dapat dimuat.</b>
          <span className="p-cap">Periksa koneksi lalu coba lagi.</span>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={onRetry}><P d={D.retry} size={16} />Muat ulang</button>
        </div>
      </section>
    );
  }
  const FILTERS: [HFilter, string][] = [['semua', 'Semua'], ['catatan', 'Catatan'], ['perubahan', 'Perubahan']];
  return (
    <section className="p-card in-sec">
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h" style={{ gap: 2 }}>Riwayat · {entries.length}<TipW label="riwayat" text={TIP_RIWAYAT} width={260} /></h2>
        {/* B-21: tautan ke halaman Jejak audit tersaring nomor insiden */}
        <Link to={`/insiden/${incidentNo}/jejak-audit`} className="lk-alink" style={{ fontSize: 12, fontWeight: 600 }} onClick={() => void onAudit}>Jejak audit lengkap</Link>
      </div>
      <div className="in-rf" role="radiogroup" aria-label="Saring riwayat">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={filter === k} onClick={() => onFilter(k)}>{l}</button>
        ))}
      </div>
      {empty && (
        <div className="in-empty-note"><P d={D.note} size={16} /><span><b>Belum ada catatan penanganan.</b> Catatan dari halaman Tangani insiden muncul di sini.</span></div>
      )}
      <ol className="p-tl in-kr" aria-label="Riwayat insiden">
        {shown.map((e) => <HistoryItem key={e.key} e={e} />)}
      </ol>
      {hidden > 0 && !expanded && (
        <button type="button" className="in-more" onClick={onToggle}><P d={D.chev} size={14} />Tampilkan {hidden} entri sebelumnya</button>
      )}
      {expanded && entries.length > 3 && (
        <button type="button" className="in-more up" onClick={onToggle}><P d={D.chev} size={14} />Sembunyikan entri lama</button>
      )}
    </section>
  );
}

export function HistoryItem({ e }: { e: HEntry }) {
  return (
    <li className={e.kind === 'sys' ? 'sys' : undefined}>
      <span className={e.nd ? `nd ${e.nd}` : 'nd '} aria-hidden="true"><P d={ENTRY_ICON[e.icon]} size={11} /></span>
      <div>
        <div className="hd">
          <b>{e.bold}</b>{e.rest}
          {e.src === 'esc' && <span className="src esc"><P d={D.esc} size={11} />Eskalasi</span>}
        </div>
        <div className="tm">{e.tm}</div>
        {e.body && <div className="body">{e.body}</div>}
      </div>
    </li>
  );
}

const AUDIT_CATS: ('Semua' | AuditEntry['cat'])[] = ['Semua', 'Status', 'Klasifikasi', 'PIC dan eskalasi', 'Tenggat', 'Akses'];

export function AuditPanel({ incident, due, onClose }: { incident: Incident; due?: string; onClose: () => void }) {
  const [cat, setCat] = useState<(typeof AUDIT_CATS)[number]>('Semua');
  const rows = auditEntries(incident, due).filter((r) => cat === 'Semua' || r.cat === cat);
  return (
    <>
      <div className="lk-scrim" onClick={onClose}></div>
      <aside className="lk-side" role="dialog" aria-modal="true" aria-label="Riwayat insiden">
        <div className="sh">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 16 }}>Jejak audit</b>
            <span className="p-cap">Semua perubahan data dan akses, dengan nilai lama dan baru</span>
          </div>
          <button type="button" className="p-ibtn ghost" style={{ width: 32, height: 32 }} aria-label="Tutup panel" onClick={onClose}><P d={D.close} size={16} /></button>
        </div>
        <div className="sb">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AUDIT_CATS.map((c) => (
              <button key={c} type="button" className="p-chip" aria-pressed={cat === c} style={{ height: 28 }} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <ol className="p-tl" aria-label="Riwayat insiden">
            {rows.map((r, n) => (
              <li key={n}>
                <span className="nd" aria-hidden="true"><P d={AUDIT_ICON[r.icon]} size={11} /></span>
                <div>
                  <div className="hd"><b>{r.text}</b></div>
                  <div className="tm">{r.meta}</div>
                  {r.note && <div className="note">{r.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Kartu Langkah berikutnya ---------------- */

const stepMeta = (text: string) => {
  const s = STEP_CATALOG.find((x) => x.text === text);
  return s ? `${s.tag} · tercatat di insiden serupa` : 'Dari insiden serupa';
};

export function NextStepCard({
  i, mode, due, escalatedLine, notesCount, closure, returned, onTake, onStep, onTangani,
}: {
  i: Incident; mode: PicMode; due?: string; escalatedLine: string; notesCount: number; closure?: Closure;
  returned?: { text: string; by: string; at: string } | null;
  onTake: () => void; onStep: (step: string, as: 'done' | 'ignored' | null) => void; onTangani: ReactNode;
}) {
  const [ask, setAsk] = useState(false);
  const h = handlingOf(i);
  const G = mode !== 'solo';
  const notTaken = mode === 'grup-belum';
  const done = closureDone(closure);
  const sev = i.severity;
  const steps = i.forwardedSteps ?? [];
  const answered = (s: string) => (h.stepsDone?.includes(s) ? 'done' : h.stepsIgnored?.includes(s) ? 'ignored' : null);
  const pending = steps.filter((s) => !answered(s)).length;
  const badge = due ? dueBadge(due) : null;
  const regIso = registeredAt(i);
  return (
    <section className="p-card in-warn-card" style={{ padding: 20, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
      <div className="pk">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}><P d={D.warn} size={15} /></span>
          <h2 className="p-h2">{notTaken ? 'Butuh penanganan dari tim Anda' : 'Butuh penanganan dari Anda'}</h2>
        </div>
        {G && (
          <div className="grp">
            <span className="av-stack">{GROUP_MEMBERS.map((m) => <span key={m} className="lk-av">{initialsOf(m)}</span>)}</span>
            <span><b>{GROUP_NAME}</b><br />{mode === 'grup-saya' ? `Anda mengambil alih · ${GROUP_MEMBERS.length - 1} anggota lain hanya bisa melihat` : `${GROUP_MEMBERS.length} anggota · belum ada yang mengambil alih`}</span>
          </div>
        )}
        <div className="due">
          <span className="p-cap" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Tenggat penanganan<TipW label="tenggat penanganan" text={TIP_TENGGAT} right /></span>
          <span className="big">{due ? formatWibFull(due) : 'Belum ditetapkan'}</span>
          {badge && <span className={badge.cls} style={{ alignSelf: 'flex-start' }}><P d={D.clock} size={13} />{badge.text}</span>}
          <span className="s">{sev ? `${SEV_LABEL[sev]} · ${sevDays(i)} hari kerja sejak registrasi ${shortDate(regIso)}, ${regIso.slice(11, 16)} · ${escalatedLine}` : escalatedLine}</span>
        </div>
        {returned && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)' }}>
            <b style={{ fontSize: 13 }}>Penutupan dikembalikan</b>
            <span className="p-cap" style={{ color: 'var(--ink)' }}>“{returned.text}”</span>
            <span className="p-cap">{returned.by} · {formatWibFull(returned.at)}</span>
          </div>
        )}
        {!notTaken && (
          <div className="chk">
            <span className="hdl">Sebelum ajukan penutupan</span>
            <div className="it">
              <span className={notesCount ? 'ok' : 'no'}>{notesCount ? <P d={D.check} size={11} /> : null}</span>
              <span>Catat langkah penanganan<span className="s">{notesCount ? `${notesCount} catatan di Riwayat` : 'Belum ada catatan'}</span></span>
            </div>
            <div className="it">
              <span className="no"></span>
              <span>{returned ? 'Perbaiki data penutupan' : 'Lengkapi data penutupan'}<span className="s">{returned ? 'Sesuaikan dengan alasan pengembalian, lalu ajukan lagi' : `${done} dari ${CLOSURE_REQUIRED.length} isian wajib terisi`}</span></span>
            </div>
          </div>
        )}
        {steps.length > 0 && !notTaken && (
          <div className="in-sar">
            <div className="sarh"><b>Saran dari pemeriksa</b><span className="p-tag t-caution" style={{ height: 22, fontSize: 11 }}>{pending ? `${pending} perlu ditanggapi` : 'Semua sudah ditanggapi'}</span></div>
            <span className="p-cap" style={{ marginTop: -4 }}>{PEJABAT_NAME} memilih langkah ini dari insiden serupa yang sudah ditutup. Tidak wajib.</span>
            <div className="rows">
              {steps.map((s) => {
                const a = answered(s);
                return (
                  <div key={s} className={'r' + (a ? ' done' : '')}>
                    <b>{s}</b>
                    <span className="m">{stepMeta(s)}</span>
                    {!a && (
                      <span className="a" style={{ display: 'flex' }}>
                        <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => onStep(s, 'done')}><P d={D.plus} size={14} />Jadikan tindak lanjut</button>
                        <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={() => onStep(s, 'ignored')}>Abaikan</button>
                      </span>
                    )}
                    {a && (
                      <span className="st" style={{ display: 'block' }}>
                        {a === 'done' ? '✓ Form tindak lanjut dibuka dengan isi terisi' : '✕ Diabaikan'} · <button type="button" onClick={() => onStep(s, null)}>Batalkan</button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {notTaken && <span className="wait">Anggota pertama yang mengambil alih menjadi PIC; anggota lain hanya bisa melihat. Tenggat tetap berjalan.</span>}
        {ask && (
          <div className="cf" style={{ display: 'flex' }}>
            <b>Ambil alih penanganan?</b>
            <span className="p-cap">Anda menjadi PIC insiden ini. Anggota lain diberi tahu dan hanya bisa melihat. Tercatat di Riwayat.</span>
            <div className="r">
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setAsk(false)}>Batal</button>
              <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => { setAsk(false); onTake(); }}>Ya, ambil alih</button>
            </div>
          </div>
        )}
        {notTaken && !ask && (
          <div className="acts" style={{ display: 'flex' }}>
            <button type="button" className="p-btn p-btn-primary" onClick={() => setAsk(true)}><P d={D.user} size={16} />Ambil alih penanganan</button>
          </div>
        )}
        {!notTaken && <div className="acts" style={{ display: 'flex' }}>{onTangani}</div>}
      </div>
    </section>
  );
}

const shortDate = (iso: string) => {
  const m = formatDate(iso).split(' ');
  return `${m[0]} ${m[1]}`;
};
const sevDays = (i: Incident) => handleDaysOf(i, registeredAt(i));

/* ---------------- Ringkasan, Eskalasi, Tindak lanjut ---------------- */

export function PicSummaryCard({ i, mode, closureNames }: { i: Incident; mode: PicMode; closureNames?: string[] }) {
  const sev = i.severity;
  const ver = verifiedEntry(i);
  const reg = registeredAt(i);
  const taken = handlingOf(i).takenBy;
  const grp = mode === 'grup-belum';
  const d = i.detail;
  return (
    <section className="p-card in-sec">
      <h2 className="in-h">Ringkasan</h2>
      <div className="in-times">
        <div className="row">
          <span className="k">Keparahan</span>
          <span className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {sev ? <SevTag sev={sev} /> : 'Belum ditentukan'}
            <span className="c">resmi{d?.reporterSeverity ? ` · awal ${SEV_LABEL[d.reporterSeverity]}` : ''}</span>
          </span>
        </div>
        <div className="row"><span className="k">Klasifikasi</span><span className="v">{i.category}</span>{i.priority && <span className="c">Prioritas {i.priority[0].toUpperCase() + i.priority.slice(1)}</span>}</div>
        <div className="row"><span className="k">Waktu registrasi</span><span className="v">{formatWibFull(reg)}</span></div>
        {ver && (
          <div className="row">
            <span className="k">Disetujui<InfoTip label="disetujui" text="Waktu insiden disetujui dan menjadi data resmi." right /></span>
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
          {i.picKind === 'grup' && (grp || !taken) ? (
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span className="lk-av grp" style={{ width: 22, height: 22 }}><P d={D.users} size={14} /></span>{GROUP_NAME}
              </span>
              <span className="p-cap">{GROUP_MEMBERS.join(', ')}</span>
            </span>
          ) : (
            <>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <span className="lk-av" style={{ width: 22, height: 22, fontSize: 10 }}>{initialsOf(taken ?? i.pic ?? '-')}</span>{taken ?? i.pic ?? 'Belum ditunjuk'}
              </span>
              {taken && <span className="p-cap" style={{ display: 'block' }}>Diambil alih dari {GROUP_NAME}</span>}
            </>
          )}
        </dd>
        {closureNames && closureNames.length > 0 ? (
          <><dt>Tim terlibat</dt><dd>{closureNames.map((n) => n.split(' · ')[0]).join(', ')}</dd></>
        ) : (
          <><dt>Sudah menangani</dt><dd>{d && d.handledBy.length ? `${handledLabel(d.handledBy)} (menurut pelapor)` : 'Belum diisi'}</dd></>
        )}
      </dl>
    </section>
  );
}
const HB: Record<string, string> = { belum: 'Belum ada', int: 'Security internal', bujp: 'BUJP', tni: 'TNI', polri: 'Polri' };
const handledLabel = (l: string[]) => l.map((x) => HB[x] ?? x).join(', ');

/** Kartu ringkas pengganti Tenggat+Ringkasan untuk anggota grup yang hanya melihat (P12h). */
export function DueCard({ i, due }: { i: Incident; due?: string }) {
  const badge = due ? dueBadge(due) : null;
  const sev = i.severity;
  const h = handlingOf(i);
  return (
    <section className="p-card in-sec" style={{ gap: 8 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}><h2 className="in-h" style={{ gap: 2 }}>Tenggat penanganan<TipW label="tenggat penanganan" text={TIP_TENGGAT} right /></h2></div>
      <span className="in-big">{due ? formatWibFull(due) : 'Belum ditetapkan'}</span>
      {badge && <span className={badge.cls}><P d={D.clock} size={13} />{badge.text}</span>}
      <span className="p-cap">{sev ? `${SEV_LABEL[sev]} · ${sevDays(i)} hari kerja sejak registrasi ${shortDate(registeredAt(i))}, ${registeredAt(i).slice(11, 16)}` : ''}</span>
      <div className="lk-divider" style={{ margin: '4px 0' }}></div>
      <span className="p-cap" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Eskalasi</span><span>{h.escalatedTo ? `Ke ${h.escalatedName ?? h.escalatedTo}` : 'Belum dieskalasi'}</span></span>
    </section>
  );
}

export function EscalationCard({ i, due, auto }: { i: Incident; due?: string; auto: boolean }) {
  const h = handlingOf(i);
  return (
    <section className="p-card in-sec" style={{ gap: 10 }}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}><h2 className="in-h">Eskalasi</h2><span className="p-tag t-caution">Dieskalasi</span></div>
      <ol className="p-tl" aria-label="Riwayat eskalasi">
        <li>
          <span className="nd warn" aria-hidden="true"><P d={D.esc} size={11} /></span>
          <div>
            <div className="hd"><b>Ke {auto ? PEJABAT_NAME : h.escalatedName ?? PEJABAT_NAME} · {auto ? 'otomatis' : 'manual'}</b></div>
            <div className="dt">{auto ? 'Tenggat terlewat' : h.escalationReason}</div>
            <div className="tm">{formatWibFull(auto ? due ?? demoNow() : demoNow())}</div>
          </div>
        </li>
      </ol>
    </section>
  );
}

/* ---------------- Data penutupan (baca saja) ---------------- */

export function ClosureReadonly({ c, reported }: { c: Closure; reported?: number | null }) {
  const names = c.partnerNames ?? [];
  return (
    <section className="p-card in-sec" style={{ gap: 12 }}>
      <div className="lk-card-head"><h2 className="in-h">Data penutupan</h2><span className="p-tag t-ok">Lengkap</span></div>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '150px minmax(0, 1fr)' }}>
        <dt>Ringkasan</dt><dd>{c.actions}</dd>
        <dt>Tim terlibat</dt><dd>{names.map((n) => n.replace(/^(.*) · (.*)$/, '$1 ($2)')).join(', ') || '-'}</dd>
        <dt>Penyebab utama</dt><dd>{c.cause || '–'}{c.causeDetail && <div className="sub">{c.causeDetail}</div>}</dd>
        <dt>Faktor pendukung</dt><dd>{c.factors?.length ? c.factors.join(', ') : '–'}</dd>
        {c.lpo && c.lpo.choice !== 'tidak' && (<><dt>Produksi hilang (LPO)</dt><dd>{lpoText(c.lpo)}</dd></>)}
        <dt>Bukti</dt><dd>{(c.evidence ?? []).map((e) => e.name).join(', ')}</dd>
        {c.lossFinalIdr !== null && (
          <><dt>Kerugian akhir</dt><dd>{formatRupiah(c.lossFinalIdr)}{reported ? <div className="sub">Perkiraan pelapor {formatRupiah(reported)}</div> : null}</dd></>
        )}
      </dl>
    </section>
  );
}

/* ---------------- Dialog Eskalasi (P15) ---------------- */

export function EscalateDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (a: { to: 'pejabat' | 'skk'; name: string; reason: string }) => string | null }) {
  const [to, setTo] = useState<'pejabat' | 'skk'>('pejabat');
  const [name, setName] = useState(ESC_TARGETS.pejabat[0]);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const opts: [typeof to, string, string][] = [
    ['pejabat', 'Pejabat Berwenang lain', 'Di PT Samudra Energi Nusantara.'],
    ['skk', 'Pengawas SKK Migas', 'Diberi tahu dan boleh memberi arahan. Tidak mengambil alih.'],
  ];
  const submit = () => {
    if (!reason.trim()) return setErr('Isi alasan eskalasi.');
    setErr(onConfirm({ to, name, reason }));
  };
  return (
    <Modal
      title="Eskalasi insiden" width={520} onClose={onClose}
      footer={<><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button><button type="button" className="p-btn p-btn-primary" onClick={submit}>Eskalasi</button></>}
    >
      <span>Insiden tetap Anda tangani. Penerima diberi tahu dan insiden diberi tag Dieskalasi sampai ditutup.</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Eskalasi ke<span className="p-req">*</span></span>
        <div className="lk-opts" role="radiogroup" aria-label="Eskalasi ke">
          {opts.map(([k, t, d], n) => (
            <button key={k} type="button" className="lk-opt" role="radio" aria-checked={to === k} onClick={() => { setTo(k); setName(ESC_TARGETS[k][0]); }}>
              <span className="n">{n + 1}</span><span><b>{t}</b><span className="d">{d}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Nama<span className="p-req">*</span></span>
        <div className="in-cbx">
          <button type="button" className="p-input rv-sel" aria-haspopup="listbox" aria-expanded={open} aria-label="Nama penerima" onClick={() => setOpen(!open)}>
            <span style={{ flex: 1 }}>{name}</span><Icon name="chevDown" size={16} />
          </button>
          {open && (
            <div className="in-pop" role="listbox" aria-label="Nama penerima">
              {ESC_TARGETS[to].map((n) => (
                <button key={n} type="button" role="option" className={n === name ? 'op on' : 'op'} aria-selected={n === name} onClick={() => { setName(n); setOpen(false); }}>
                  <span className="t"><b>{n}</b></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (err ? ' err' : '')} aria-label="Alasan" maxLength={MAX_ESCALATION_REASON} style={{ minHeight: 88 }} value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} />
        {err && <span className="p-help err" role="alert"><P d={D.warn} size={14} />{err}</span>}
        <span className="p-help row"><span></span><span>{reason.length}/{MAX_ESCALATION_REASON}</span></span>
      </div>
    </Modal>
  );
}
