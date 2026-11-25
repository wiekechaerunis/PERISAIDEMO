// Board: I13b (Form laporan · Lampiran). Lampiran di memori; yang masuk ke draf hanya nama, ukuran, keterangan.
import { demoNow } from '@/services/mock/clock';
import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

import { ReportFormShell } from '../components/ReportFormShell';
import { AiMsg, CopilotFrame, MeMsg, QuickReplies } from '../copilot/parts';
import { extLabel, formatSize, isImage, useAttachmentUpload } from '../logic/attachments';
import { useDraftStore } from '../logic/draft';
import { stepsOf, STEP_ROUTES } from '../logic/steps';
import { saveDraftNow } from '../logic/draftSave';

const CAP_SUGGESTION = 'Jalur kabel yang terpotong di sisi panel';
const hhmm = () => demoNow().slice(11, 16);

const BTN_ICO = { width: 36, height: 36 } as const;

export function ReportStep3Page() {
  const markAi = useDraftStore((s) => s.markAi);
  const aiFilled = useDraftStore((s) => s.draft.aiFilled);
  const { attachments, rejected, add, remove, removeRejected, setCaption, preview, canPreview } = useAttachmentUpload({
    maxFiles: 10,
    maxMb: 25,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cap, setCap] = useState<Record<string, 'on' | 'off'>>({});
  const [q3, setQ3] = useState<'a' | 'b' | null>(null);
  const time = useMemo(hhmm, []);

  const pick = () => inputRef.current?.click();
  const total = attachments.length + rejected.length;
  const photos = attachments.filter((a) => isImage(a.name));
  const suggestFor = photos.find((a) => a.caption === '' && cap[a.id] !== 'off') ?? photos.find((a) => cap[a.id] === 'on');
  const state = suggestFor ? (cap[suggestFor.id] ?? 'p') : 'p';

  const applyCap = (id: string) => {
    setCaption(id, CAP_SUGGESTION);
    markAi('caption:' + id, true);
    setCap((c) => ({ ...c, [id]: 'on' }));
  };
  const resetCap = (id: string) => {
    if (cap[id] === 'on') setCaption(id, '');
    markAi('caption:' + id, false);
    setCap((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  };
  const restart = () => {
    attachments.forEach((a) => aiFilled.includes('caption:' + a.id) && markAi('caption:' + a.id, false));
    setCap({});
    setQ3(null);
  };

  const main = (
    <section className="p-card in-sec">
      <h2 className="in-h">
        Foto atau dokumen <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink-muted)' }}>· opsional</span>
      </h2>
      <p className="in-sub">Foto kondisi di lokasi membantu Pejabat Berwenang memeriksa lebih cepat.</p>
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
        <b>Seret file ke sini atau pilih file</b>
        <span className="p-cap">Maks. 10 file, 25 MB per file. JPG, PNG, PDF.</span>
        <span style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={pick}>Pilih file</button>
        </span>
      </div>
      {total > 0 && (
        <span className="p-lbl" style={{ marginTop: 4 }}>
          {total} file{rejected.length > 0 ? ` · ${rejected.length} perlu diganti` : ''}
        </span>
      )}
      {total > 0 && (
        <div className="p-files">
          {attachments.map((a) => (
            <div className="p-file" style={{ alignItems: 'flex-start' }} key={a.id}>
              <span className="fi">{extLabel(a.name)}</span>
              <div className="grow" style={{ gap: 6 }}>
                <b>{a.name}</b>
                <span className="p-cap">{formatSize(a.sizeKb)} · Terunggah</span>
                <label className="p-lbl" style={{ marginTop: 4 }} htmlFor={'cap-' + a.id}>
                  Keterangan <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span>
                  {aiFilled.includes('caption:' + a.id) && (
                    <span className="p-tag t-info" style={{ display: 'inline-flex', height: 18, fontSize: 11, marginLeft: 6 }}>AI</span>
                  )}
                </label>
                <span className="p-input" style={{ height: 36 }}>
                  <input
                    id={'cap-' + a.id}
                    className="rb-in"
                    value={a.caption}
                    placeholder="Tulis keterangan foto"
                    onChange={(e) => setCaption(a.id, e.target.value)}
                  />
                </span>
              </div>
              <button type="button" className="p-ibtn ghost" style={BTN_ICO} aria-label="Pratinjau" disabled={!canPreview(a.id)} onClick={() => preview(a.id)}>
                <Icon name="eye" size={16} />
              </button>
              <button type="button" className="p-ibtn ghost" style={BTN_ICO} aria-label="Hapus file" onClick={() => remove(a.id)}>
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
                  <Icon name="warn" size={14} />
                  {r.reason}
                </span>
              </div>
              <button type="button" className="p-ibtn ghost" style={BTN_ICO} aria-label="Hapus file" onClick={() => removeRejected(r.id)}>
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const aside = (
    <>
      <CopilotFrame status="Memeriksa lampiran" showRestart onRestart={restart}>
        <div className="cp-th" role="log" aria-live="polite">
          <AiMsg time={time}>
            Lanjut ke <b>Lampiran</b>. Saya periksa file Anda:
            <ul className="cp-chk">
              {photos.length > 0 && (
                <li>
                  <span className="ok"><Icon name="check" size={13} /></span>
                  {photos.length} foto siap dipakai
                </li>
              )}
              {attachments.length === 0 && rejected.length === 0 && (
                <li>
                  <span className="ok"><Icon name="check" size={13} /></span>
                  Belum ada file. Lampiran boleh dikosongkan.
                </li>
              )}
              {rejected.map((r) => (
                <li className="w" key={r.id}>
                  <span className="wr"><Icon name="warn" size={12} /></span>
                  <span><b>{r.name}</b> belum bisa dipakai. Ubah ke foto JPG/PNG atau hapus.</span>
                </li>
              ))}
            </ul>
          </AiMsg>
          {suggestFor && (
            <AiMsg time={time}>
              Saran keterangan untuk foto yang belum diberi keterangan:
              <div className="cp-sg">
                <div className={'cp-s' + (state === 'on' ? ' on' : state === 'off' ? ' off' : '')}>
                  <div className="hd">
                    <span className="k">KETERANGAN · {suggestFor.name}</span>
                    <span className="cp-cf hi">YAKIN</span>
                  </div>
                  <span className="v">
                    <span className="vl">{state === 'on' ? 'Terisi di form' : state === 'off' ? 'Tidak dipakai' : 'Usulan AI'}</span>
                    {CAP_SUGGESTION}
                  </span>
                  <span className="cp-src">dari foto dan cerita: “sekitar 40 m hilang”</span>
                  {state === 'p' ? (
                    <span className="a" style={{ display: 'flex' }}>
                      <button type="button" className="ok" onClick={() => applyCap(suggestFor.id)}>
                        <Icon name="check" size={13} />Pakai
                      </button>
                      <button type="button" className="no" onClick={() => setCap((c) => ({ ...c, [suggestFor.id]: 'off' }))}>
                        <Icon name="close" size={13} />Tidak
                      </button>
                    </span>
                  ) : (
                    <span className="row" style={{ display: 'flex' }}>
                      <span className="st">{state === 'on' ? '✓ Sudah masuk ke keterangan foto' : '✕ Keterangan dibiarkan kosong'}</span>
                      <button type="button" className="undo" onClick={() => resetCap(suggestFor.id)}>Batalkan</button>
                    </span>
                  )}
                </div>
              </div>
            </AiMsg>
          )}
          <AiMsg>
            Belum ada foto akses masuk atau pagar. Bila ada, tambahkan supaya pemeriksa bisa melihat titik masuk.
            {!q3 && (
              <QuickReplies
                items={[
                  { label: 'Unggah foto lain', onClick: () => { setQ3('a'); pick(); } },
                  { label: 'Tidak ada foto lain', onClick: () => setQ3('b') },
                ]}
              />
            )}
          </AiMsg>
          {q3 && <MeMsg>{q3 === 'a' ? 'Saya unggah foto lain.' : 'Tidak ada foto lain.'}</MeMsg>}
        </div>
        <div className="cp-cm">
          <div className="in">Ketik ceritamu di sini…</div>
          <button type="button" className="ib" aria-label="Lampirkan foto" onClick={pick}><Icon name="attach" size={16} /></button>
          <button type="button" className="ib" aria-label="Rekam suara" title="Rekam suara"><Icon name="mic" size={16} /></button>
          <button type="button" className="ib send" aria-label="Kirim"><Icon name="send" size={16} /></button>
        </div>
      </CopilotFrame>
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
      step={3}
      steps={stepsOf('insiden')}
      main={main}
      aside={aside}
      back={{ label: 'Sebelumnya', to: STEP_ROUTES.kejadian }}
      actions={[
        { label: 'Simpan draf', onClick: () => { saveDraftNow(); setSaved(true); } },
        { label: 'Berikutnya', to: STEP_ROUTES.ringkasan, variant: 'primary' },
      ]}
    />
  );
}

