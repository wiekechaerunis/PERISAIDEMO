// Board MP5-Tutup (sheet Tutup + konfirmasi kontrak mitra) dan MP6-UbahTenggat (sheet + pemilih tanggal) untuk Pejabat Berwenang pada insiden
// berjalan / minta-ditutup. Kembalikan ke PIC, Ganti PIC, Buka kembali lewat menu ⋯ (board P25, P26, P28 versi desktop; sheet mengikuti pola MP5).
// Logika = PejabatHandlingPage desktop: closeIncident, returnToPic, reassignPic, changeDueDate (dueErrors), reopen.
import { useState, type ReactNode } from 'react';
import { demoNow } from '@/services/mock/clock';
import { Link } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { formatDate } from '@/lib/format';
import { SEV_LABEL } from '@/lib/severity';
import type { Incident } from '@/services/types';
import {
  canReopen, changeDueDate, closeIncident, closedAtOf, dueErrors, openFollowUps, reassignPic, reopen, reopenLimit, returnToPic,
  type CloseInput,
} from '@/services/mock/workflow.closure';
import { PIC_GROUPS, PIC_PEOPLE, type DecisionResult } from '@/services/mock/workflow';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { formatDuration, registeredAt } from '@/features/insiden/components/detail/detailLogic';
import { Ic } from '@/features/insiden/components/review/parts';
import { CONTRACT_OPTIONS, FU_LABEL, FU_TAG, dueRemaining, reopenLimitText } from '@/features/insiden/logic/closure';
import { MobileShell } from '../ui/MobileShell';
import { IncHead, KejadianSec, LampiranSec, MenuItem, P, PtStrip, Sheet, SheetTitle, TimesSec, ToastLine, WARN_ERR, type ToastM } from './parts';

const MAX = 500;
type Dlg = null | 'menu' | 'tutup' | 'kembalikan' | 'ganti-pic' | 'tenggat' | 'buka' | 'nobuka';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
const DAY = 86_400_000;

export function PejabatView({ i }: { i: Incident }) {
  const decide = useDemoStore((s) => s.decide);
  const by = DEMO_USERS.pejabat.name;
  const [dlg, setDlg] = useState<Dlg>(null);
  const [toast, setToast] = useState<ToastM | null>(null);
  const [error, setError] = useState<string>();
  const closed = i.status === 'ditutup';
  const waiting = i.status === 'minta-ditutup';
  const rem = i.handleDueAt ? dueRemaining(i.handleDueAt, demoNow()) : null;

  const run = (r: DecisionResult, ok: string): boolean => {
    if (r.ok) {
      setDlg(null);
      setError(undefined);
      setToast({ text: ok });
      return true;
    }
    setError(r.reason);
    setToast({ text: r.reason, tone: 'err' });
    return false;
  };
  const closeDlg = () => { setDlg(null); setError(undefined); };

  return (
    <MobileShell
      title="Detail insiden" backTo="/insiden" bodyStyle={{ paddingBottom: waiting ? 96 : undefined }}
      actions={<button type="button" className="ib44" aria-label="Aksi lain" aria-haspopup="menu" onClick={() => setDlg('menu')}><Ic d={P.more} size={20} /></button>}
      footer={waiting ? <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDlg('tutup')}><Ic d={P.tick} size={16} />Tutup insiden</button> : undefined}
      overlay={
        <>
          {dlg === 'menu' && (
            <Sheet role="menu" ariaLabel="Aksi lain" onClose={closeDlg} footer={<button type="button" className="p-btn p-btn-secondary" onClick={closeDlg}>Batal</button>}>
              {closed ? (
                <MenuItem icon={P.restart} label="Buka kembali" onClick={() => setDlg(canReopen(i, demoNow()) ? 'buka' : 'nobuka')} />
              ) : (
                <>
                  {waiting && <MenuItem icon={P.undo} label="Kembalikan ke PIC" onClick={() => setDlg('kembalikan')} />}
                  <MenuItem icon={P.person} label="Ganti PIC" onClick={() => setDlg('ganti-pic')} />
                  <MenuItem icon={P.cal} label="Ubah tenggat" onClick={() => setDlg('tenggat')} />
                </>
              )}
            </Sheet>
          )}
          {dlg === 'tutup' && (
            <CloseSheet
              i={i} error={error} onClose={closeDlg}
              onConfirm={(input) => run(decide((s) => closeIncident(s, i.no, by, { ...input, at: demoNow() })), `Insiden ${i.no} ditutup`)}
            />
          )}
          {dlg === 'kembalikan' && (
            <ReasonSheet
              title="Kembalikan ke PIC?" confirm="Kembalikan" cancel="Batal" error={error} onClose={closeDlg}
              intro={`Insiden tetap Dalam penanganan. ${(i.pic ?? 'PIC').split(' ')[0]} melihat alasan Anda di Detail dan bisa meminta ditutup lagi.`}
              placeholder="mis. Lampirkan berita acara yang sudah ditandatangani Polsek, bukan draf."
              onConfirm={(reason) => run(decide((s) => returnToPic(s, i.no, by, reason, demoNow())), `Insiden dikembalikan ke ${i.pic ?? 'PIC'}. Alasan Anda tampil di Detail.`)}
            />
          )}
          {dlg === 'ganti-pic' && <ReassignSheet i={i} error={error} onClose={closeDlg} onConfirm={(pic, kind, reason) => run(decide((s) => reassignPic(s, i.no, by, { pic, picKind: kind, reason, at: demoNow() })), `PIC diganti ke ${pic}. PIC lama dan baru diberi tahu.`)} />}
          {dlg === 'tenggat' && (
            <DueSheet i={i} error={error} onClose={closeDlg}
              onConfirm={(date, reason) => run(decide((s) => changeDueDate(s, i.no, by, date, reason, demoNow())), `Tenggat penanganan diubah ke ${formatDate(date)}.`)} />
          )}
          {dlg === 'buka' && (
            <ReasonSheet
              title="Buka kembali insiden?" confirm="Buka kembali" cancel="Batal" error={error} onClose={closeDlg}
              intro={`Status kembali Dalam penanganan dengan PIC ${i.pic ?? '—'}. Waktu penutupan lama tersimpan di riwayat.`}
              placeholder="mis. Kabel kembali dicuri di titik yang sama 2 Nov; penyebab belum tuntas."
              note={`PIC dan SKK Migas diberi tahu.${closedAtOf(i) ? ` Batas buka kembali: ${reopenLimitText(closedAtOf(i)!)}.` : ''}`}
              onConfirm={(reason) => {
                const r = decide((s) => reopen(s, i.no, by, reason, demoNow()));
                if (!r.ok && /lebih dari 30 hari/.test(r.reason)) return setDlg('nobuka');
                run(r, `Insiden ${i.no} dibuka kembali. Status Dalam penanganan.`);
              }}
            />
          )}
          {dlg === 'nobuka' && (
            <Sheet labelId="sh-t" onClose={closeDlg} footer={<><button type="button" className="p-btn p-btn-secondary" onClick={closeDlg}>Tutup</button><Link to="/insiden/baru/jenis" className="p-btn p-btn-primary"><Ic d={P.plus} size={16} />Buat laporan baru</Link></>}>
              <SheetTitle id="sh-t" icon={P.warn} bg="--status-info-bg" ink="--status-info-ink">Tidak bisa dibuka kembali</SheetTitle>
              <div className="in-bn err" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
                <Ic d={P.warn} size={16} />
                <div className="body">Insiden ini ditutup lebih dari 30 hari lalu. Laporkan sebagai insiden baru dan tautkan ke {i.no}.</div>
              </div>
              {closedAtOf(i) && <span className="p-cap">Ditutup {formatDate(closedAtOf(i)!)} · batas buka kembali {formatDate(reopenLimit(closedAtOf(i)!))}.</span>}
            </Sheet>
          )}
          <ToastLine toast={toast} onClose={() => setToast(null)} />
        </>
      }
    >
      <IncHead i={i} />
      <TimesSec i={i} />
      <KejadianSec i={i} partners />
      <LampiranSec i={i} />
      <PtStrip i={i} dueCls={rem ? (rem.late ? 'in-due late' : 'in-due ok') : undefined} dueText={rem?.text} />
    </MobileShell>
  );
}

/* ----------------------------- MP5: Tutup insiden ----------------------------- */

function CloseSheet({ i, error, onClose, onConfirm }: { i: Incident; error?: string; onClose: () => void; onConfirm: (input: Omit<CloseInput, 'at'>) => void }) {
  const c = i.handling?.closure;
  const fus = useFollowUps();
  const open = openFollowUps(i, fus);
  const [contracts, setContracts] = useState(c?.contracts ?? []);
  const [choice, setChoice] = useState<'lanjut' | 'batal'>('lanjut');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const due = i.handleDueAt;
  const inTime = !due || demoNow() <= due;
  const submit = () => {
    if (choice === 'batal' && open.length && !reason.trim()) return setTried(true);
    onConfirm({
      confirmedContracts: contracts.every((k) => !!k.ref), contracts, followUp: open.length ? choice : 'lanjut', cancelReason: reason,
    });
  };
  return (
    <Sheet
      labelId="sh-t" onClose={onClose}
      footer={<><button type="button" className="p-btn p-btn-primary" onClick={submit}>Tutup insiden</button><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Periksa lagi</button></>}
    >
      <SheetTitle id="sh-t" icon={P.tick} bg="--status-success-bg" ink="--status-success-ink">Tutup insiden ini?</SheetTitle>
      <dl className="kv">
        <dt>Lama penanganan</dt>
        <dd>{formatDuration(registeredAt(i), c?.requestedAt ?? demoNow())} · <b style={{ color: inTime ? 'var(--status-success-ink)' : 'var(--err-ink)' }}>{inTime ? 'Dalam tenggat' : 'Lewat tenggat'}</b></dd>
        <dt>Penyebab utama</dt><dd>{c?.cause || '—'}</dd>
        <dt>Bukti</dt><dd>{c?.evidence?.length ?? 0} file</dd>
      </dl>
      {contracts.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kontrak mitra yang terlibat<span className="p-req">*</span></span>
          {contracts.map((k, n) => (
            <span key={k.partner} className="p-input" style={{ position: 'relative' }}>
              <span style={{ flex: 1 }}>{k.partner}{k.ref ? <> · <span className="p-mono" style={{ fontSize: 12 }}>{k.ref}</span></> : ' · pilih kontrak'}</span>
              <Ic d={P.chevDown} size={16} />
              <select aria-label={`Kontrak ${k.partner}`} value={k.ref} onChange={(e) => setContracts(contracts.map((x, m) => (m === n ? { ...x, ref: e.target.value } : x)))}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }}>
                {!k.ref && <option value="">Pilih kontrak</option>}
                {(CONTRACT_OPTIONS[k.partner] ?? [k.ref]).filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </span>
          ))}
          <span className="p-help">Diisi awal dari kontrak aktif di WK ini untuk tiap mitra di Tim terlibat.</span>
        </div>
      )}
      {open.length > 0 && (
        <>
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>{open.length} tindak lanjut belum selesai<span className="p-req">*</span></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {open.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-subtle)' }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</span>
                <span className={`p-tag ${FU_TAG[f.status]}`}>{FU_LABEL[f.status]}</span>
              </div>
            ))}
          </div>
          {([['lanjut', 'Lanjutkan tindak lanjut', 'Insiden ditutup, tindak lanjut tetap berjalan.'], ['batal', 'Batalkan semua', 'Wajib beralasan.']] as const).map(([k, t, cap]) => (
            <label key={k} className="p-choice" style={{ minHeight: 44 }} onClick={() => setChoice(k)}>
              <span className={choice === k ? 'p-radio on' : 'p-radio'} role="radio" aria-checked={choice === k} aria-label={t}></span>
              <span><b>{t}</b><br /><span className="p-cap">{cap}</span></span>
            </label>
          ))}
          {choice === 'batal' && (
            <div className="p-field">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan pembatalan<span className="p-req">*</span></span>
              <textarea className={'p-input p-area' + (tried && !reason.trim() ? ' err' : '')} aria-label="Alasan pembatalan" maxLength={MAX} style={{ minHeight: 64, alignItems: 'flex-start' }}
                value={reason} onChange={(e) => setReason(e.target.value)} />
              {tried && !reason.trim() && WARN_ERR('Tulis alasan pembatalan.')}
            </div>
          )}
        </>
      )}
      {error && WARN_ERR(error)}
    </Sheet>
  );
}

/* ----------------------------- sheet alasan generik ----------------------------- */

function ReasonSheet({ title, intro, placeholder, note, confirm, cancel, error, onClose, onConfirm }: {
  title: string; intro: ReactNode; placeholder: string; note?: string; confirm: string; cancel: string; error?: string; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Sheet labelId="sh-t" onClose={onClose} footer={<><button type="button" className="p-btn p-btn-primary" onClick={submit}>{confirm}</button><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>{cancel}</button></>}>
      <b id="sh-t" style={{ fontSize: 17, lineHeight: '24px' }}>{title}</b>
      <span>{intro}</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (tried && !reason.trim() ? ' err' : '')} aria-label="Alasan" maxLength={MAX} placeholder={placeholder} style={{ minHeight: 72, alignItems: 'flex-start' }}
          value={reason} onChange={(e) => setReason(e.target.value)} />
        {tried && !reason.trim() && WARN_ERR('Tulis alasan.')}
      </div>
      {note && <span className="p-cap">{note}</span>}
      {error && WARN_ERR(error)}
    </Sheet>
  );
}

function ReassignSheet({ i, error, onClose, onConfirm }: { i: Incident; error?: string; onClose: () => void; onConfirm: (pic: string, kind: 'perorangan' | 'grup', reason: string) => void }) {
  const [pic, setPic] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const cur = i.pic;
  const opts = [...PIC_PEOPLE, ...PIC_GROUPS].filter((o) => o.name !== cur);
  const submit = () => (pic && reason.trim() ? onConfirm(pic, PIC_GROUPS.some((g) => g.name === pic) ? 'grup' : 'perorangan', reason.trim()) : setTried(true));
  const t = cur ? 'Ganti PIC' : 'Tunjuk PIC';
  return (
    <Sheet labelId="sh-t" onClose={onClose} footer={<><button type="button" className="p-btn p-btn-primary" onClick={submit}>{t}</button><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button></>}>
      <SheetTitle id="sh-t" icon={P.person} bg="--status-info-bg" ink="--status-info-ink">{t}</SheetTitle>
      <span className="p-cap">PIC saat ini: {cur ?? `Belum ada${i.handling?.picPrev ? ` · ${i.handling.picPrev} tidak aktif` : ''}`}</span>
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC baru<span className="p-req">*</span></span>
      {opts.map((o) => (
        <button key={o.name} type="button" className="jn" role="radio" aria-checked={pic === o.name} style={{ width: '100%' }} onClick={() => setPic(o.name)}>
          <span className="tx"><b>{o.name}</b><span className="p-cap">{o.caption}</span></span>
        </button>
      ))}
      {tried && !pic && WARN_ERR('Pilih PIC baru.')}
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (tried && !reason.trim() ? ' err' : '')} aria-label="Alasan" maxLength={MAX} placeholder="mis. Andi cuti 2 minggu mulai 2 Nov." style={{ minHeight: 64, alignItems: 'flex-start' }}
          value={reason} onChange={(e) => setReason(e.target.value)} />
        {tried && !reason.trim() && WARN_ERR('Tulis alasan.')}
      </div>
      <span className="p-cap">PIC lama dan baru diberi tahu. Tenggat tidak berubah.</span>
      {error && WARN_ERR(error)}
    </Sheet>
  );
}

/* ----------------------------- MP6: Ubah tenggat ----------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');

function DueSheet({ i, error, onClose, onConfirm }: { i: Incident; error?: string; onClose: () => void; onConfirm: (date: string, reason: string) => void }) {
  const base = i.handling?.dueDefaultAt ?? i.handleDueAt;
  // Bulan awal: bulan hari setelah tenggat saat ini (board: tenggat 2 Nov → November).
  const start = new Date(new Date((i.handleDueAt ?? demoNow()) + 'Z').getTime() + DAY);
  const [ym, setYm] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const err = dueErrors(date, reason, demoNow());
  const bad = !!(err.date || err.reason);
  const sev = i.severity ? SEV_LABEL[i.severity] : '—';
  const days = base ? Math.max(1, Math.round((new Date(base).getTime() - new Date(registeredAt(i)).getTime()) / DAY)) : 0;
  const first = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const count = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const step = (n: number) => setYm((v) => { const d = new Date(Date.UTC(v.y, v.m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const submit = () => (bad ? setTried(true) : onConfirm(date, reason.trim()));
  return (
    <Sheet labelId="sh-t" onClose={onClose} footer={<><button type="button" className="p-btn p-btn-primary" onClick={submit}>Simpan tenggat</button><button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button></>}>
      <SheetTitle id="sh-t" icon={P.cal} bg="--status-info-bg" ink="--status-info-ink">{date ? `Tenggat baru · ${formatDate(date)}` : 'Ubah tenggat penanganan'}</SheetTitle>
      <span className="p-cap">Bawaan: {base ? formatDate(base) : '—'} ({sev}{days ? ` · ${days} hari kerja` : ''})</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" className="ib44" aria-label="Bulan sebelumnya" onClick={() => step(-1)}><Ic d="m15 18-6-6 6-6" size={16} /></button>
        <b>{BULAN[ym.m]} {ym.y}</b>
        <button type="button" className="ib44" aria-label="Bulan berikutnya" onClick={() => step(1)}><Ic d="m9 18 6-6-6-6" size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', fontSize: 12 }}>
        {HARI.map((h) => <b key={h} className="p-cap">{h}</b>)}
        {Array.from({ length: lead }, (_, n) => <span key={`b${n}`}></span>)}
        {Array.from({ length: count }, (_, n) => {
          const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(n + 1)}`;
          const on = iso === date;
          return (
            <button key={iso} type="button" aria-pressed={on} aria-label={`${n + 1} ${BULAN[ym.m]} ${ym.y}`} onClick={() => setDate(iso)}
              style={{
                height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, border: 0, font: 'inherit', cursor: 'pointer',
                background: on ? 'var(--action)' : 'transparent', color: on ? 'var(--on-action)' : iso <= demoNow().slice(0, 10) ? 'var(--ink-subtle)' : 'var(--ink)', fontWeight: on ? 700 : undefined,
              }}>
              {n + 1}
            </button>
          );
        })}
      </div>
      {tried && err.date && WARN_ERR(err.date)}
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (tried && err.reason ? ' err' : '')} aria-label="Alasan" maxLength={MAX} style={{ minHeight: 64, alignItems: 'flex-start' }}
          placeholder="mis. Penyelidikan Polsek butuh 2 minggu." value={reason} onChange={(e) => setReason(e.target.value)} />
        {tried && err.reason && WARN_ERR(err.reason)}
      </div>
      {error && WARN_ERR(error)}
    </Sheet>
  );
}
