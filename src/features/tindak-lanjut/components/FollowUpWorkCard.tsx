// Kartu "Pengerjaan" satu kartu (artifact TLJ-01: PgKartu, T14N; dipakai T13, T13M, T13R, T13A, T14, T16, T23).
// Urutan: stepper status → Sudah mulai? (Belum dimulai) → 1 · Catatan progres → 2 · Selesaikan (atau 2 · Pengajuan selesai saat Menunggu pemeriksaan).
// Komponen tidak mengubah data sendiri: semua aksi lewat callback dari halaman Detail.
import type { ReactNode } from 'react';
import type { FollowUp } from '@/services/types';
import { formatWibFull } from '@/lib/format';
import { MAX_NOTE_TL } from '@/services/mock/workflow.followup';
import { MOD_LABEL, MOD_TAG } from '../logic/followups';

const STEPS = ['Belum dimulai', 'Dikerjakan', 'Menunggu pemeriksaan', 'Selesai'];
const P = {
  check: 'M20 6 9 17l-5-5',
  clip: 'M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5',
  up: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  list: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h15',
};
const Ic = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size, flex: 'none' }}><path d={d} /></svg>
);
const mb = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`);
const ext = (name: string) => (name.split('.').pop() ?? '').toUpperCase();

export interface WorkCardProps {
  f: FollowUp;
  /** nama pemberi tugas (juga pemeriksa) */
  giver: string;
  /** pengguna adalah PIC dan TL masih bisa dikerjakan */
  work: boolean;
  /** pengguna boleh menarik pengajuan */
  pull: boolean;
  note: string;
  onNote: (v: string) => void;
  notePhotos: number;
  onAttachPhoto: () => void;
  doneNote: string;
  onDoneNote: (v: string) => void;
  onStart: () => void;
  onAddNote: () => void;
  onPickFile: () => void;
  onRemoveFile: (name: string) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}

export function FollowUpWorkCard(p: WorkCardProps): ReactNode {
  const { f, giver, work } = p;
  const waiting = f.status === 'menunggu-verifikasi';
  const stepNo = f.status === 'belum-dimulai' ? 0 : waiting ? 2 : 1;
  const req = f.expectedEvidence ?? '';
  const hasFiles = f.evidence.length > 0;
  const returned = f.status === 'dikembalikan';
  const when = (e: { at?: string }) => formatWibFull(e.at ?? f.createdAt);

  return (
    <section className="p-card pg-card" aria-label="Pengerjaan">
      <div className="lk-card-head" style={{ margin: 0 }}><h2 className="p-h2">Pengerjaan</h2></div>
      <ol className="pg-steps" aria-label="Status tindak lanjut">
        {STEPS.map((t, n) => (
          <li key={t} className={n < stepNo ? 'done' : n === stepNo ? 'on' : undefined} aria-current={n === stepNo ? 'step' : undefined}>
            {n > 0 && <span className={'ln' + (n <= stepNo ? ' done' : '')} aria-hidden="true" />}
            <span className="n">{n < stepNo ? <Ic d={P.check} size={12} /> : n + 1}</span>{t}
          </li>
        ))}
      </ol>

      {f.status === 'belum-dimulai' && work && (
        <div className="pg-start">
          <span><b>Sudah mulai?</b> <span className="p-cap">{giver} diberi tahu bahwa pekerjaan berjalan.</span></span>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={p.onStart}>Mulai kerjakan</button>
        </div>
      )}
      {f.status === 'belum-dimulai' && !work && <span className="p-cap">PIC belum mulai. Bukti dan catatan dari PIC tampil di sini.</span>}

      <div className="pg-sec">
        <div className="pg-h">1 · Catatan progres <span className="s">{waiting ? 'hanya dibaca selama diperiksa' : 'boleh berkali-kali, boleh dengan foto · catatan pertama mengubah status jadi Dikerjakan'}</span></div>
        {work && (
          <>
            <textarea className="p-input p-area tl-field tl-area" aria-label="Catatan progres" placeholder="Mis. Sudah dikerjakan sebagian, menunggu material" maxLength={MAX_NOTE_TL} value={p.note} onChange={(e) => p.onNote(e.target.value)} style={{ minHeight: 64 }} />
            <div className="p-row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={p.onAttachPhoto}><Ic d={P.clip} size={15} />Lampirkan foto{p.notePhotos > 0 ? ` (${p.notePhotos})` : ''}</button>
              <span className="p-row" style={{ gap: 10 }}>
                <span className="p-cap">{p.note.length}/{MAX_NOTE_TL}</span>
                <button type="button" className="p-btn p-btn-secondary p-btn-sm" disabled={!p.note.trim()} aria-disabled={!p.note.trim() || undefined} onClick={p.onAddNote}>Tambah catatan</button>
              </span>
            </div>
          </>
        )}
        {f.notes.length === 0 && <p className="p-cap" style={{ margin: 0 }}>Belum ada catatan progres.</p>}
        <div>
          {f.notes.map((n) => (
            <div key={n.at + n.text} className="pg-entry">
              <span style={{ lineHeight: '20px' }}>{n.text}</span>
              {n.photos ? <div className="pg-thumbs">{Array.from({ length: n.photos }, (_, i) => <span key={i} />)}</div> : null}
              <span className="p-cap">{n.by} · {formatWibFull(n.at)}{n.photos ? ` · ${n.photos} foto progres` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {!waiting && work && (
        <div className="pg-done">
          <div className="pg-h">2 · Selesaikan <span className="s">diisi saat pekerjaan sudah beres</span></div>
          {req && (
            <div className="p-row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <Ic d={P.info} size={16} /><span><b>Bukti yang diminta {giver}:</b> {req}</span>
            </div>
          )}
          {hasFiles && (
            <div className="p-files">
              {f.evidence.map((e) => (
                <div key={e.name} className="p-file" style={{ background: 'var(--surface)' }}>
                  <span className="fi">{ext(e.name)}</span>
                  <div className="grow"><b>{e.name}</b><span className="p-cap">{mb(e.sizeKb)} · {when(e)} · belum diajukan</span></div>
                  <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label={`Hapus ${e.name}`} onClick={() => p.onRemoveFile(e.name)}><Ic d={P.trash} size={15} /></button>
                </div>
              ))}
            </div>
          )}
          {returned && <span className="p-cap">Bukti yang dikembalikan bisa dihapus atau diganti.</span>}
          <div className="pg-drop">
            <Ic d={P.up} size={18} />
            <span style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Tambah bukti</b> <span className="p-cap">· tarik file atau pilih · PDF, JPG, PNG, HEIC, DOCX, XLSX · maks. 25 MB</span></span>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={p.onPickFile}>Pilih file</button>
          </div>
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Catatan penyelesaian <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
            <textarea className="p-input p-area tl-field tl-area" aria-label="Catatan penyelesaian" placeholder="Mis. Pekerjaan selesai sesuai permintaan, cek foto terlampir" maxLength={MAX_NOTE_TL} value={p.doneNote} onChange={(e) => p.onDoneNote(e.target.value)} style={{ minHeight: 52, background: 'var(--surface)' }} />
          </div>
          <div className="p-row" style={{ justifyContent: 'space-between', gap: 12 }}>
            <span className="p-cap">{hasFiles ? `${giver} memeriksa. Bukti terkunci setelah diajukan.` : 'Lampirkan minimal satu bukti untuk mengajukan selesai.'}</span>
            <button type="button" className="p-btn p-btn-primary" disabled={!hasFiles} aria-disabled={!hasFiles || undefined} onClick={p.onSubmit}>Ajukan selesai</button>
          </div>
        </div>
      )}

      {waiting && (
        <div className="pg-sub">
          <div className="pg-sub-hd"><div className="pg-h">2 · Pengajuan selesai</div><span className={`p-tag ${MOD_TAG[f.status]}`}>{MOD_LABEL[f.status]}</span></div>
          <span className="pg-sub-meta">Diajukan {f.pic} · {f.submittedAt ? formatWibFull(f.submittedAt) : ''} · diperiksa {giver}</span>
          {req && (
            <div className="pg-req">
              <Ic d={P.list} size={16} />
              <div><span className="k">Bukti yang diminta {giver}</span><span style={{ lineHeight: '20px' }}>{req}</span></div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="pg-filehd"><b>Bukti · {f.evidence.length} file</b><span className="pg-lock"><Ic d={P.lock} size={13} />Terkunci selama diperiksa</span></div>
            <div className="p-files">
              {f.evidence.map((e) => (
                <div key={e.name} className="p-file" style={{ background: 'var(--surface)' }}>
                  <span className="fi">{ext(e.name)}</span>
                  <div className="grow"><b>{e.name}</b><span className="p-cap">{mb(e.sizeKb)} · diunggah {when(e)}</span></div>
                  <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label={`Pratinjau ${e.name}`}><Ic d={P.eye} size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          {f.completionNote && <div className="pg-quote"><span className="k">Catatan penyelesaian</span><p>{f.completionNote}</p></div>}
          {p.pull && (
            <div className="pg-sub-ft">
              <span className="p-cap">Perlu mengubah bukti? Tarik pengajuan selama belum diperiksa.</span>
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={p.onWithdraw}>Tarik pengajuan</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
