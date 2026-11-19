// Pemantauan WhatsApp (ala demo): kotak masuk pesan sitrep grup pengamanan. Pilih pesan → Jadikan draf laporan (INS-05, IF2) atau Tautkan ke insiden (I24).
// Tidak ada board untuk daftar ini; markup memakai kartu + `in-wa` dari board I23/I24. ASSUMPTION: pola daftar demo, bukan layar produk.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { formatWibFull } from '@/lib/format';
import { canCreateReport } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import type { WaMessage } from '@/services/types';
import { activeLink } from '@/services/mock/workflow.wa';
import { MessageCard, STATUS_WA } from '../components/MessageCard';
import { useStartDraft } from '../logic/startDraft';

const FILTERS = ['Semua', 'Baru', 'Draf', 'Diproses'] as const;
type Filter = (typeof FILTERS)[number];

export function WaInboxPage() {
  const role = useDemoStore((s) => s.role);
  const messages = useDemoStore((s) => s.waMessages);
  const { busy, error, start } = useStartDraft();
  const [f, setF] = useState<Filter>('Semua');
  const list = [...messages].sort((a, b) => b.at.localeCompare(a.at)).filter((m) => f === 'Semua' || STATUS_WA[m.status].label === f);
  const can = canCreateReport(role);
  const count = (k: Filter) => messages.filter((m) => k === 'Semua' || STATUS_WA[m.status].label === k).length;

  return (
    <AppShell nav="whatsapp" title="Pemantauan WhatsApp" subtitle="Pesan sitrep dari grup pengamanan yang tertangkap PERISAI.">
      <section className="p-card in-sec">
        <h2 className="in-h">Kotak masuk · {messages.length} pesan</h2>
        <div className="in-rf" role="radiogroup" aria-label="Saring pesan">
          {FILTERS.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => setF(k)}>{k} · {count(k)}</button>
          ))}
        </div>
        {error && <div className="in-bn err" role="alert"><div className="body">{error}</div></div>}
        <div className="wa-list">
          {list.length === 0 && <span className="p-cap">Tidak ada pesan.</span>}
          {list.map((m) => (
            <MessageCard key={m.id} m={m}>
              <Actions m={m} can={can} busy={busy === m.id} onStart={() => void start(m)} />
            </MessageCard>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Actions({ m, can, busy, onStart }: { m: WaMessage; can: boolean; busy: boolean; onStart: () => void }) {
  const link = activeLink(m);
  return (
    <div className="wa-acts">
      {m.status === 'baru' && can && (
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={onStart} disabled={busy} aria-label={`Jadikan draf laporan: ${m.sender}, ${m.at.slice(11, 16)}`}>
          {busy ? 'Membaca pesan…' : 'Jadikan draf laporan'}
        </button>
      )}
      {m.status === 'draf' && can && (
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={onStart} aria-label={`Lanjutkan draf: ${m.sender}, ${m.at.slice(11, 16)}`}>Lanjutkan draf</button>
      )}
      <Link to={`/insiden/wa/pesan/${m.id}`} className="p-btn p-btn-secondary p-btn-sm" aria-label={`Detail pesan ${m.sender}, ${m.at.slice(11, 16)}`}>
        {m.status === 'baru' && can ? 'Tautkan ke insiden' : 'Detail pesan'}
      </Link>
      {link && (
        <span className="p-cap">
          {link.kind === 'laporan' ? 'Dijadikan laporan ' : 'Ditautkan ke '}
          <Link to={`/insiden/${link.incidentNo}`} className="lk-alink">{link.incidentNo}</Link> · {formatWibFull(link.at)}
        </span>
      )}
    </div>
  );
}
