// AI Copilot di form WhatsApp (board I20, I21, I21b): membaca pesan, bukan percakapan bebas. Hanya saran yang di-Pakai/dicek yang masuk form.
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AiMsg, CopilotFrame, MeMsg, QuickReplies } from '@/features/insiden/copilot/parts';
import type { WaDraft, WaMessage } from '@/services/types';
import { pendingChecks } from '../logic/draft';

export function CopilotInput({ onAttach }: { onAttach?: () => void }) {
  return (
    <div className="cp-cm">
      <div className="in">Ketik ceritamu di sini…</div>
      <button type="button" className="ib" aria-label="Lampirkan foto" onClick={onAttach}><Icon name="attach" size={16} /></button>
      <button type="button" className="ib" aria-label="Rekam suara" title="Rekam suara"><Icon name="mic" size={16} /></button>
      <button type="button" className="ib send" aria-label="Kirim"><Icon name="send" size={16} /></button>
    </div>
  );
}

const Ok = ({ children }: { children: ReactNode }) => (
  <li><span className="ok"><Icon name="check" size={13} /></span>{children}</li>
);

/** Satu pertanyaan dengan dua jawaban cepat; jawaban tampil sebagai pesan pengguna. */
function Ask({ text, items, onAnswer }: { text: ReactNode; items: [string, string][]; onAnswer?: (i: number) => void }) {
  const [a, setA] = useState<number | null>(null);
  return (
    <>
      <AiMsg>
        {text}
        {a === null && <QuickReplies items={items.map(([label], i) => ({ label, onClick: () => { setA(i); onAnswer?.(i); } }))} />}
      </AiMsg>
      {a !== null && <MeMsg>{items[a][1]}</MeMsg>}
    </>
  );
}

interface P1 {
  draft: WaDraft;
  message: WaMessage;
  onPickMap: () => void;
}

export function Step1Copilot({ draft, message, onPickMap }: P1) {
  const [n, setN] = useState(0);
  const gagal = draft.aiState === 'gagal';
  const kindPending = pendingChecks(draft, 1).includes('kind');
  return (
    <CopilotFrame key={n} status="Membaca pesan WhatsApp" showRestart onRestart={() => setN(n + 1)}>
      <div className="cp-th" role="log" aria-live="polite">
        {gagal ? (
          <AiMsg time="08:20">Saya belum bisa membaca pesan <b>{message.sender}</b> saat ini. Isian bisa Anda lengkapi manual; waktu pesan sudah terisi otomatis.</AiMsg>
        ) : (
          <AiMsg time="08:20">
            Saya membaca pesan {message.sender} di grup <b>{message.group}</b> dan mengisi isian bertanda AI:
            <ul className="cp-chk">
              <Ok>Waktu kejadian, judul, dan patokan lokasi</Ok>
              {kindPending && (
                <li className="w">
                  <span className="wr"><Icon name="warn" size={12} /></span>
                  <span><b>Jenis laporan</b> Insiden, keyakinan sedang: pesan menyebut “Pompa mati”. Cek sebelum lanjut.</span>
                </li>
              )}
            </ul>
          </AiMsg>
        )}
        <Ask
          text="Pesan tidak membagikan titik lokasi. Peta saya buka di area sumur ADR-07, pilih titik yang tepat."
          items={[['Pilih di peta', 'Saya pilih titiknya di peta.'], ['Tanya pengirim dulu', `Saya tanya ${message.sender} lokasinya dulu.`]]}
          onAnswer={(i) => i === 0 && onPickMap()}
        />
      </div>
      <CopilotInput />
    </CopilotFrame>
  );
}

export function Step2Copilot({ draft, message, onOngoing }: { draft: WaDraft; message: WaMessage; onOngoing: () => void }) {
  const [n, setN] = useState(0);
  const f = draft.form;
  const sugg = draft.aiState === 'ok';
  return (
    <CopilotFrame key={n} status="Membaca pesan WhatsApp" showRestart onRestart={() => setN(n + 1)}>
      <div className="cp-th" role="log" aria-live="polite">
        {sugg ? (
          <>
            <AiMsg time="08:22">
              Dari pesan, saya sarankan <b>{f.category ?? 'kategori'}</b>, yang terdampak <b>Properti atau operasi</b>, dan operasi <b>Berhenti</b>. Semua bertanda AI dan perlu Anda cek.
            </AiMsg>
            <AiMsg time="08:22">
              Pengirim pesan {message.senderRole}, jadi saya tandai <b>{f.handledBy[0] === 'bujp' ? 'BUJP' : 'penangan'}</b> sudah menangani. Keparahan disarankan sistem dari dampak, bukan dari saya. Anda yang memutuskan.
            </AiMsg>
          </>
        ) : (
          <AiMsg time="08:22">Saran dari pesan tidak tersedia. Isi dampak di form; keparahan tetap dihitung sistem dari dampak yang Anda isi.</AiMsg>
        )}
        <Ask
          text="Pesan belum menyebut berapa lama pompa mati. Masih berlangsung?"
          items={[['Masih berlangsung', 'Masih berlangsung.'], ['Sudah menyala lagi', 'Sudah menyala lagi, saya isi durasinya.']]}
          onAnswer={(i) => i === 0 && onOngoing()}
        />
      </div>
      <CopilotInput />
    </CopilotFrame>
  );
}
