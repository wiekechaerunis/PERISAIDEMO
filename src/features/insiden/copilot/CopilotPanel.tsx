// AI Copilot (board I12/I13: panel kanan, sticky). Hanya menyarankan; yang masuk ke form hanya saran yang di-Pakai.
// FR-INS-60..65, 71, 75 [USULAN]. Setelah membaca cerita, Copilot terus bertanya (satu pertanyaan per pesan, dengan chip
// jawaban cepat) sampai semua isian wajib terisi atau ditolak pengguna; aturan ada di interview.ts.
// Skenario demo: kirim tanpa mengetik memakai cerita kabel ADR-07.
import { useEffect, useRef, useState } from 'react';
import { demoNow } from '@/services/mock/clock';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { ai, claudeActive, forceMockAi } from '@/services/ai';
import { CARD_SLOT, alreadyFilled, parseTime } from './cardRules';
import type { Extraction } from '@/services/ai/types';
import { LocationPicker } from '../components/LocationPicker';
import { useDraftStore } from '../logic/draft';
import { STEP_ROUTES } from '../logic/steps';
import { useCopilotStore, type ThreadItem } from './copilotStore';
import {
  answerChip, answerLabel, answerText, literalQuote, localIso, nextQuestion, progress, summaryOf,
  type Answer, type Ctx, type Question, type SlotKey,
} from './interview';
import {
  DEMO_STORY, SUGGESTION_FIELD, applySuggestion, buildAllSuggestions, revertSuggestion,
  type CopilotStep, type Suggestion, type SuggestionKey,
} from './suggestions';
import { AiMsg, CopilotFrame, EmptyIllustration, MeMsg, QuickReplies } from './parts';
import { startListening, voiceSupported, type Listener } from './voice';

const hhmm = () => demoNow().slice(11, 16);
const MAX_SEC = 180;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

interface Props {
  step: CopilotStep;
}

export function CopilotPanel({ step }: Props) {
  const cp = useCopilotStore();
  const navigate = useNavigate();
  const { patch, markAi, draft } = useDraftStore();
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [sec, setSec] = useState(0);
  const [live, setLive] = useState('');
  const listener = useRef<Listener | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const time = useRef(hhmm()).current;

  const ex = cp.extraction;
  const stOf = (k: SuggestionKey) => cp.status[k] ?? 'p';
  const cardsOf = (items: ThreadItem[]) => items.flatMap((m) => ('cards' in m ? m.cards.map((c) => ({ c, ex: m.ex })) : []));
  const pending = cardsOf(cp.messages).filter(({ c }) => stOf(c.key) === 'p');
  const held = pending.map(({ c }) => CARD_SLOT[c.key]).filter((s): s is SlotKey => !!s);
  const ctx = (): Ctx => ({ draft: useDraftStore.getState().draft, ex: useCopilotStore.getState().extraction, skipped: useCopilotStore.getState().skipped, flags: useCopilotStore.getState().flags, story: useCopilotStore.getState().story });
  const pr = progress(draft, cp.skipped);
  const question: Question | null =
    cp.phase === 'ready' ? nextQuestion({ draft, ex, skipped: [...cp.skipped, ...held], flags: cp.flags, story: cp.story }) : null;
  const finished = cp.phase === 'ready' && !question && pending.length === 0 && pr.open.length === 0;
  const pct = pr.total ? Math.round((pr.filled * 100) / pr.total) : 0;

  useEffect(() => {
    threadRef.current?.scrollTo?.({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [cp.messages.length, cp.phase, question?.slot, pr.filled, cp.oos, finished]);

  // timer rekaman, berhenti otomatis di 3 menit (S22)
  useEffect(() => {
    if (cp.phase !== 'rec') return;
    const id = setInterval(() => setSec((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [cp.phase]);
  const maxed = cp.phase === 'rec' && sec >= MAX_SEC;

  const setStatus = (k: SuggestionKey, v: 'on' | 'off' | null) =>
    useCopilotStore.setState((st) => {
      const next = { ...st.status };
      if (v) next[k] = v;
      else delete next[k];
      return { status: next };
    });
  const setFlag = (f: Partial<Ctx['flags']>) => useCopilotStore.setState((st) => ({ flags: { ...st.flags, ...f } }));

  const applyOne = (s: Suggestion, x: Extraction) => {
    const { patch: p, ai: field } = applySuggestion(s.key, x, useDraftStore.getState().draft);
    patch(p);
    markAi(field, true);
    setStatus(s.key, 'on');
    if (s.key === 'trd') setFlag({ axesDone: true });
  };
  const skip = (s: Suggestion) => setStatus(s.key, 'off');
  const undo = (s: Suggestion, x: Extraction) => {
    if (stOf(s.key) === 'on') {
      patch(revertSuggestion(s.key));
      markAi(SUGGESTION_FIELD[s.key], false);
      setStatus(s.key, null);
      if (s.key === 'trd') setFlag({ axesDone: false });
    } else {
      applyOne(s, x);
    }
  };
  const applyAll = (items: { c: Suggestion; ex: Extraction }[]) => items.forEach(({ c, ex: x }) => applyOne(c, x));

  /** Catat jawaban pada percakapan, isi draf, lalu biarkan pertanyaan berikutnya dihitung dari draf yang baru. */
  const commit = (q: Question, a: Answer, meText: string, voice = false) => {
    patch(a.patch);
    const st = useCopilotStore.getState();
    const add: ThreadItem[] = a.toggle ? [] : [{ from: 'ai', text: q.text }, { from: 'me', text: meText, voice }];
    if (a.reply) add.push({ from: 'ai', text: a.reply });
    st.set({
      messages: [...st.messages, ...add],
      skipped: a.skip && !st.skipped.includes(a.skip) ? [...st.skipped, a.skip] : st.skipped,
      oos: false,
    });
    if (a.flag) setFlag({ [a.flag]: true });
    if (a.openMap) setMapOpen(true);
  };
  const choose = (q: Question, id: string) => {
    const a = answerChip(q, id, ctx());
    const after = { ...useDraftStore.getState().draft, ...a.patch };
    const label =
      q.slot === 'axes' && id === 'done'
        ? summaryOf(after, []).find((r) => r.slot === 'axes')?.value || 'Lanjut'
        : answerLabel(q, id);
    commit(q, a, label);
  };

  const send = async (raw: string, voice = false) => {
    const typed = raw.trim();
    const st = useCopilotStore.getState();
    if (!typed && st.phase === 'ready') return;
    const msg = typed || DEMO_STORY;
    setText('');
    if (st.phase === 'ready') {
      if (ai.isOutOfScope(msg)) {
        st.set({ messages: [...st.messages, { from: 'me', text: msg }], oos: true });
        return;
      }
      if (question?.typed) {
        const a = answerText(question, msg, ctx(), parseTime);
        if (a) {
          commit(question, a, msg, voice);
          return;
        }
      }
    }
    const story = st.story ? `${st.story} ${msg}` : msg;
    cp.set({ phase: 'proc', story, messages: [...st.messages, { from: 'me', text: msg, voice }], oos: false });
    await read(story);
  };

  /** Baca cerita (gabungan) lewat ai.extract; kartu hanya untuk isian yang belum terisi dan belum pernah diusulkan. */
  const read = async (story: string, retrying = false) => {
    try {
      const result = await ai.extract(story, { now: localIso() });
      const cur = useCopilotStore.getState();
      const seen = new Set(cardsOf(cur.messages).map(({ c }) => c.key));
      const all = buildAllSuggestions(result);
      const d = useDraftStore.getState().draft;
      const fresh = all.filter((s) => !seen.has(s.key) && !cur.status[s.key] && !alreadyFilled(s.key, d));
      const had = seen.size > 0;
      if (all.length === 0 && !had) {
        cur.set({ extraction: result, phase: 'weak', ...(retrying ? { weakKind: 'short' as const } : {}) });
        return;
      }
      const note: ThreadItem = fresh.length
        ? {
            from: 'ai', cards: fresh, ex: result,
            text: had
              ? 'Dari tambahan cerita Anda, ada saran baru:'
              : 'Terima kasih, cerita Anda sudah saya baca. Ini isian yang bisa saya usulkan. Keparahan tidak saya isi; sistem yang menyarankan dari dampak.',
          }
        : {
            from: 'ai',
            text: had
              ? 'Saya belum menemukan isian baru dari pesan itu. Silakan pilih jawaban di bawah atau isi langsung di form.'
              : 'Terima kasih, cerita Anda sudah saya baca. Isian yang bisa saya usulkan sudah terisi di form.',
          };
      cur.set({ extraction: result, phase: 'ready', messages: [...cur.messages, note] });
    } catch {
      useCopilotStore.getState().set({ phase: 'err' });
    }
  };

  /** Ulangi pembacaan cerita yang sama (tombol "Coba lagi" pada state gagal, board S19). */
  const retry = async () => {
    cp.set({ phase: 'proc' });
    await read(cp.story, true);
  };

  const startRec = () => {
    if (!voiceSupported()) {
      setMicDenied(true);
      return;
    }
    setMicDenied(false);
    setSec(0);
    setLive('');
    cp.set({ phase: 'rec' });
    listener.current = startListening({
      onText: setLive,
      onError: () => {
        setMicDenied(true);
        cp.set({ phase: cp.messages.length ? 'ready' : 'idle' });
      },
    });
  };
  const stopRec = (submit: boolean) => {
    const heard = listener.current?.stop() ?? live;
    listener.current = null;
    // Suara kurang jelas (board S21): pengenalan suara jalan tetapi hampir tidak ada teks. Tanpa dukungan suara, demo memakai cerita contoh.
    if (submit && voiceSupported() && heard.trim().length < 8) {
      cp.set({
        phase: 'weak', weakKind: 'noisy',
        messages: [...cp.messages, { from: 'me', text: heard.trim() || '[tidak terdengar]', voice: true }],
      });
      return;
    }
    if (submit) void send(heard || DEMO_STORY, true);
    else cp.set({ phase: cp.messages.length ? 'ready' : 'idle' });
  };

  const restart = () => {
    cp.reset(true);
    setConfirm(false);
  };

  const status =
    cp.phase === 'err' ? 'Tidak tersedia saat ini'
      : maxed ? 'Rekaman mencapai batas 3 menit'
      : cp.phase === 'weak' ? 'Menunggu cerita yang lebih lengkap'
      : cp.phase === 'rec' ? 'Sedang mendengarkan cerita Anda'
      : cp.phase === 'proc' ? 'Membaca cerita Anda…'
      : cp.phase === 'idle' ? 'Siap membantu mengisi laporan'
      : `Terisi ${pr.filled} dari ${pr.total} isian wajib`;

  const hasThread = cp.messages.length > 0 && cp.phase !== 'idle' && cp.phase !== 'err';
  const showProgress = !!ex && cp.messages.some((m) => 'cards' in m || m.from === 'ai') && cp.phase !== 'rec' && cp.phase !== 'err';

  const reviewForm = () => {
    if (step === 1) navigate(draft.kind === 'insiden' ? STEP_ROUTES.kejadian : STEP_ROUTES.detailKerawanan);
    else window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const renderCards = (m: Extract<ThreadItem, { cards: Suggestion[] }>, first: boolean) => {
    const left = m.cards.filter((s) => stOf(s.key) === 'p');
    return (
      <AiMsg time={first ? time : undefined}>
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
                    <button type="button" className="ok" onClick={() => applyOne(s, m.ex)}><Icon name="check" size={13} />Pakai</button>
                    <button type="button" className="no" onClick={() => skip(s)}><Icon name="close" size={13} />Tidak</button>
                  </span>
                ) : (
                  <span className="row" style={{ display: 'flex' }}>
                    <span className="st">{x === 'on' ? '✓ Sudah masuk ke isian ' + s.label.split(' · ')[0].toLowerCase() : '✕ Isian dibiarkan kosong'}</span>
                    <button type="button" className="undo" onClick={() => undo(s, m.ex)}>{x === 'on' ? 'Batalkan' : 'Pakai lagi'}</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {left.length > 1 && (
          <button type="button" className="cp-big" style={{ display: 'inline-flex' }} onClick={() => applyAll(left.map((c) => ({ c, ex: m.ex })))}>
            <Icon name="check" size={13} />Pakai semua yang tersisa ({left.length})
          </button>
        )}
      </AiMsg>
    );
  };

  let firstCards = true;
  return (
    <CopilotFrame status={status} showRestart={hasThread} onRestart={() => setConfirm(true)}>
      {confirm && (
        <div className="cp-conf" role="alertdialog" aria-label="Mulai ulang percakapan" style={{ display: 'flex' }}>
          <b>Mulai ulang percakapan?</b>
          <p>Riwayat percakapan dan saran yang belum dipilih akan dihapus. Isian yang sudah terisi di form tetap ada.</p>
          <div className="r">
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => setConfirm(false)}>Batal</button>
            <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={restart}>Mulai ulang</button>
          </div>
        </div>
      )}

      {cp.phase === 'err' && (
        <div className="cp-err" style={{ display: 'flex' }}>
          <span className="ic"><Icon name="warn" size={22} /></span>
          <b>AI Copilot sedang tidak tersedia</b>
          <p>Saran otomatis tidak tersedia karena layanan AI sedang gangguan atau kuota AI organisasi Anda bulan ini sudah habis.</p>
          <span className="hint">Lengkapi isian di form secara manual. Draf tetap tersimpan.</span>
          <div className="r" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => void retry()}>Coba lagi</button>
            {claudeActive() && (
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => { forceMockAi(); void retry(); }}>Pakai mode contoh</button>
            )}
          </div>
        </div>
      )}

      {cp.phase === 'idle' && <EmptyIllustration />}

      {cp.phase === 'rec' && (
        <div className={maxed ? 'cp-listen paused' : 'cp-listen'} style={{ display: 'flex' }}>
          <span className="ring"><Icon name="mic" size={26} /></span>
          <b>{maxed ? 'Rekaman berhenti' : 'Mendengarkan…'}</b>
          <span className="tm"><i className="dot"></i>{maxed ? 'Batas' : 'Merekam'} · {mmss(Math.min(sec, MAX_SEC))}</span>
          <div className="wave" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <i key={i} style={{ animationDelay: `-${(((i * 137) % 90) / 100).toFixed(2)}s` }}></i>
            ))}
          </div>
          <div className="live">
            <span className="lb">Teks dari suara Anda</span>
            <p>{live}<span className="caret"></span></p>
          </div>
          <span className="hint">Ceritakan apa yang terjadi, kapan, di mana, dan dampaknya. Berhenti sejenak juga tidak apa-apa.</span>
        </div>
      )}

      {showProgress && (
        <div className="cp-sum top" aria-label="Progres isian wajib">
          <div className="h"><span>Terisi {pr.filled} dari {pr.total} isian wajib</span><span>{pct}%</span></div>
          <div className="cp-prog" role="progressbar" aria-valuemin={0} aria-valuemax={pr.total} aria-valuenow={pr.filled}><i style={{ width: `${pct}%` }}></i></div>
        </div>
      )}

      {(hasThread || cp.phase === 'weak') && cp.phase !== 'rec' && (
        <div className="cp-th" role="log" aria-live="polite" ref={threadRef} style={{ display: 'flex' }}>
          {cp.messages.map((m, i) => {
            if (m.from === 'me') {
              return (
                <MeMsg key={i} time={i === 0 ? time : undefined}>
                  {m.voice && (
                    <>
                      <div className="cp-vo" style={{ display: 'flex' }}>
                        <span className="pl"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12 }}><path d="M7 4v16l13-8z" fill="currentColor" /></svg></span>
                        <span className="w">{[6, 10, 14, 8, 16, 12, 6, 14, 18, 10, 8, 12, 16, 6, 10, 14, 8, 12].map((h, j) => <i key={j} style={{ height: h }}></i>)}</span>
                        <span className="d">0:12</span>
                      </div>
                      <span className="cp-vt" style={{ display: 'block' }}>Transkrip</span>
                    </>
                  )}
                  {m.text}
                </MeMsg>
              );
            }
            if ('cards' in m) {
              const first = firstCards;
              firstCards = false;
              return <div key={i} style={{ display: 'contents' }}>{renderCards(m, first)}</div>;
            }
            return <AiMsg key={i}>{m.text}</AiMsg>;
          })}

          {cp.phase === 'proc' && (
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
              {cp.weakKind === 'noisy'
                ? 'Suara kurang jelas, jadi saya belum bisa mengisi apa pun. Coba rekam ulang di tempat yang lebih tenang atau ketik cerita Anda.'
                : 'Saya belum menemukan isian dari cerita ini. Bisa ceritakan apa yang terjadi, kapan, dan di mana?'}
              <QuickReplies
                items={
                  cp.weakKind === 'noisy'
                    ? [
                        { label: 'Rekam ulang', onClick: () => { cp.set({ phase: 'idle', weakKind: 'short' }); startRec(); } },
                        { label: 'Ketik saja', onClick: () => cp.set({ phase: 'idle', weakKind: 'short' }) },
                      ]
                    : [
                        { label: 'Tambah cerita', onClick: () => cp.set({ phase: 'idle', messages: [], story: '' }) },
                        { label: 'Isi form manual', onClick: () => cp.set({ phase: 'idle' }) },
                      ]
                }
              />
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
              <QuickReplies items={question.chips.map((c) => ({ label: c.label, pressed: c.pressed, onClick: () => choose(question, c.id) }))} />
            </AiMsg>
          )}

          {finished && !cp.oos && (
            <AiMsg time={time}>
              <b>{pr.filled === pr.total ? 'Semua isian wajib sudah terisi.' : 'Semua isian wajib sudah terisi atau Anda lewati.'}</b> Ringkasannya:
              <dl className="cp-done">
                {summaryOf(draft, cp.skipped).map((r) => (
                  <div key={r.slot}><dt>{r.label}</dt><dd className={r.value === 'Dilewati' ? 'sk' : undefined}>{r.value}</dd></div>
                ))}
              </dl>
              <button type="button" className="cp-big" style={{ display: 'inline-flex', marginTop: 8 }} onClick={reviewForm}>
                <Icon name="check" size={13} />Periksa form
              </button>
            </AiMsg>
          )}
        </div>
      )}

      {mapOpen && (
        <LocationPicker
          initial={{ lat: draft.lat, lng: draft.lng, wk: draft.wk }}
          onClose={() => setMapOpen(false)}
          onPick={(p) => {
            patch({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.wk, patokan: draft.patokan || p.name });
            const st = useCopilotStore.getState();
            st.set({
              messages: [
                ...st.messages,
                { from: 'ai', text: 'Di mana lokasi kejadiannya?' },
                { from: 'me', text: `Titik di peta: ${p.name}` },
                { from: 'ai', text: p.outside ? `Titik ini di luar cakupan WK. WK terkait yang Anda pilih: ${p.wk || '-'}.` : `Titik dipilih. Wilayah kerja terisi otomatis: ${p.wk.replace(/^WK /, '')}.` },
              ],
              // titik baru menggugurkan jawaban pengecekan WK sebelumnya
              flags: { ...st.flags, wk: false },
            });
            setMapOpen(false);
          }}
        />
      )}

      {maxed && (
        <div className="cp-recmax" style={{ display: 'flex' }}>
          <Icon name="warn" size={16} />
          <div>
            <b>Rekaman berhenti di 3 menit.</b> Kirim rekaman ini atau rekam lagi untuk bagian berikutnya.
            <div className="r">
              <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={startRec}>Rekam lagi</button>
              <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => stopRec(true)}>Kirim rekaman</button>
            </div>
          </div>
        </div>
      )}

      {cp.phase === 'rec' && !maxed && (
        <div className="cp-recbar" style={{ display: 'flex' }}>
          <button type="button" className="ib" aria-label="Batalkan rekaman" title="Batalkan rekaman" onClick={() => stopRec(false)}>
            <Icon name="close" size={16} />
          </button>
          <div className="mid">
            <i className="dot"></i><span className="t">{mmss(sec)}</span>
            <div className="sw" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ animationDelay: `-${(((i * 211) % 90) / 100).toFixed(2)}s` }}></i>)}</div>
          </div>
          <button type="button" className="stop" onClick={() => stopRec(true)}><i></i>Selesai</button>
        </div>
      )}

      {micDenied && cp.phase !== 'rec' && (
        <div className="cp-alert" role="alert" style={{ display: 'flex' }}>
          <Icon name="micOff" size={16} />
          <span>Izin mikrofon belum diberikan. Aktifkan di pengaturan browser atau ketik cerita Anda.</span>
        </div>
      )}

      {cp.phase !== 'rec' && cp.phase !== 'err' && (
        <div className="cp-cm" style={{ display: 'grid' }}>
          <textarea
            className="in"
            rows={2}
            aria-label="Ceritakan kejadian"
            placeholder={cp.phase === 'ready' ? 'Ketik jawaban atau tambahan cerita…' : 'Ketik ceritamu di sini…'}
            value={text}
            disabled={cp.phase === 'proc'}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(text);
              }
            }}
            style={{ resize: 'none', width: '100%', font: 'inherit', color: 'var(--ink)', outline: 0 }}
          />
          <button type="button" className="ib" aria-label="Lampirkan foto"><Icon name="attach" size={16} /></button>
          <button type="button" className="ib" aria-label="Rekam suara" title="Rekam suara" onClick={startRec}><Icon name="mic" size={16} /></button>
          <button type="button" className="ib send" aria-label="Kirim" onClick={() => void send(text)} disabled={cp.phase === 'proc'}>
            <Icon name="send" size={16} />
          </button>
        </div>
      )}
    </CopilotFrame>
  );
}
