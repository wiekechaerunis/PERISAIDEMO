// Tab Pesan masuk (papan V2-01..06b): kartu tabel "Pesan tertangkap", segmen cepat, filter, pilih beberapa, empty state.
// K2: tidak ada saran AI. K3: aksi per pesan ada di halaman Detail pesan; di sini hanya Tandai tidak relevan massal.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { canProcessWa } from '@/lib/rbac';
import { useDemoStore } from '@/services/mock/store';
import type { WaMessage } from '@/services/types';
import { IrrelevantDialog } from '../../IrrelevantDialog';
import { StatusTags } from '../../MessageCard';
import { Ic } from '../nomor/icons';
import { FilterPopover } from './FilterPopover';
import { V2Toast, type PesanToast } from './V2Toast';
import { NO_FILTER, QUICKS, isPriority, matches, shortWib, statusOf, type Filters, type Quick } from './util';

const PHONE = 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2';
const CHAT = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';
const CLIP = 'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48';

const EMPTY: Record<Quick, { h: string; p?: string }> = {
  Semua: { h: 'Belum ada pesan yang tertangkap.' },
  Prioritas: { h: 'Belum ada pesan prioritas.', p: 'Pesan prioritas muncul bila pesan cocok dengan aturan yang ditandai Prioritas.' },
  'Perlu ditinjau': { h: 'Tidak ada pesan yang perlu ditinjau.' },
  'Tidak relevan': { h: 'Belum ada pesan tidak relevan.' },
};

function EmptyArt() {
  return (
    <svg className="pr-il" viewBox="0 0 200 140" width="120" height="84" aria-hidden="true" focusable="false">
      <ellipse className="gr" cx="100" cy="124" rx="70" ry="8"></ellipse>
      <rect className="pa ln" x="46" y="34" width="88" height="84" rx="8"></rect>
      <rect className="so" x="58" y="48" width="64" height="8" rx="4"></rect>
      <rect className="so" x="58" y="64" width="64" height="8" rx="4"></rect>
      <rect className="so" x="58" y="80" width="40" height="8" rx="4"></rect>
      <path className="ln" d="M140 18v66"></path>
      <path className="at ln" d="M140 20h34l-9 13 9 13h-34z"></path>
    </svg>
  );
}

export function InboxView({ manage }: { manage: boolean }) {
  const role = useDemoStore((s) => s.role);
  const messages = useDemoStore((s) => s.waMessages);
  const groups = useDemoStore((s) => s.waGroups ?? []);
  const rules = useDemoStore((s) => s.waRules ?? []);
  const numbers = useDemoStore((s) => s.waNumbers ?? []);
  const can = canProcessWa(role);
  const [quick, setQuick] = useState<Quick>('Semua');
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>(NO_FILTER);
  const [size, setSize] = useState(25);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [dlg, setDlg] = useState(false);
  const [toast, setToast] = useState<PesanToast | null>(null);

  const lk = useMemo(() => ({ groupTag: (id?: string) => groups.find((g) => g.id === id)?.wk }), [groups]);
  const base = useMemo(() => messages.filter((m) => matches(m, q, f, 'Semua', lk)), [messages, q, f, lk]);
  const count = (k: Quick) => base.filter((m) => (k === 'Semua' ? true : k === 'Prioritas' ? isPriority(m) : statusOf(m) === k)).length;
  const list = useMemo(
    () => base
      .filter((m) => matches(m, '', NO_FILTER, quick, lk))
      .sort((a, b) => Number(isPriority(b)) - Number(isPriority(a)) || b.at.localeCompare(a.at)),
    [base, quick, lk],
  );
  const pages = Math.max(1, Math.ceil(list.length / size));
  const cur = Math.min(page, pages - 1);
  const rows = list.slice(cur * size, cur * size + size);
  const pickedMsgs = messages.filter((m) => picked.includes(m.id));
  const allOn = rows.length > 0 && rows.every((m) => picked.includes(m.id));
  const filtering = !!q.trim() || JSON.stringify(f) !== JSON.stringify(NO_FILTER);
  const reset = () => { setQ(''); setF(NO_FILTER); setPage(0); };
  const pick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? id;
  const numberOf = (m: WaMessage) => numbers.find((n) => n.id === m.numberId)?.label;

  return (
    <div className="pr-page pr-stack wa-scope">
      <section className="pr-tcard">
        <div className="pr-tcard__bar">
          <h2>Pesan tertangkap</h2>
          <div className="pr-tcard__tools">
            <div className="pr-search" role="search">
              <Ic d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />
              <input type="search" placeholder="Cari isi, pengirim, atau grup" aria-label="Cari isi, pengirim, atau grup" className="pr-input pr-input--sm" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            </div>
            <FilterPopover applied={f} onApply={(x) => { setF(x); setPage(0); }} numbers={numbers} groups={groups} rules={rules} messages={messages} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div role="radiogroup" aria-label="Tampilkan pesan" className="pr-quick">
            {QUICKS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={quick === k} tabIndex={quick === k ? 0 : -1} onClick={() => { setQuick(k); setPage(0); }}>
                {k}
                {k !== 'Semua' && <span className={'pr-quick__count' + (k === 'Prioritas' && count(k) > 0 ? ' pr-quick__count--late' : '')}>{count(k)}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="pr-table-scroll">
          {list.length === 0 ? (
            <div className="pr-empty">
              <EmptyArt />
              <h3>{filtering ? 'Tidak ada pesan yang cocok dengan filter.' : EMPTY[quick].h}</h3>
              {!filtering && EMPTY[quick].p && <p>{EMPTY[quick].p}</p>}
              {filtering
                ? <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={reset}>Hapus filter</button>
                : quick === 'Prioritas' && manage && <Link className="pr-btn pr-btn--secondary pr-btn--md" to="/pemantauan-whatsapp?tab=aturan">Lihat aturan pemantauan</Link>}
            </div>
          ) : (
            <>
              {can && picked.length > 0 && (
                <div className="wa-selbar" role="region" aria-label="Tindakan untuk pesan dipilih">
                  <span className="wa-selbar__count" aria-live="polite">{picked.length} pesan dipilih</span>
                  <div className="wa-selbar__acts">
                    <button type="button" className="pr-btn pr-btn--secondary pr-btn--sm" onClick={() => setDlg(true)}>Tandai tidak relevan</button>
                    <button type="button" className="pr-btn pr-btn--link" onClick={() => setPicked([])}>Batal pilih</button>
                  </div>
                </div>
              )}
              <table className="pr-table wa-inbox">
                <thead>
                  <tr>
                    {can && <th className="wa-selcol"><input type="checkbox" className="pr-check" aria-label="Pilih semua pesan di halaman ini" checked={allOn} onChange={() => setPicked(allOn ? picked.filter((id) => !rows.some((m) => m.id === id)) : Array.from(new Set([...picked, ...rows.map((m) => m.id)])))} /></th>}
                    <th>Pesan</th><th>Status</th><th>Grup</th><th>Dikirim</th><th>Aturan</th><th className="text-right v2-isi-h">Isi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const on = picked.includes(m.id);
                    return (
                      <tr key={m.id} className={[m.status === 'tidak-relevan' ? 'v2-dim' : '', on ? 'wa-picked' : ''].join(' ').trim() || undefined}>
                        {can && <td className="wa-selcol"><input type="checkbox" className="pr-check" aria-label={`Pilih pesan: ${m.text}`} checked={on} onChange={() => pick(m.id)} /></td>}
                        <td className="max-w-[380px]">
                          <Link className="pr-row-title block truncate hover:underline" to={`/insiden/wa/pesan/${m.id}`}>{m.text}</Link>
                          <span className="pr-row-sub">{m.sender}</span>
                        </td>
                        <td><StatusTags m={m} /></td>
                        <td>{m.group}{numberOf(m) && <span className="pr-row-sub v2-no"><Ic d={PHONE} size={12} />{numberOf(m)}</span>}</td>
                        <td className="whitespace-nowrap">{shortWib(m.at)}</td>
                        <td><span className="v2-chips">{(m.ruleIds ?? []).map((id) => <span className="v2-chip" key={id}>{ruleName(id)}</span>)}</span></td>
                        <td className="v2-isi">
                          <span className="v2-isi-l">
                            <span className="v2-isi-i"><Ic d={CHAT} size={12} />{1 + (m.bubbles?.length ?? 0)} pesan</span>
                            {m.photos.length > 0 && <span className="v2-isi-i"><Ic d={CLIP} size={12} />{m.photos.length} berkas</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
        {list.length > 0 && (
          <div className="pr-pager">
            <div className="pr-pager__size">
              <label htmlFor="wa-size">Tampilkan</label>
              <select id="wa-size" className="pr-input pr-input--sm" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="pr-pager__per">per halaman</span>
              <span aria-live="polite"><b>{cur * size + 1}–{cur * size + rows.length}</b> dari {list.length}</span>
            </div>
            {pages > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="pr-btn pr-btn--secondary pr-btn--sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Sebelumnya</button>
                <button type="button" className="pr-btn pr-btn--secondary pr-btn--sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Berikutnya</button>
              </div>
            )}
          </div>
        )}
      </section>
      {dlg && (
        <IrrelevantDialog
          messages={pickedMsgs} onClose={() => setDlg(false)}
          onDone={(done, errors) => {
            setPicked([]);
            setToast(errors.length ? { text: `${done} pesan ditandai tidak relevan. ${errors[0]}`, err: true } : { text: done > 1 ? `${done} pesan ditandai tidak relevan.` : 'Pesan ditandai tidak relevan.' });
          }}
        />
      )}
      <V2Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
