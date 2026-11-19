// Detail Tindak lanjut (artifact TLJ-01: T13..T18, T23, T24, T30, T31, T27*; dialog T15, T17K, T25). Rute /tindak-lanjut/:no.
// Tampilan mengikuti status dan peran: PIC mengerjakan, pemberi tugas memeriksa dan mengelola, SKK hanya membaca yang final.
// `?aksi=setujui|kembalikan` membuka dialog (dipakai menu Pindahkan di Papan).
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS, isSkk, titleOf } from '@/lib/rbac';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { formatDate, formatWibFull } from '@/lib/format';
import { STATUS_LABEL, STATUS_TAG, type FollowUp, type Incident } from '@/services/types';
import {
  addEvidence, addFollowUpNote, removeEvidence, approveDone, cancelFollowUp, changeFollowUpDue, isOnTime, MAX_NOTE_TL, MIN_RETURN_REASON, reassignFollowUp,
  returnFollowUp, startFollowUp, submitDone, TL_NOW, verifierOf, withdrawSubmission,
} from '@/services/mock/workflow.followup';
import { closedAtOf } from '@/services/mock/workflow.closure';
import { Modal } from '@/features/insiden/components/review/ReviewDialogs';
import { Ic } from '@/features/insiden/components/review/parts';
import type { ToastMsg } from '@/features/insiden/components/detail/DetailShell';
import { initialsOf } from '@/features/insiden/logic/handling';
import { TlShell } from '../components/TlShell';
import { FollowUpWorkCard } from '../components/FollowUpWorkCard';
import { SourceCell } from './TindakLanjutListPage';
import { MOD_LABEL, MOD_TAG, canTarik, canWork, daysLeft, dueSub, isFinal, isLate, sourceId, sourceKindOf } from '../logic/followups';
import { useFollowUps } from '../logic/useFollowUps';

const D = {
  check: 'M20 6 9 17l-5-5',
  undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  close: 'M18 6 6 18M6 6l12 12',
  img: 'M21 15l-5-5L5 21M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  up: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
};
const PIC_CHOICES = ['Rudi Hartono', 'Dedi Kurniawan', 'Joko Susilo', 'Andi Pratama'];

const srcTag = (i: Incident) => (i.status === 'ditutup' || i.status === 'digabung' || i.status === 'dibatalkan' ? 't-muted' : STATUS_TAG[i.status]);
const Av = ({ name }: { name: string }) => <span className="in-av" style={{ width: 20, height: 20, fontSize: 9 }}>{initialsOf(name)}</span>;
const Btn = ({ children, onClick, kind = 'secondary', disabled }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary'; disabled?: boolean }) => (
  <button type="button" className={`p-btn p-btn-${kind}`} onClick={onClick} aria-disabled={disabled || undefined} style={disabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}>{children}</button>
);

function Files({ f, label }: { f: FollowUp; label: string }) {
  if (f.evidence.length === 0) return null;
  return (
    <>
      <span className="p-lbl">{f.evidence.length} bukti</span>
      <div className="tl-files">
        {f.evidence.map((e) => (
          <div key={e.name} className="tl-file"><Ic d={D.img} size={16} /><span className="n">{e.name}</span><span className="s">{label}</span></div>
        ))}
      </div>
    </>
  );
}

function Notes({ f }: { f: FollowUp }) {
  return (
    <>
      <span className="p-lbl">Catatan progres</span>
      {f.notes.length === 0 ? (
        <span className="p-cap">Belum ada catatan progres.</span>
      ) : (
        <ol className="p-tl in-kr" aria-label="Catatan progres">
          {f.notes.map((n) => (
            <li key={n.at + n.text}>
              <span className="nd" aria-hidden="true"></span>
              {n.photos ? <span className="tl-thumb" aria-hidden="true"><Ic d={D.img} size={16} /></span> : null}
              <div><div className="body">{n.text}</div><div className="tm">{n.by} · {formatWibFull(n.at)}{n.photos ? ` · ${n.photos} foto progres` : ''}</div></div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

type Dlg = 'ajukan' | 'setujui' | 'kembalikan' | 'tenggat' | 'pic' | 'batal' | null;

export function TindakLanjutDetailPage() {
  const { no = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const role = useDemoStore((s) => s.role);
  const incidents = useDemoStore((s) => s.incidents);
  const decide = useDemoStore((s) => s.decide);
  const f = useFollowUps().find((x) => x.no === no);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [hideBanner, setHideBanner] = useState(false);
  const [note, setNote] = useState('');
  const [doneNote, setDoneNote] = useState('');
  const [notePhotos, setNotePhotos] = useState(0);
  const [reason, setReason] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newPic, setNewPic] = useState('');
  const [tried, setTried] = useState(false);
  const aksi = params.get('aksi');

  useEffect(() => {
    if (aksi === 'setujui' || aksi === 'kembalikan' || aksi === 'ajukan') {
      setDlg(aksi);
      setParams({}, { replace: true });
    }
  }, [aksi, setParams]);

  if (!f) {
    return (
      <TlShell title="Detail tindak lanjut">
        <section className="p-card"><div className="lk-es es"><b>Anda tidak punya akses ke tindak lanjut ini</b><span className="p-cap">Tindak lanjut hanya bisa dibuka pengguna yang cakupannya mencakup lokasi sumbernya. Hubungi Admin KKKS bila Anda perlu akses.</span><Link to="/tindak-lanjut" className="p-btn p-btn-secondary p-btn-sm">Kembali ke Tindak lanjut</Link></div></section>
      </TlShell>
    );
  }
  const skk = isSkk(role);
  if (skk && !isFinal(f)) {
    return (
      <TlShell title="Detail tindak lanjut">
        <section className="p-card"><div className="lk-es es"><b>Tindak lanjut ini belum tersedia</b><span className="p-cap">Tindak lanjut tampil setelah selesai diperiksa atau dibatalkan.</span><Link to="/tindak-lanjut" className="p-btn p-btn-secondary p-btn-sm">Kembali ke Tindak lanjut</Link></div></section>
      </TlShell>
    );
  }

  const me = DEMO_USERS[role].name;
  const inc = incidents.find((i) => i.no === f.incidentNo);
  const giver = verifierOf(f, inc);
  const work = canWork(f, role);
  const pull = canTarik(f, role);
  const isGiver = !skk && giver === me;
  const verify = isGiver && f.status === 'menunggu-verifikasi';
  const manage = isGiver && !isFinal(f);
  const kind = sourceKindOf(f);
  const reasonErr = reason.trim().length < MIN_RETURN_REASON ? 'Tulis alasan minimal 10 karakter.' : '';
  const late = isLate(f);
  const lateDays = late ? -daysLeft(f) : 0;
  const sub = dueSub(f);
  const finalDate = f.finishedAt ?? f.submittedAt;
  const onTime = isOnTime(f);
  const closedSrc = inc?.status === 'ditutup' && !isFinal(f);

  const run = (r: { ok: true } | { ok: false; reason: string }, text: string) => {
    if (r.ok) {
      setToast({ text });
      setDlg(null);
      setTried(false);
      return true;
    }
    setToast({ text: r.reason, tone: 'err' });
    return false;
  };
  const doStart = () => run(decide((s) => startFollowUp(s, f.no, me, TL_NOW)), 'Status jadi Dikerjakan');
  const doAjukan = () => {
    if (f.evidence.length === 0) { setToast({ text: 'Lampirkan bukti penyelesaian sebelum mengajukan selesai.', tone: 'err' }); setDlg(null); return; }
    if (run(decide((s) => submitDone(s, f.no, me, doneNote, TL_NOW)), 'Tindak lanjut diajukan untuk diperiksa')) setDoneNote('');
  };
  const doTarik = () => run(decide((s) => withdrawSubmission(s, f.no, me, TL_NOW)), 'Pengajuan ditarik');
  const doSetujui = () => run(decide((s) => approveDone(s, f.no, me, TL_NOW)), `Tindak lanjut ${f.no} selesai`);
  const doKembalikan = () => {
    setTried(true);
    if (reasonErr) return;
    if (run(decide((s) => returnFollowUp(s, f.no, me, reason, TL_NOW)), `Tindak lanjut dikembalikan ke ${f.pic}`)) setReason('');
  };
  const doNote = () => { if (run(decide((s) => addFollowUpNote(s, f.no, me, note, TL_NOW, notePhotos)), 'Catatan ditambahkan')) { setNote(''); setNotePhotos(0); } };
  const doRemove = (name: string) => { run(decide((s) => removeEvidence(s, f.no, me, name)), 'Bukti dihapus'); };
  const doFile = () => {
    const n = f.evidence.length + 1;
    run(decide((s) => addEvidence(s, f.no, me, { name: `bukti-${f.no.slice(-4)}-${n}.jpg`, sizeKb: 2048 })), 'Bukti ditambahkan');
  };
  const doTenggat = () => {
    setTried(true);
    if (!newDue || reasonErr) return;
    if (run(decide((s) => changeFollowUpDue(s, f.no, me, newDue, reason, TL_NOW)), `Tenggat diubah menjadi ${formatDate(newDue)}`)) { setReason(''); setNewDue(''); }
  };
  const doPic = () => {
    setTried(true);
    if (!newPic || reasonErr) return;
    if (run(decide((s) => reassignFollowUp(s, f.no, me, newPic, reason, TL_NOW)), `PIC diganti ke ${newPic}`)) { setReason(''); setNewPic(''); }
  };
  const doBatal = () => {
    setTried(true);
    if (reasonErr) return;
    if (run(decide((s) => cancelFollowUp(s, f.no, me, reason, TL_NOW)), `Tindak lanjut ${f.no} dibatalkan`)) setReason('');
  };

  const closeDlg = () => { setDlg(null); setTried(false); setReason(''); };
  const ReasonField = () => (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
      <textarea className={'p-input p-area tl-field tl-area' + (tried && reasonErr ? ' err' : '')} aria-label="Alasan" aria-invalid={tried && !!reasonErr} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 88 }} />
      <span className="p-help row"><span>{tried && reasonErr ? reasonErr : 'Wajib, minimal 10 karakter.'}</span><span>{reason.length}/500</span></span>
    </div>
  );
  const footer = (label: string, onOk: () => void, kind: 'primary' | 'secondary' = 'primary') => (
    <><Btn onClick={closeDlg}>Batal</Btn><Btn kind={kind} onClick={onOk}>{label}</Btn></>
  );

  const tags = (
    <>
      <span className={`p-tag ${MOD_TAG[f.status]}`}>{MOD_LABEL[f.status]}</span>
      {late && <span className="p-tag t-caution">Terlambat {lateDays} hari</span>}
    </>
  );
  const acts = work ? (
    f.status === 'belum-dimulai' ? null : <Btn kind="primary" onClick={() => (f.evidence.length ? setDlg('ajukan') : setToast({ text: 'Lampirkan minimal satu bukti untuk mengajukan selesai.', tone: 'err' }))}><Ic d={D.check} size={16} />Ajukan selesai</Btn>
  ) : null;

  return (
    <TlShell
      title="Detail tindak lanjut" tags={tags} crumbNo={f.no} acts={acts} toast={toast} onToastClose={() => setToast(null)}
      overlay={
        <>
          {dlg === 'ajukan' && (
            <Modal title="Ajukan selesai?" width={520} onClose={closeDlg} footer={footer('Ajukan selesai', doAjukan)}>
              <span>Bukti dikunci dan {giver} akan memeriksa.</span>
              <dl className="tl-kv">
                <dt>Bukti</dt><dd>{f.evidence.length} file</dd>
                <dt>Diajukan</dt><dd>{formatDate(TL_NOW)}</dd>
                <dt>Tenggat</dt><dd>{formatDate(f.dueAt)}</dd>
              </dl>
              {doneNote.trim() && (<><span className="p-lbl">Catatan penyelesaian</span><div className="tl-quote">{doneNote.trim()}</div></>)}
            </Modal>
          )}
          {dlg === 'setujui' && (
            <Modal title="Setujui penyelesaian?" width={480} onClose={closeDlg} footer={footer('Setujui', doSetujui)}>
              <span>Tindak lanjut menjadi Selesai dan bukti menjadi resmi. Status ini tidak bisa dibuka kembali.</span>
            </Modal>
          )}
          {dlg === 'kembalikan' && (
            <Modal title="Kembalikan ke PIC" width={480} onClose={closeDlg} footer={footer('Kembalikan', doKembalikan)}>
              <span>{f.pic} menerima alasan Anda, lalu bisa mengganti bukti dan mengajukan selesai lagi. Hitungan terlambat berjalan lagi sejak dikembalikan.</span>
              <ReasonField />
            </Modal>
          )}
          {dlg === 'tenggat' && (
            <Modal title="Ubah tenggat" width={480} onClose={closeDlg} footer={footer('Ubah tenggat', doTenggat)}>
              <span>Tenggat awal {formatDate(f.dueAtOriginal ?? f.dueAt)} tetap tercatat.</span>
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tenggat baru<span className="p-req">*</span></span>
                <input type="date" className="p-input" aria-label="Tenggat baru" value={newDue} onChange={(e) => setNewDue(e.target.value)} min={TL_NOW.slice(0, 10)} />
                {tried && !newDue && <span className="p-help err" role="alert">Pilih tanggal tenggat baru.</span>}
              </div>
              <ReasonField />
            </Modal>
          )}
          {dlg === 'pic' && (
            <Modal title="Ganti PIC" width={480} onClose={closeDlg} footer={footer('Ganti PIC', doPic)}>
              <span>PIC lama dan PIC baru diberi tahu.</span>
              <div className="p-field">
                <span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC baru<span className="p-req">*</span></span>
                <select className="p-input" aria-label="PIC baru" value={newPic} onChange={(e) => setNewPic(e.target.value)}>
                  <option value="">Pilih PIC</option>
                  {PIC_CHOICES.filter((p) => p !== f.pic).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {tried && !newPic && <span className="p-help err" role="alert">Pilih PIC tindak lanjut.</span>}
              </div>
              <ReasonField />
            </Modal>
          )}
          {dlg === 'batal' && (
            <Modal title="Batalkan tindak lanjut?" width={480} onClose={closeDlg} footer={footer('Batalkan tindak lanjut', doBatal)}>
              <span>Tindak lanjut {f.no} tidak berlaku lagi dan PIC diberi tahu. Data tidak dihapus.</span>
              <ReasonField />
            </Modal>
          )}
        </>
      }
    >
      <div className="lk-grid">
        <div className="c8 lk-stack">
          {closedSrc && (
            <div className="in-bn info">
              <Ic d={D.info} size={18} />
              <div className="body">Insiden sumber sudah ditutup{closedAtOf(inc!) ? ` ${formatDate(closedAtOf(inc!)!)}` : ''}. Tindak lanjut ini tetap berjalan sampai diperiksa PIC insiden.</div>
            </div>
          )}
          {f.status === 'dikembalikan' && f.returnReason && !hideBanner && (
            <div className="in-bn caution">
              <Ic d={D.undo} size={18} />
              <div className="body"><b>Dikembalikan oleh {f.returnedBy} · {f.returnedAt ? formatWibFull(f.returnedAt) : ''}</b><br />{f.returnReason}</div>
              <button type="button" className="p-ibtn ghost" style={{ width: 24, height: 24 }} aria-label="Tutup pesan" onClick={() => setHideBanner(true)}><Ic d={D.close} size={14} /></button>
            </div>
          )}

          <section className="p-card in-sec">
            <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{f.no}</span>
            <h2 className="in-h" style={{ fontSize: 22, lineHeight: '30px' }}>{f.action}</h2>
            <span className="p-cap">
              {f.status === 'selesai' ? `Selesai ${finalDate ? formatDate(finalDate) : ''} · tenggat ${formatDate(f.dueAt)}`
                : f.status === 'dibatalkan' ? `Dibatalkan ${f.cancelledBy}, ${f.cancelledAt ? formatDate(f.cancelledAt) : ''} · tidak dihitung terlambat`
                : f.status === 'menunggu-verifikasi' ? `Diajukan ${f.submittedAt ? formatDate(f.submittedAt) : ''} · tenggat ${formatDate(f.dueAt)}`
                : `Tenggat ${formatDate(f.dueAt)}${sub && !sub.late && sub.text.startsWith('H-') ? ` · ${sub.text}` : ''}`}
              {' · dari '}{kind === 'arahan' ? `Arahan SKK ${f.arahan ? formatDate(f.arahan.date) : ''}` : kind === 'kerawanan' ? `Kerawanan ${f.krwNo}` : `Insiden ${f.incidentNo}`}
            </span>
            <div className="lk-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="p-tag t-neutral">{kind === 'arahan' ? `Arahan SKK${f.arahan ? ` · ${f.arahan.channel} ${formatDate(f.arahan.date)}` : ''}` : `${kind === 'kerawanan' ? 'Kerawanan' : 'Insiden'} ${sourceId(f)}`}</span>
              <span className="p-tag t-neutral">PIC: {f.pic}</span>
              <span className="p-tag t-neutral">Tenggat {formatDate(f.dueAt)}{sub?.text.startsWith('H-') ? ` · ${sub.text}` : ''}</span>
            </div>
          </section>

          {verify && (
            <section className="p-card in-sec lk-warn-card" aria-label="Periksa hasil tindak lanjut">
              <h2 className="in-h">Periksa hasil tindak lanjut</h2>
              <dl className="tl-kv">
                <dt>Peran Anda</dt><dd>Pemberi tugas{inc ? ` · PIC insiden ${inc.no}` : ''}</dd>
                <dt>Diajukan</dt><dd>{f.pic} · {f.submittedAt ? formatWibFull(f.submittedAt) : ''}</dd>
                <dt>Tenggat</dt><dd>{formatDate(f.dueAt)} · {onTime ? 'diajukan tepat waktu' : 'diajukan terlambat'}</dd>
                {f.expectedEvidence && <><dt>Bukti selesai</dt><dd>{f.expectedEvidence}</dd></>}
                {f.completionNote && <><dt>Catatan penyelesaian</dt><dd>{f.completionNote}</dd></>}
              </dl>
              <Files f={f} label="Terkunci" />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => setDlg('kembalikan')}><Ic d={D.undo} size={16} />Kembalikan</Btn>
                <Btn kind="primary" onClick={() => setDlg('setujui')}><Ic d={D.check} size={16} />Setujui selesai</Btn>
              </div>
              <span className="p-cap">Keputusan dicatat di jejak audit atas nama Anda.</span>
            </section>
          )}

          {!isFinal(f) && (
            <FollowUpWorkCard
              f={f} giver={giver} work={work} pull={pull}
              note={note} onNote={setNote} notePhotos={notePhotos} onAttachPhoto={() => setNotePhotos(notePhotos + 1)}
              doneNote={doneNote} onDoneNote={setDoneNote}
              onStart={doStart} onAddNote={doNote} onPickFile={doFile} onRemoveFile={doRemove} onSubmit={() => setDlg('ajukan')} onWithdraw={doTarik}
            />
          )}

          {f.status === 'selesai' && (
            <section className="p-card in-sec tl-verif">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h2 className="in-h" style={{ flex: 1 }}>Hasil</h2><span className="p-tag t-ok">Selesai</span></div>
              <span className="p-cap">Diperiksa oleh {f.verifiedBy} · {f.verifiedAt ? formatWibFull(f.verifiedAt) : ''}</span>
              <Files f={f} label="Resmi" />
              {f.completionNote && (<><span className="p-lbl">Catatan penyelesaian</span><div className="tl-quote">{f.completionNote}</div></>)}
            </section>
          )}
          {f.status === 'dibatalkan' && (
            <section className="p-card in-sec">
              <h2 className="in-h">Pembatalan</h2>
              <dl className="tl-kv"><dt>Alasan pembatalan</dt><dd>{f.cancelReason}</dd><dt>Dibatalkan oleh</dt><dd>{f.cancelledBy} · {f.cancelledAt ? formatWibFull(f.cancelledAt) : ''}</dd></dl>
              {f.evidence.length === 0 && <span className="p-cap">Tidak ada bukti yang diunggah sebelum dibatalkan.</span>}
              <Files f={f} label="Terkunci" />
            </section>
          )}

          {manage && !verify && (
            <section className="p-card in-sec" aria-label="Aksi pemberi tugas">
              <h2 className="in-h">Aksi pemberi tugas</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn onClick={() => setDlg('tenggat')}>Ubah tenggat</Btn>
                {f.status !== 'menunggu-verifikasi' && <Btn onClick={() => setDlg('pic')}>Ganti PIC</Btn>}
                <Btn onClick={() => setDlg('batal')}>Batalkan</Btn>
              </div>
              <span className="p-cap">Pemberi tugas dan PIC diberi tahu setiap perubahan.</span>
            </section>
          )}

          {!skk && isFinal(f) && (
            <section className="p-card in-sec">
              <h2 className="in-h">Catatan progres</h2>
              {work && !isFinal(f) && (
                <>
                  <textarea className="p-input p-area tl-field tl-area" aria-label="Catatan progres" placeholder="Mis. Menunggu suku cadang dari vendor, estimasi 30 Okt" maxLength={MAX_NOTE_TL} value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 72 }} />
                  <span className="p-help row"><span></span><span>{note.length}/{MAX_NOTE_TL}</span></span>
                  <div style={{ textAlign: 'right' }}><Btn onClick={doNote} disabled={!note.trim()}>Tambah catatan</Btn></div>
                </>
              )}
              {f.status === 'dibatalkan' && <span className="p-cap">Tindak lanjut yang dibatalkan tidak bisa diberi catatan atau bukti baru.</span>}
              <Notes f={f} />
            </section>
          )}
        </div>

        <aside className="c4 lk-stack">
          <section className="p-card in-sec tl-src-card" aria-label="Sumber">
            <div className="lk-card-head" style={{ marginBottom: 0 }}>
              <h2 className="in-h">Sumber</h2>
              {kind === 'insiden' && !skk && <Link to={`/insiden/${f.incidentNo}`} className="lk-alink">Buka insiden</Link>}
              {kind === 'kerawanan' && !skk && <Link to={`/kerawanan/${f.krwNo}`} className="lk-alink">Buka kerawanan</Link>}
            </div>
            {kind === 'arahan' && f.arahan ? (
              <>
                <span className="p-cap">Arahan SKK · di luar PERISAI</span>
                <b>{f.arahan.title}</b>
                <dl className="tl-kv">
                  <dt>Tanggal arahan</dt><dd>{formatDate(f.arahan.date)}</dd>
                  <dt>Cara penyampaian</dt><dd>{f.arahan.channel}</dd>
                  <dt>Pemberi arahan</dt><dd>{f.arahan.giver}</dd>
                  {f.arahan.doc && <><dt>Dokumen</dt><dd><span className="lk-alink">{f.arahan.doc}</span></dd></>}
                </dl>
              </>
            ) : kind === 'kerawanan' ? (
              <>
                <span className="p-cap">Kerawanan · <span className="p-mono">{f.krwNo}</span></span>
                <b><SourceCell f={f} /></b>
              </>
            ) : (
              <>
                <div className="r">
                  <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{f.incidentNo}</span>
                  {inc?.severity && <span className={`p-tag ${SEV_TAG_CLS[inc.severity]}`} style={{ height: 20, fontSize: 11 }}><span className="dot"></span>{SEV_LABEL[inc.severity]}</span>}
                  {inc && <span className={`p-tag ${srcTag(inc)}`} style={{ height: 20, fontSize: 11 }}>{STATUS_LABEL[inc.status]}</span>}
                </div>
                {inc && <Link to={`/insiden/${inc.no}`} className="tl-link">{inc.title}</Link>}
                {inc && (
                  <dl className="tl-kv">
                    <dt>PIC insiden</dt><dd style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{inc.pic ? <><Av name={inc.pic} />{inc.pic}</> : '-'}</dd>
                    <dt>Lokasi</dt><dd>{inc.location.split(' · ')[0]} · {inc.wk}</dd>
                  </dl>
                )}
              </>
            )}
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Rincian</h2>
            <dl className="tl-kv">
              <dt>Dikerjakan oleh</dt><dd style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Av name={f.pic} />{f.pic}</dd>
              <dt>Pemberi tugas</dt><dd>{giver}{titleOf(giver) ? ` (${titleOf(giver)})` : ''}<div className="p-cap">{f.createdBy === f.pic ? <><span className="p-tag t-neutral">Diperiksa sendiri</span> tanpa pemeriksaan kedua</> : 'juga pemeriksa'}</div></dd>
              <dt>Tenggat</dt>
              <dd>
                <b>{formatDate(f.dueAt)}</b>
                {f.dueAtOriginal && <div className="p-cap">Tenggat awal {formatDate(f.dueAtOriginal)}</div>}
                {f.status === 'dibatalkan' && <div className="p-cap">Tidak dihitung terlambat karena dibatalkan</div>}
              </dd>
              {f.status === 'selesai' && <><dt>Tanggal selesai</dt><dd>{finalDate ? formatDate(finalDate) : '-'} · {onTime ? 'tepat waktu' : 'terlambat'}<div className="p-cap">Tanggal selesai dihitung dari saat PIC mengajukan selesai.</div></dd></>}
              {f.status === 'menunggu-verifikasi' && <><dt>Diajukan</dt><dd>{f.submittedAt ? formatWibFull(f.submittedAt) : ''}</dd></>}
              {f.status === 'dikembalikan' && <dd className="p-note" style={{ gridColumn: '1 / -1' }}>Karena dikembalikan, keterlambatan dihitung lagi sampai PIC mengajukan ulang.</dd>}
            </dl>
          </section>

          <section className="p-card in-sec">
            <h2 className="in-h">Riwayat</h2>
            <ol className="p-tl" aria-label="Riwayat tindak lanjut">
              {[...f.history].reverse().map((h, i) => (
                <li key={h.at + h.text}>
                  <span className={'nd' + (i === 0 ? ' now' : '')} aria-hidden="true"></span>
                  <div><div className="hd"><b>{h.text}</b></div><div className="dt p-cap">oleh {h.by}</div><div className="tm">{formatWibFull(h.at)}</div></div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </TlShell>
  );
}
