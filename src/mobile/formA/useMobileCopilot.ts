// Orkestrasi AI Copilot untuk layar penuh mobile (board MA1b–MA3, MS16, MS17). Perilaku sama dengan CopilotPanel desktop:
// wawancara murni dari copilot/interview.ts (satu pertanyaan per pesan sampai isian wajib terisi atau ditolak), kartu saran dari
// copilot/suggestions.ts, mock `ai.extract`, suara lewat voice.ts, dan hanya saran yang di-Pakai masuk ke draf.
import { useEffect, useRef, useState } from 'react';
import { demoNow } from '@/services/mock/clock';
import { ai } from '@/services/ai';
import type { Extraction } from '@/services/ai/types';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { useCopilotStore, type ThreadItem } from '@/features/insiden/copilot/copilotStore';
import { CARD_SLOT, alreadyFilled, parseTime } from '@/features/insiden/copilot/cardRules';
import {
  answerChip, answerLabel, answerText, localIso, nextQuestion, progress, summaryOf,
  type Answer, type Ctx, type Question, type SlotKey,
} from '@/features/insiden/copilot/interview';
import {
  DEMO_STORY, SUGGESTION_FIELD, applySuggestion, buildAllSuggestions, revertSuggestion,
  type CopilotStep, type Suggestion, type SuggestionKey,
} from '@/features/insiden/copilot/suggestions';
import { startListening, voiceSupported, type Listener } from '@/features/insiden/copilot/voice';

export const MAX_SEC = 180;
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const hhmm = () => demoNow().slice(11, 16);

export function useMobileCopilot(step: CopilotStep) {
  const cp = useCopilotStore();
  const draft = useDraftStore((s) => s.draft);
  const patch = useDraftStore((s) => s.patch);
  const markAi = useDraftStore((s) => s.markAi);
  const [text, setText] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [sec, setSec] = useState(0);
  const [live, setLive] = useState('');
  const listener = useRef<Listener | null>(null);

  const ex = cp.extraction;
  const cards = cp.messages.flatMap((m) => ('cards' in m ? m.cards.map((c) => ({ c, ex: m.ex })) : []));
  const suggestions: Suggestion[] = cards.map(({ c }) => c);
  const stOf = (k: SuggestionKey) => cp.status[k] ?? 'p';
  const left = suggestions.filter((s) => stOf(s.key) === 'p').length;
  const held = cards.filter(({ c }) => stOf(c.key) === 'p').map(({ c }) => CARD_SLOT[c.key]).filter((s): s is SlotKey => !!s);
  const pr = progress(draft, cp.skipped);
  const question: Question | null =
    cp.phase === 'ready' ? nextQuestion({ draft, ex, skipped: [...cp.skipped, ...held], flags: cp.flags, story: cp.story }) : null;
  const finished = cp.phase === 'ready' && !question && left === 0 && pr.open.length === 0;
  const summary = finished ? summaryOf(draft, cp.skipped) : [];
  const ctx = (): Ctx => {
    const st = useCopilotStore.getState();
    return { draft: useDraftStore.getState().draft, ex: st.extraction, skipped: st.skipped, flags: st.flags, story: st.story };
  };

  // timer rekaman, berhenti otomatis di 3 menit
  useEffect(() => {
    if (cp.phase !== 'rec') return;
    const id = setInterval(() => setSec((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [cp.phase]);
  const maxed = cp.phase === 'rec' && sec >= MAX_SEC;
  useEffect(() => () => { listener.current?.stop(); }, []);

  const setStatus = (k: SuggestionKey, v: 'on' | 'off' | null) =>
    useCopilotStore.setState((st) => {
      const next = { ...st.status };
      if (v) next[k] = v;
      else delete next[k];
      return { status: next };
    });
  const setFlag = (f: Partial<Ctx['flags']>) => useCopilotStore.setState((st) => ({ flags: { ...st.flags, ...f } }));
  const exOf = (s: Suggestion): Extraction | null => cards.find(({ c }) => c.key === s.key)?.ex ?? useCopilotStore.getState().extraction;

  const applyOne = (s: Suggestion) => {
    const x = exOf(s);
    if (!x) return;
    const { patch: p, ai: field } = applySuggestion(s.key, x, useDraftStore.getState().draft);
    patch(p);
    markAi(field, true);
    setStatus(s.key, 'on');
    if (s.key === 'trd') setFlag({ axesDone: true });
  };
  const skip = (s: Suggestion) => setStatus(s.key, 'off');
  const undo = (s: Suggestion) => {
    if (stOf(s.key) === 'on') {
      patch(revertSuggestion(s.key));
      markAi(SUGGESTION_FIELD[s.key], false);
      setStatus(s.key, null);
      if (s.key === 'trd') setFlag({ axesDone: false });
    } else {
      applyOne(s);
    }
  };
  const applyAll = () => suggestions.filter((s) => stOf(s.key) === 'p').forEach(applyOne);

  /** Catat jawaban pada percakapan dan isi draf; pertanyaan berikutnya dihitung dari draf yang baru. */
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
    const label = q.slot === 'axes' && id === 'done' ? summaryOf(after, []).find((r) => r.slot === 'axes')?.value || 'Lanjut' : answerLabel(q, id);
    commit(q, a, label);
  };
  /** Titik dipilih di peta. WK di luar cakupan ditanyakan di form mobile, jadi dikosongkan di sini. */
  const pickLocation = (p: { name: string; lat: number; lng: number; wk: string; outside: boolean }) => {
    const d = useDraftStore.getState().draft;
    patch({ locationName: p.name, lat: p.lat, lng: p.lng, wk: p.outside ? '' : p.wk, patokan: d.patokan || p.name });
    const st = useCopilotStore.getState();
    st.set({
      messages: [
        ...st.messages,
        { from: 'ai', text: 'Di mana lokasi kejadiannya?' },
        { from: 'me', text: `Titik di peta: ${p.name}` },
        { from: 'ai', text: p.outside ? 'Titik ini di luar cakupan WK. Pilih wilayah kerjanya di form.' : `Titik dipilih. Wilayah kerja terisi otomatis: ${p.wk.replace(/^WK /, '')}.` },
      ],
      flags: { ...st.flags, wk: false },
    });
    setMapOpen(false);
  };

  const read = async (story: string) => {
    try {
      const result = await ai.extract(story, { now: localIso() });
      const cur = useCopilotStore.getState();
      const seen = new Set(cards.map(({ c }) => c.key));
      const all = buildAllSuggestions(result);
      const d = useDraftStore.getState().draft;
      const fresh = all.filter((s) => !seen.has(s.key) && !cur.status[s.key] && !alreadyFilled(s.key, d));
      const had = seen.size > 0;
      if (all.length === 0 && !had) {
        cur.set({ extraction: result, phase: 'weak' });
        return;
      }
      const note: ThreadItem = fresh.length
        ? {
            from: 'ai', cards: fresh, ex: result,
            text: had ? 'Dari tambahan cerita Anda, ada saran baru:' : 'Terima kasih, cerita Anda sudah saya baca. Ini isian yang bisa saya usulkan. Keparahan tidak saya isi; sistem yang menyarankan dari dampak.',
          }
        : {
            from: 'ai',
            text: had ? 'Saya belum menemukan isian baru dari pesan itu. Silakan pilih jawaban di bawah atau isi langsung di form.' : 'Terima kasih, cerita Anda sudah saya baca. Isian yang bisa saya usulkan sudah terisi di form.',
          };
      cur.set({ extraction: result, phase: 'ready', messages: [...cur.messages, note] });
    } catch {
      useCopilotStore.getState().set({ phase: 'err' });
    }
  };

  const send = async (raw: string, voice = false) => {
    const st = useCopilotStore.getState();
    const typed = raw.trim();
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
    st.set({ phase: 'proc', story, messages: [...st.messages, { from: 'me', text: msg, voice }], oos: false });
    await read(story);
  };

  /** true bila rekaman benar-benar mulai (false = mikrofon tidak tersedia/ditolak → MS17). */
  const startRec = (): boolean => {
    if (!voiceSupported()) {
      setMicDenied(true);
      return false;
    }
    setMicDenied(false);
    setSec(0);
    setLive('');
    useCopilotStore.getState().set({ phase: 'rec' });
    listener.current = startListening({
      onText: setLive,
      onError: () => {
        setMicDenied(true);
        const st = useCopilotStore.getState();
        st.set({ phase: st.messages.length ? 'ready' : 'idle' });
      },
    });
    return true;
  };
  const stopRec = (submit: boolean) => {
    const heard = listener.current?.stop() ?? live;
    listener.current = null;
    if (submit) void send(heard || DEMO_STORY, true);
    else {
      const st = useCopilotStore.getState();
      st.set({ phase: st.messages.length ? 'ready' : 'idle' });
    }
  };
  const restart = () => cp.reset(true);

  const status =
    cp.phase === 'err' ? 'Tidak tersedia saat ini'
      : maxed ? 'Rekaman mencapai batas 3 menit'
      : cp.phase === 'weak' ? 'Menunggu cerita yang lebih lengkap'
      : cp.phase === 'rec' ? 'Sedang mendengarkan cerita Anda'
      : cp.phase === 'proc' ? 'Membaca cerita Anda…'
      : cp.phase === 'idle' ? 'Siap membantu mengisi laporan'
      : `Terisi ${pr.filled} dari ${pr.total} isian wajib`;

  /** Tutup layar AI: dari keadaan gagal kembali ke siap supaya "Isi form manual" tidak menjebak. */
  const dismiss = () => {
    const st = useCopilotStore.getState();
    if (st.phase === 'err') st.set({ phase: st.messages.length ? 'ready' : 'idle' });
    if (st.phase === 'rec') stopRec(false);
  };

  return {
    step, cp, ex, draft, suggestions, stOf, left, pr, question, finished, summary,
    text, setText, micDenied, setMicDenied, sec, live, maxed, mapOpen, setMapOpen,
    applyOne, skip, undo, applyAll, choose, pickLocation, send, startRec, stopRec, restart, status, dismiss,
  };
}
export type MobileCopilot = ReturnType<typeof useMobileCopilot>;
