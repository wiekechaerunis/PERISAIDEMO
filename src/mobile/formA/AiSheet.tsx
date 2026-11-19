// AI Copilot layar penuh mobile: MA1b (mengetik), MA2 (saran isian), MA3 (merekam), MS16 (gagal), MS17 (mikrofon ditolak).
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AiMsg, CopilotFace, MeMsg, QuickReplies } from '@/features/insiden/copilot/parts';
import { LocationPicker } from '@/features/insiden/components/LocationPicker';
import { literalQuote } from '@/features/insiden/copilot/interview';
import { MAX_SEC, hhmm, mmss, type MobileCopilot } from './useMobileCopilot';

const WAVE_H = [6, 10, 14, 8, 16, 12, 6, 14, 18, 10, 8, 12, 16, 6, 10, 14, 8, 12];

export function AiSheet({ c, onClose }: { c: MobileCopilot; onClose: () => void }) {
  const { cp, suggestions, stOf, left, pr, question, finished } = c;
  const [confirm, setConfirm] = useState(false);
  const time = useRef(hhmm()).current;
  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo?.({ top: threadRef.current.scrollHeight });
  }, [cp.messages.length, cp.phase, pr.filled, cp.oos, question?.slot, finished]);

  const close = () => {
    c.dismiss();
    onClose();
  };
  const hasThread = cp.messages.length > 0 && cp.phase !== 'idle' && cp.phase !== 'err';
  const showThread = (hasThread || cp.phase === 'weak') && cp.phase !== 'rec';
  const typing = c.text.length > 0;
  const rec = cp.phase === 'rec';

  return (
    <>
      <div className="scrim" onClick={rec ? undefined : close}></div>
      <div className="sheet ma-sheet cp" role="dialog" aria-modal="true" aria-label={rec ? 'AI Copilot merekam' : 'AI Copilot'} style={cp.phase === 'err' ? { height: '70%' } : undefined}>
        <div className="grab" aria-hidden="true"></div>
        <div className="cp-hd ma-hd">
          <span className="av"><CopilotFace size={24} /></span>
          <div className="t"><b>AI Copilot</b><span>{c.status}</span></div>
          {hasThread && !rec && (
            <button type="button" className="ib44" aria-label="Mulai ulang percakapan" title="Mulai ulang percakapan" onClick={() => setConfirm(true)}>
              <Icon name="restart" size={18} />
            </button>
          )}
          <button type="button" className="ib44" aria-label="Tutup" onClick={close}><Icon name="close" size={18} /></button>
        </div>

        {confirm && (
          <div className="cp-conf" role="alertdialog" aria-label="Mulai ulang percakapan" style={{ display: 'flex' }}>
            <b>Mulai ulang percakapan?</b>
            <p>Riwayat percakapan dan saran yang belum dipilih akan dihapus. Isian yang sudah terisi di form tetap ada.</p>
            <div className="r">
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setConfirm(false)}>Batal</button>
              <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => { c.restart(); setConfirm(false); }}>Mulai ulang</button>
            </div>
          </div>
        )}

        {cp.phase === 'err' && (
          <>
            <div className="cp-err" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
              <span className="ic"><Icon name="warn" size={22} /></span>
              <b>AI Copilot sedang tidak tersedia</b>
              <p>Saran otomatis tidak tersedia karena layanan AI sedang gangguan atau kuota AI organisasi Anda bulan ini sudah habis.</p>
              <span className="hint">Lengkapi isian di form secara manual. Draf tetap tersimpan.</span>
            </div>
            <div className="ma-act" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <button type="button" className="p-btn p-btn-primary" onClick={close}>Isi form manual</button>
            </div>
          </>
        )}

        {rec && (
          <>
            <div className={c.maxed ? 'cp-listen ma-listen paused' : 'cp-listen ma-listen'} style={{ display: 'flex' }}>
              <span className="ring"><Icon name="mic" size={26} /></span>
              <b>{c.maxed ? 'Rekaman berhenti' : 'Mendengarkan…'}</b>
              <span className="tm"><i className="dot"></i>{c.maxed ? 'Batas' : 'Merekam'} · {mmss(Math.min(c.sec, MAX_SEC))}</span>
              <div className="wave" aria-hidden="true">
                {Array.from({ length: 26 }, (_, i) => <i key={i} style={{ animationDelay: `-${(((i * 137) % 90) / 100).toFixed(2)}s` }}></i>)}
              </div>
              <div className="live">
                <span className="lb">Teks dari suara Anda</span>
                <p>{c.live}<span className="caret"></span></p>
              </div>
              <span className="hint">Ceritakan apa yang terjadi, kapan, di mana, dan dampaknya. Layar tetap menyala selama merekam.</span>
            </div>
            <div style={{ flex: 1 }}></div>
            {c.maxed ? (
              <div className="cp-recmax" style={{ display: 'flex' }}>
                <Icon name="warn" size={16} />
                <div>
                  <b>Rekaman berhenti di 3 menit.</b> Kirim rekaman ini atau rekam lagi untuk bagian berikutnya.
                  <div className="r">
                    <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => c.startRec()}>Rekam lagi</button>
                    <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => c.stopRec(true)}>Kirim rekaman</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cp-recbar ma-rec" style={{ display: 'flex' }}>
                <button type="button" className="ib" aria-label="Batalkan rekaman" onClick={() => c.stopRec(false)}><Icon name="close" size={16} /></button>
                <div className="mid">
                  <i className="dot"></i><span className="t">{mmss(c.sec)}</span>
                  <div className="sw" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ animationDelay: `-${(((i * 211) % 90) / 100).toFixed(2)}s` }}></i>)}</div>
                </div>
                <button type="button" className="stop" onClick={() => c.stopRec(true)}><i></i>Selesai</button>
              </div>
            )}
          </>
        )}

        {cp.phase !== 'err' && !rec && (
          <div className={'cp-th ma-th' + (!showThread ? ' ma-start' : '')} role="log" aria-live="polite" ref={threadRef}>
            {!showThread && (
              <div className="ma-guide">
                <b>Ceritakan kejadianmu di sini</b>
                <span>Supaya hasilnya lengkap, sebutkan:</span>
                <div className="ma-hints"><span>Apa yang terjadi</span><span>Kapan</span><span>Di mana</span><span>Dampaknya</span></div>
              </div>
            )}
            {showThread && cp.messages.map((m, i) => m.from === 'ai' ? (
              'cards' in m ? (
                <AiMsg key={i} time={i === 1 ? time : undefined}>
                  {m.text}
                  <div className="cp-sg">
                    {m.cards.map((s) => {
                      const x = stOf(s.key);
                      const quote = literalQuote(s.src, cp.story);
                      return (
                        <div key={s.key} className={'cp-s' + (x === 'on' ? ' on' : x === 'off' ? ' off' : '')}>
                          <div className="hd">
                            <span className="k">{s.label}</span>
                            <span className={'cp-cf ' + s.confidence}>{s.confidence === 'hi' ? 'YAKIN' : 'PERLU DICEK'}</span>
                          </div>
                          <span className="v">
                            <span className="vl">{x === 'on' ? 'Terisi di form' : x === 'off' ? 'Tidak dipakai' : 'Usulan AI'}</span>
                            {s.value}
                          </span>
                          {quote && <span className="cp-src">dari cerita: “{quote}”</span>}
                          {x === 'p' ? (
                            <span className="a" style={{ display: 'flex' }}>
                              <button type="button" className="ok" onClick={() => c.applyOne(s)}><Icon name="check" size={13} />Pakai</button>
                              <button type="button" className="no" onClick={() => c.skip(s)}><Icon name="close" size={13} />Tidak</button>
                            </span>
                          ) : (
                            <span className="row" style={{ display: 'flex' }}>
                              <span className="st">{x === 'on' ? '✓ Sudah masuk ke isian ' + s.label.split(' · ')[0].toLowerCase() : '✕ Isian dibiarkan kosong'}</span>
                              <button type="button" className="undo" onClick={() => c.undo(s)}>{x === 'on' ? 'Batalkan' : 'Pakai lagi'}</button>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AiMsg>
              ) : <AiMsg key={i}>{m.text}</AiMsg>
            ) : (
              <MeMsg key={i} time={i === 0 ? time : undefined}>
                {m.voice && (
                  <>
                    <div className="cp-vo" style={{ display: 'flex' }}>
                      <span className="pl"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12 }}><path d="M7 4v16l13-8z" fill="currentColor" /></svg></span>
                      <span className="w">{WAVE_H.map((h, j) => <i key={j} style={{ height: h }}></i>)}</span>
                      <span className="d">0:12</span>
                    </div>
                    <span className="cp-vt" style={{ display: 'flex' }}>Transkrip</span>
                  </>
                )}
                {m.text}
              </MeMsg>
            ))}

            {showThread && cp.phase === 'proc' && (
              <AiMsg>
                <b>Sedang membaca cerita Anda…</b>
                <ul className="cp-steps">
                  <li className="ok"><i></i>Cerita diterima</li>
                  <li className="ok"><i></i>Jenis laporan dikenali</li>
                  <li className="run"><i></i>Mencari waktu, lokasi, dan dampak</li>
                  <li><i></i>Menyusun saran isian</li>
                </ul>
                <span className="cp-src" style={{ display: 'block', marginTop: 6 }}>Biasanya selesai dalam beberapa detik. Anda bisa sambil memeriksa form.</span>
              </AiMsg>
            )}

            {cp.phase === 'weak' && (
              <AiMsg time={time}>
                Saya belum menemukan isian dari cerita ini. Bisa ceritakan apa yang terjadi, kapan, dan di mana?
                <QuickReplies items={[{ label: 'Tambah cerita', onClick: () => cp.set({ phase: 'idle', messages: [], story: '' }) }, { label: 'Isi form manual', onClick: close }]} />
              </AiMsg>
            )}

            {cp.oos && cp.phase === 'ready' && (
              <AiMsg time={time}>
                Maaf, yang itu belum bisa saya bantu. Di sini saya fokus melengkapi laporan Anda, jadi tidak bisa membuka laporan lain atau menebak pelakunya. Kalau ingin cek kejadian serupa, buka menu <b>Daftar insiden</b>. Kita lanjut isi form?
                <QuickReplies items={[
                  { label: 'Lanjut isi form', onClick: () => cp.set({ oos: false }) },
                  { label: 'Buka Daftar insiden', onClick: () => cp.set({ oos: false }) },
                ]} />
              </AiMsg>
            )}

            {question && !cp.oos && (
              <AiMsg time={time}>
                {question.text}
                <QuickReplies items={question.chips.map((ch) => ({ label: ch.label, pressed: ch.pressed, onClick: () => c.choose(question, ch.id) }))} />
              </AiMsg>
            )}

            {finished && !cp.oos && (
              <AiMsg time={time}>
                <b>{pr.filled === pr.total ? 'Semua isian wajib sudah terisi.' : 'Semua isian wajib sudah terisi atau Anda lewati.'}</b> Ringkasannya:
                <dl className="cp-done">
                  {c.summary.map((r) => (
                    <div key={r.slot}><dt>{r.label}</dt><dd className={r.value === 'Dilewati' ? 'sk' : undefined}>{r.value}</dd></div>
                  ))}
                </dl>
                <button type="button" className="cp-big" style={{ display: 'inline-flex', marginTop: 8 }} onClick={close}>
                  <Icon name="check" size={13} />Periksa form
                </button>
              </AiMsg>
            )}
          </div>
        )}

        {cp.phase !== 'err' && !rec && (
          <div className="ma-sf">
            {c.micDenied && (
              <div className="cp-alert ma-alert" role="alert" style={{ display: 'flex', margin: '8px 12px 0' }}>
                <Icon name="micOff" size={16} />
                <span>Izin mikrofon belum diberikan. Buka pengaturan HP, izinkan mikrofon untuk PERISAI, atau ketik cerita Anda.</span>
              </div>
            )}
            <div className={'cp-cm' + (typing ? ' ma-typing' : '')}>
              <textarea
                className={'in' + (typing ? ' on' : '')} rows={2} aria-label="Ceritakan kejadian" placeholder={cp.phase === 'ready' ? 'Ketik jawaban atau tambahan cerita…' : 'Ketik ceritamu di sini…'}
                value={c.text} disabled={cp.phase === 'proc'} onChange={(e) => c.setText(e.target.value)}
                style={{ resize: 'none', width: '100%', font: 'inherit', outline: 0 }}
              />
              <button type="button" className="ib" aria-label="Rekam suara" onClick={() => c.startRec()}><Icon name="mic" size={18} /></button>
              <button type="button" className="ib send" aria-label="Kirim" disabled={cp.phase === 'proc'} onClick={() => void c.send(c.text)}><Icon name="send" size={18} /></button>
            </div>
            {typing && <span className="ma-cnt">Tekan kirim, AI mulai membaca ceritamu</span>}
            {cp.phase === 'ready' && suggestions.length > 0 && (
              <div className="ma-act">
                <button type="button" className={'p-btn ' + (left > 0 ? 'p-btn-secondary' : 'p-btn-primary')} onClick={close}>Lihat form</button>
                {left > 0 && (
                  <button type="button" className="p-btn p-btn-primary" onClick={c.applyAll}><Icon name="check" size={16} />Pakai semua ({left})</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {c.mapOpen && (
        <LocationPicker
          variant="sheet" askWk={false} initial={{ lat: c.draft.lat, lng: c.draft.lng, wk: c.draft.wk }}
          onClose={() => c.setMapOpen(false)} onPick={c.pickLocation}
        />
      )}
    </>
  );
}
