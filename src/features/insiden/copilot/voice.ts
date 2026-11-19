// Transkrip langsung lewat Web Speech API (id-ID). Tidak didukung / izin ditolak → onError (state S20).
interface SpeechRec {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void; stop(): void;
}
type Ctor = new () => SpeechRec;

const ctor = (): Ctor | undefined => {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
export const voiceSupported = () => !!ctor();

export interface Listener {
  /** hentikan dan kembalikan transkrip terakhir */
  stop: () => string;
}

export function startListening(h: { onText: (t: string) => void; onError: () => void }): Listener {
  const Rec = ctor()!;
  const r = new Rec();
  r.lang = 'id-ID';
  r.continuous = true;
  r.interimResults = true;
  let last = '';
  r.onresult = (e) => {
    last = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
    h.onText(last);
  };
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') h.onError();
  };
  try {
    r.start();
  } catch {
    h.onError();
  }
  return { stop: () => { try { r.stop(); } catch { /* sudah berhenti */ } return last; } };
}
