// Board mobile: M4 (Lampiran), MA6 (bar AI), MS (gagal unggah: file ditolak). Logika sama dengan ReportStep3Page (useAttachmentUpload).
import { demoNow } from '@/services/mock/clock';
import { useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatWibFull } from '@/lib/format';

import { extLabel, formatSize, useAttachmentUpload } from '@/features/insiden/logic/attachments';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { STEP_ROUTES } from '@/features/insiden/logic/steps';
import { MobileShell } from '../ui/MobileShell';
import { AiBar, D, MenuRow, Pi, Sheet, StepHead, useDraftMenu } from './parts';

export function MobileReportStep3Page() {
  const navigate = useNavigate();
  const resetDraft = useDraftStore((s) => s.resetDraft);
  const aiFilled = useDraftStore((s) => s.draft.aiFilled);
  const { attachments, rejected, add, remove, removeRejected, setCaption, preview, canPreview } = useAttachmentUpload({ maxFiles: 10, maxMb: 25 });
  const camRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const [fileMenu, setFileMenu] = useState<string | null>(null);

  const { actions, overlay } = useDraftMenu({
    savedAt: formatWibFull(demoNow()).slice(-9),
    onDelete: () => {
      resetDraft();
      navigate('/insiden');
    },
  });

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    add(e.target.files);
    e.target.value = '';
  };
  const captioned = attachments.filter((a) => aiFilled.includes('caption:' + a.id)).length;
  const target = attachments.find((a) => a.id === fileMenu);

  return (
    <MobileShell
      title="Laporan baru"
      backTo="/insiden"
      actions={actions}
      footer={
        <>
          <Link to={STEP_ROUTES.kejadian} className="p-btn p-btn-secondary" aria-label="Sebelumnya" style={{ width: 48, padding: 0, justifyContent: 'center' }}>
            <Pi d={D.prev} size={18} />
          </Link>
          <Link to={STEP_ROUTES.ringkasan} className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Berikutnya</Link>
        </>
      }
      overlay={
        <>
          {overlay}
          {target && (
            <Sheet role="menu" label="Aksi lampiran" onClose={() => setFileMenu(null)}>
              <MenuRow icon={D.eye} title="Pratinjau" disabled={!canPreview(target.id)} onClick={() => { preview(target.id); setFileMenu(null); }} />
              <MenuRow icon={D.trash} title="Hapus file" danger onClick={() => { remove(target.id); setFileMenu(null); }} />
              <div className="sf"><button type="button" className="p-btn p-btn-secondary" onClick={() => setFileMenu(null)}>Batal</button></div>
            </Sheet>
          )}
        </>
      }
    >
      <StepHead step={3} name="Lampiran" next="Berikutnya: Ringkasan" />
      {captioned > 0 && (
        <AiBar>
          <b>AI menyiapkan keterangan {captioned} foto</b>
          {rejected.length > 0 && ` · ${rejected.length} file perlu diganti`}
        </AiBar>
      )}
      <div className="sec">
        <h2>Foto atau dokumen</h2>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden aria-label="Ambil foto dengan kamera" data-testid="camera-input" onChange={onFiles} />
        <input ref={pickRef} type="file" multiple hidden aria-label="Pilih file lampiran" data-testid="file-input" onChange={onFiles} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="p-btn p-btn-secondary" style={{ flex: 1, minHeight: 44 }} onClick={() => camRef.current?.click()}>
            <Pi d={D.camera} />Ambil foto
          </button>
          <button type="button" className="p-btn p-btn-secondary" style={{ flex: 1, minHeight: 44 }} onClick={() => pickRef.current?.click()}>
            <Pi d={D.upload} />Pilih file
          </button>
        </div>
        <span className="p-help">Maks. 10 file, 25 MB per file. JPG, PNG, PDF.</span>
        {attachments.length + rejected.length > 0 && (
          <div className="p-files">
            {attachments.map((a) => (
              <div className="p-file" key={a.id}>
                <span className="fi">{extLabel(a.name)}</span>
                <div className="grow">
                  <b>{a.name}</b>
                  <span className="p-cap">{formatSize(a.sizeKb)} · Terunggah</span>
                  <span className="p-input" style={{ height: 36, minHeight: 36 }}>
                    <input
                      className="rb-in"
                      style={{ flex: 1 }}
                      aria-label={`Keterangan ${a.name}`}
                      value={a.caption}
                      placeholder="Tulis keterangan foto"
                      onChange={(e) => setCaption(a.id, e.target.value)}
                    />
                  </span>
                </div>
                <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Aksi lampiran" aria-haspopup="menu" onClick={() => setFileMenu(a.id)}>
                  <Pi d={D.more} />
                </button>
              </div>
            ))}
            {rejected.map((r) => (
              <div className="p-file err" key={r.id}>
                <span className="fi">{extLabel(r.name)}</span>
                <div className="grow">
                  <b>{r.name}</b>
                  <span className="p-cap" role="alert" style={{ color: 'var(--error-ink)' }}>{r.reason}</span>
                </div>
                <button type="button" className="p-ibtn ghost" style={{ width: 44, height: 44 }} aria-label="Hapus" onClick={() => removeRejected(r.id)}>
                  <Pi d={D.close} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
