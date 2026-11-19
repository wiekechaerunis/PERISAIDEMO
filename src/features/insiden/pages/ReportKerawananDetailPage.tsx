// Board: S16b (Detail kerawanan, langkah 2 "Detail & lampiran"). Kerawanan langsung tercatat tanpa pemeriksaan.
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { DEMO_USERS } from '@/lib/rbac';
import { ORG } from '@/services/mock/seed';
import { useDemoStore } from '@/services/mock/store';
import { ReportFormShell } from '../components/ReportFormShell';
import { extLabel, formatSize, useAttachmentUpload } from '../logic/attachments';
import { useDraftStore } from '../logic/draft';
import { stepsOf, STEP_ROUTES } from '../logic/steps';
import { buildKerawanan, nextNumber } from '../logic/submit';

type Kind = 'kon' | 'tdk' | 'ggl';
const KINDS: [Kind, string, string][] = [
  ['kon', 'Kondisi rawan', 'Celah atau situasi yang bisa dimanfaatkan, mis. pagar roboh, lampu padam.'],
  ['tdk', 'Kejadian tanpa dampak', 'Sudah terjadi tetapi tanpa kerugian, korban, atau gangguan operasi.'],
  ['ggl', 'Upaya digagalkan', 'Aksi dihentikan petugas sebelum menimbulkan kerugian.'],
];
const ACH: [string, string][] = [['g', 'Aksi digagalkan'], ['t', 'Pelaku tertangkap']];
// ASSUMPTION: daftar sumber informasi belum ada di board selain "Patroli".
const SOURCES = ['Patroli', 'Laporan pekerja', 'Pantauan CCTV', 'Laporan warga'];
const MAX_LEN = 2000;

export function ReportKerawananDetailPage() {
  const navigate = useNavigate();
  const draft = useDraftStore((s) => s.draft);
  const patch = useDraftStore((s) => s.patch);
  const resetDraft = useDraftStore((s) => s.resetDraft);
  const kerawanan = useDemoStore((s) => s.kerawanan);
  const role = useDemoStore((s) => s.role);
  const addKerawanan = useDemoStore((s) => s.addKerawanan);
  const { attachments, rejected, add, remove, removeRejected } = useAttachmentUpload({ maxFiles: 10, maxMb: 10 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tried, setTried] = useState(false);
  const [source, setSource] = useState(SOURCES[0]);
  const [ach, setAch] = useState<Record<string, boolean>>({ g: true });

  const kind: Kind = KINDS.some((k) => k[0] === draft.jenis) ? (draft.jenis as Kind) : 'kon';
  const penjelasan = draft.securityImpact;
  const nomor = nextNumber('KRW-SEN', kerawanan.map((k) => k.no));
  const achNone = kind === 'ggl' && !ach.g && !ach.t;
  const penjelasanErr = tried && !penjelasan.trim();
  const temuanErr = tried && !draft.title.trim();
  const invalid = !penjelasan.trim() || achNone || !draft.title.trim();

  const submit = () => {
    if (invalid) {
      setTried(true);
      return;
    }
    const no = nextNumber('KRW-SEN', useDemoStore.getState().kerawanan.map((k) => k.no));
    addKerawanan(buildKerawanan(draft, no, DEMO_USERS[role].name, ORG));
    navigate('/insiden?tab=kerawanan', { state: { toast: `Kerawanan tercatat sebagai ${no}.` } });
    resetDraft();
  };
  const pick = () => inputRef.current?.click();

  const main = (
    <>
      {temuanErr && (
        <div className="in-bn err" role="alert">
          <Icon name="warn" size={18} />
          <div className="body">
            <b>Temuan belum lengkap.</b> Judul belum diisi. <Link to={STEP_ROUTES.temuan} className="lk-alink">Isi di Temuan</Link>
          </div>
        </div>
      )}
      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}>
          <h2 className="p-h2">Detail kerawanan</h2>
          <span className="usl">Usulan</span>
        </div>
        <div className="lk-f2">
          <div className="p-field lk-span2">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis kerawanan<span className="p-req">*</span></span>
            <div role="radiogroup" aria-label="Jenis kerawanan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {KINDS.map(([k, label, desc]) => (
                <button key={k} type="button" role="radio" className="jn" aria-checked={kind === k} onClick={() => patch({ jenis: k })}>
                  <span className={'p-radio' + (kind === k ? ' on' : '')} style={{ marginTop: 2 }}></span>
                  <span className="tx"><b>{label}</b><span className="p-cap">{desc}</span></span>
                </button>
              ))}
            </div>
          </div>
          {kind === 'ggl' && (
            <div className="p-field lk-span2">
              <span className="p-lbl" style={{ color: 'var(--ink)' }}>Hasil pengamanan<span className="p-req">*</span></span>
              <div style={{ display: 'flex', gap: 20 }}>
                {ACH.map(([k, l]) => {
                  const on = !!ach[k];
                  const toggle = () => setAch((a) => ({ ...a, [k]: !on }));
                  return (
                    <label
                      key={k}
                      className="p-choice"
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault();
                        toggle();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggle();
                        }
                      }}
                    >
                      <span className={'p-check' + (on ? ' on' : '') + (achNone && tried ? ' err' : '')}>
                        <Icon name="check" size={12} style={{ display: on ? 'block' : 'none' }} />
                      </span>
                      <span>{l}</span>
                    </label>
                  );
                })}
              </div>
              <span className="p-help row">
                <span>Aturan apakah upaya yang digagalkan dicatat sebagai kerawanan atau insiden masih menunggu keputusan.</span>
                <span></span>
              </span>
            </div>
          )}
          <div className="p-field lk-span2">
            <label className="p-lbl" htmlFor="krw-penjelasan" style={{ color: 'var(--ink)' }}>Kondisi yang ditemukan<span className="p-req">*</span></label>
            <div className={'p-input' + (penjelasanErr ? ' err' : '')} style={{ height: 'auto', minHeight: 96, alignItems: 'flex-start', paddingTop: 10 }}>
              <textarea
                id="krw-penjelasan"
                className="rb-in"
                rows={4}
                maxLength={MAX_LEN}
                value={penjelasan}
                aria-invalid={penjelasanErr}
                onChange={(e) => patch({ securityImpact: e.target.value })}
              />
            </div>
            {penjelasanErr ? (
              <span className="p-help err" role="alert"><Icon name="warn" size={14} />Isi kondisi yang ditemukan.</span>
            ) : (
              <span className="p-help row">
                <span>Apa yang terlihat dan kenapa berpotensi jadi insiden.</span>
                <span>{penjelasan.length}/{MAX_LEN}</span>
              </span>
            )}
          </div>
          <div className="p-field lk-span2">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Foto atau dokumen</span>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="rb-hide"
              aria-label="Pilih file lampiran"
              data-testid="file-input"
              onChange={(e) => {
                add(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              className={'p-drop' + (over ? ' over' : '')}
              role="button"
              tabIndex={0}
              onClick={pick}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick()}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                add(e.dataTransfer.files);
              }}
            >
              <span className="di"><Icon name="upload" size={22} /></span>
              <span>Seret file ke sini atau <b>pilih file</b></span>
            </div>
            <span className="p-help row">
              <span>Opsional. JPG, PNG, atau PDF, maks. 10 MB per file.</span>
              <span></span>
            </span>
            {(attachments.length > 0 || rejected.length > 0) && (
              <div className="p-files">
                {attachments.map((a) => (
                  <div className="p-file" key={a.id}>
                    <span className="fi">{extLabel(a.name)}</span>
                    <div className="grow">
                      <b>{a.name}</b>
                      <span className="p-cap">{formatSize(a.sizeKb)} · Terunggah</span>
                    </div>
                    <button type="button" className="p-ibtn ghost" style={{ width: 36, height: 36 }} aria-label="Hapus file" onClick={() => remove(a.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
                {rejected.map((r) => (
                  <div className="p-file" style={{ alignItems: 'flex-start', boxShadow: 'inset 3px 0 0 var(--error-ink)' }} key={r.id}>
                    <span className="fi">{extLabel(r.name)}</span>
                    <div className="grow" style={{ gap: 4 }}>
                      <b>{r.name}</b>
                      <span className="p-help err" style={{ color: 'var(--error-ink)', fontSize: 12 }} role="alert">
                        <Icon name="warn" size={14} />{r.reason}
                      </span>
                    </div>
                    <button type="button" className="p-ibtn ghost" style={{ width: 36, height: 36 }} aria-label="Hapus file" onClick={() => removeRejected(r.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-field">
            <label className="p-lbl" htmlFor="krw-sumber" style={{ color: 'var(--ink)' }}>Sumber informasi<span className="p-req">*</span></label>
            <div className="p-input">
              <select id="krw-sumber" className="rb-in" value={source} onChange={(e) => setSource(e.target.value)}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="chevDown" size={16} />
            </div>
          </div>
          <div></div>
        </div>
      </section>
    </>
  );

  const aside = (
    <>
      <section className="p-card">
        <div className="lk-card-head" style={{ marginBottom: 12 }}><h2 className="p-h2">Pengajuan</h2></div>
        <dl className="lk-kv1">
          <dt>Nomor laporan</dt><dd><span className="p-mono" style={{ fontSize: 12 }}>{nomor}</span></dd>
          <dt>Status</dt><dd><span className="p-tag t-draft">Draf</span></dd>
          <dt>Tercatat di</dt><dd>Insiden › tab Kerawanan</dd>
          <dt>Pemeriksaan</dt><dd>Tidak perlu, langsung tercatat</dd>
        </dl>
      </section>
      {saved && (
        <div className="in-toastpos rb-toast">
          <div className="p-toast" role="status">
            <span className="ti"><Icon name="check" size={12} /></span>
            <span className="msg">Draf disimpan.</span>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup notifikasi" onClick={() => setSaved(false)}>
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ReportFormShell
      step={2}
      steps={stepsOf('kerawanan')}
      main={main}
      aside={aside}
      back={{ label: 'Sebelumnya', to: STEP_ROUTES.temuan }}
      actions={[
        { label: 'Simpan draf', onClick: () => setSaved(true) },
        { label: 'Catat kerawanan', onClick: submit, variant: 'primary' },
      ]}
    />
  );
}
