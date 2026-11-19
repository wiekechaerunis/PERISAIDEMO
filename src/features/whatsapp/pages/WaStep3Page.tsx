// Board: I21b (Form dari WhatsApp · langkah 3 Lampiran, foto dari pesan). Foto pesan terlampir otomatis; boleh dilepas dari laporan.
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AiMsg, CopilotFrame, MeMsg, QuickReplies } from '@/features/insiden/copilot/parts';
import { ALLOWED_EXT, MSG_FORMAT, extLabel, extOf, formatSize, isImage, type RejectedFile } from '@/features/insiden/logic/attachments';
import { nextNumber } from '@/features/insiden/logic/submit';
import { useDemoStore } from '@/services/mock/store';
import { CopilotInput } from '../components/WaCopilot';
import { NoDraft } from '../components/NoDraft';
import { SubmissionCard, Toast } from '../components/parts';
import { WaFormShell } from '../components/WaFormShell';
import { WA_PREFIX } from '../logic/extract';
import { useActiveWaDraft, waPath } from '../logic/draft';

const CAP_SUGGESTION = 'Ujung kabel terpotong di dekat pompa';
const MAX_FILES = 10;
const MAX_MB = 25;
const ICO = { width: 36, height: 36 } as const;
let seq = 0;

export function WaStep3Page() {
  const { draft: wa, message, patchForm, patchDraft } = useActiveWaDraft();
  const incidents = useDemoStore((s) => s.incidents);
  const input = useRef<HTMLInputElement>(null);
  const blobs = useRef(new Map<string, File>());
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [cap, setCap] = useState<Record<string, 'on' | 'off'>>({});
  const [q3, setQ3] = useState<'a' | 'b' | null>(null);
  if (!wa || !message) return <NoDraft />;

  const files = wa.form.attachments;
  const nomor = nextNumber('INS-SEN', incidents.map((i) => i.no));
  const fromWa = (id: string) => id.startsWith(WA_PREFIX);
  const waCount = files.filter((a) => fromWa(a.id)).length;
  const pick = () => input.current?.click();
  const time = message.at.slice(11, 16);

  const add = (list: FileList | File[] | null) => {
    if (!list) return;
    const ok = [...files];
    const bad: RejectedFile[] = [];
    for (const f of Array.from(list)) {
      const id = `up-${Date.now().toString(36)}-${++seq}`;
      if (!ALLOWED_EXT.includes(extOf(f.name))) bad.push({ id, name: f.name, reason: MSG_FORMAT });
      else if (f.size > MAX_MB * 1024 * 1024) bad.push({ id, name: f.name, reason: `Ukuran melebihi ${MAX_MB} MB.` });
      else if (ok.length >= MAX_FILES) bad.push({ id, name: f.name, reason: `Maks. ${MAX_FILES} file.` });
      else {
        blobs.current.set(id, f);
        ok.push({ id, name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), caption: '' });
      }
    }
    patchForm({ attachments: ok });
    if (bad.length) setRejected((r) => [...r, ...bad]);
  };
  const setCaption = (id: string, caption: string) => patchForm({ attachments: files.map((a) => (a.id === id ? { ...a, caption } : a)) });
  const remove = (id: string) => patchForm({ attachments: files.filter((a) => a.id !== id) });

  const target = files.find((a) => isImage(a.name) && a.caption === '' && cap[a.id] !== 'off') ?? files.find((a) => cap[a.id] === 'on');
  const state = target ? (cap[target.id] ?? 'p') : 'p';
  const applyCap = (id: string) => {
    setCaption(id, CAP_SUGGESTION);
    patchDraft((d) => ({ ...d, ai: { ...d.ai, ['caption:' + id]: { src: 'kabel listrik pompa ADR-07 dipotong', confidence: 'hi', needsCheck: false, checked: true } } }));
    setCap((c) => ({ ...c, [id]: 'on' }));
  };
  const resetCap = (id: string) => {
    if (cap[id] === 'on') setCaption(id, '');
    patchDraft((d) => {
      const ai = { ...d.ai };
      delete ai['caption:' + id];
      return { ...d, ai };
    });
    setCap((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  };

  const main = (
    <section className="p-card in-sec">
      <h2 className="in-h">Foto atau dokumen <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink-muted)' }}>· opsional</span></h2>
      <p className="in-sub">Foto kondisi di lokasi membantu Pejabat Berwenang memeriksa lebih cepat.</p>
      <input ref={input} type="file" multiple className="rb-hide" aria-label="Pilih file lampiran" data-testid="file-input" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      <div
        className={'p-drop' + (over ? ' over' : '')}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <span className="di"><Icon name="upload" size={22} /></span>
        <b>Seret file ke sini atau pilih file</b>
        <span className="p-cap">Tambah file lain bila ada. Maks. {MAX_FILES} file, {MAX_MB} MB per file. JPG, PNG, PDF.</span>
        <span style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={pick}>Pilih file</button>
        </span>
      </div>
      {files.length + rejected.length > 0 && <span className="p-lbl" style={{ marginTop: 4 }}>{files.length + rejected.length} file</span>}
      <div className="p-files">
        {files.map((a) => (
          <div className="p-file" style={{ alignItems: 'flex-start' }} key={a.id}>
            <span className="fi">{extLabel(a.name)}</span>
            <div className="grow" style={{ gap: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <b>{a.name}</b>
                {fromWa(a.id) && <span className="p-tag t-info" style={{ height: 18, fontSize: 11, marginLeft: 6 }}>Dari WhatsApp</span>}
              </span>
              <span className="p-cap">{formatSize(a.sizeKb)} · {fromWa(a.id) ? `dari pesan ${message.sender}, ${time} WIB` : 'Terunggah'}</span>
              <label className="p-lbl" style={{ marginTop: 4 }} htmlFor={'cap-' + a.id}>
                Keterangan <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span>
                {wa.ai['caption:' + a.id] && <span className="p-tag t-info" style={{ display: 'inline-flex', height: 18, fontSize: 11, marginLeft: 6 }}>AI</span>}
              </label>
              <span className="p-input" style={{ height: 36 }}>
                <input id={'cap-' + a.id} className="rb-in" value={a.caption} placeholder="Tulis keterangan foto" onChange={(e) => setCaption(a.id, e.target.value)} />
              </span>
            </div>
            <button type="button" className="p-ibtn ghost" style={ICO} aria-label="Pratinjau" disabled={!blobs.current.has(a.id)} onClick={() => {
              const f = blobs.current.get(a.id);
              if (f) window.open(URL.createObjectURL(f), '_blank', 'noopener');
            }}><Icon name="eye" size={16} /></button>
            <button type="button" className="p-ibtn ghost" style={ICO} aria-label="Lepas dari laporan" onClick={() => remove(a.id)}><Icon name="trash" size={16} /></button>
          </div>
        ))}
        {rejected.map((r) => (
          <div className="p-file" style={{ alignItems: 'flex-start', boxShadow: 'inset 3px 0 0 var(--error-ink)' }} key={r.id}>
            <span className="fi">{extLabel(r.name)}</span>
            <div className="grow" style={{ gap: 4 }}>
              <b>{r.name}</b>
              <span className="p-help err" style={{ color: 'var(--error-ink)', fontSize: 12 }} role="alert"><Icon name="warn" size={14} />{r.reason}</span>
            </div>
            <button type="button" className="p-ibtn ghost" style={ICO} aria-label="Hapus file" onClick={() => setRejected((x) => x.filter((y) => y.id !== r.id))}><Icon name="trash" size={16} /></button>
          </div>
        ))}
      </div>
      <p className="p-cap" style={{ margin: '2px 0 0 0' }}>
        Foto dari pesan WhatsApp ikut terlampir otomatis. Hapus bila tidak relevan; pesan aslinya tetap tersimpan di Pemantauan WhatsApp.
      </p>
    </section>
  );

  const aside = (
    <>
      <SubmissionCard no={nomor} message={message} />
      <CopilotFrame status="Memeriksa lampiran dari pesan" showRestart onRestart={() => { setCap({}); setQ3(null); }}>
        <div className="cp-th" role="log" aria-live="polite">
          <AiMsg time="08:24">
            Lanjut ke <b>Lampiran</b>. {waCount > 0 ? 'Foto dari pesan sudah saya lampirkan:' : 'Saya periksa file Anda:'}
            <ul className="cp-chk">
              {waCount > 0 && <li><span className="ok"><Icon name="check" size={13} /></span>{waCount} foto dari pesan {message.sender} siap dipakai</li>}
              {waCount === 0 && files.length === 0 && <li><span className="ok"><Icon name="check" size={13} /></span>Belum ada file. Lampiran boleh dikosongkan.</li>}
              {files.length > 0 && <li><span className="ok"><Icon name="check" size={13} /></span>Format dan ukuran sesuai</li>}
              {rejected.map((r) => (
                <li className="w" key={r.id}>
                  <span className="wr"><Icon name="warn" size={12} /></span>
                  <span><b>{r.name}</b> belum bisa dipakai. Ubah ke foto JPG/PNG atau hapus.</span>
                </li>
              ))}
            </ul>
          </AiMsg>
          {target && wa.aiState === 'ok' && (
            <AiMsg time="08:24">
              Saran keterangan untuk foto yang belum diberi keterangan:
              <div className="cp-sg">
                <div className={'cp-s' + (state === 'on' ? ' on' : state === 'off' ? ' off' : '')}>
                  <div className="hd"><span className="k">KETERANGAN · {target.name}</span><span className="cp-cf hi">YAKIN</span></div>
                  <span className="v">
                    <span className="vl">{state === 'on' ? 'Terisi di form' : state === 'off' ? 'Tidak dipakai' : 'Usulan AI'}</span>
                    {CAP_SUGGESTION}
                  </span>
                  <span className="cp-src">dari foto dan pesan: “kabel listrik pompa ADR-07 dipotong”</span>
                  {state === 'p' ? (
                    <span className="a" style={{ display: 'flex' }}>
                      <button type="button" className="ok" onClick={() => applyCap(target.id)}><Icon name="check" size={13} />Pakai</button>
                      <button type="button" className="no" onClick={() => setCap((c) => ({ ...c, [target.id]: 'off' }))}><Icon name="close" size={13} />Tidak</button>
                    </span>
                  ) : (
                    <span className="row" style={{ display: 'flex' }}>
                      <span className="st">{state === 'on' ? '✓ Sudah masuk ke keterangan foto' : '✕ Keterangan dibiarkan kosong'}</span>
                      <button type="button" className="undo" onClick={() => resetCap(target.id)}>Batalkan</button>
                    </span>
                  )}
                </div>
              </div>
            </AiMsg>
          )}
          <AiMsg>
            Foto pagar atau jalur masuk belum ada. Bila {message.sender} punya, minta dia kirim ke grup lalu unggah di sini.
            {!q3 && <QuickReplies items={[{ label: 'Unggah foto lain', onClick: () => { setQ3('a'); pick(); } }, { label: 'Tidak ada foto lain', onClick: () => setQ3('b') }]} />}
          </AiMsg>
          {q3 && <MeMsg>{q3 === 'a' ? 'Saya unggah foto lain.' : 'Tidak ada foto lain.'}</MeMsg>}
        </div>
        <CopilotInput onAttach={pick} />
      </CopilotFrame>
      <div className="p-note" style={{ alignItems: 'flex-start' }}>
        <Icon name="lock" size={16} />
        <span>Setelah diajukan, isi dan lampiran terkunci sampai diperiksa.</span>
      </div>
    </>
  );

  return (
    <>
      <WaFormShell
        step={3}
        top={
          <div className="p-note" style={{ alignItems: 'flex-start' }}>
            <Icon name="info" size={18} />
            <span>
              Draf dari pesan WhatsApp grup <b style={{ fontWeight: 600 }}>{message.group}</b>. Foto dari pesan sudah terlampir; keterangan bertanda{' '}
              <b style={{ fontWeight: 600 }}>AI</b> adalah saran.
            </span>
          </div>
        }
        main={main} aside={aside}
        back={{ label: 'Sebelumnya', to: waPath('kejadian', wa.id) }}
        actions={[{ label: 'Simpan draf', onClick: () => setSaved(true) }, { label: 'Berikutnya', variant: 'primary', to: waPath('ringkasan', wa.id) }]}
      />
      {saved && <Toast text="Draf disimpan." onClose={() => setSaved(false)} />}
    </>
  );
}
