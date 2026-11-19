// Papan (T35D/T35M/T35R; TLJ-01 P-10, P-10a): empat lajur status, seret-lepas dengan alternatif menu "Pindahkan ke" (WCAG 2.5.7).
// Aturan geser: `boardMoves` (tidak diubah di sini). Dibatalkan tidak punya lajur (lewat filter). Dialog dibuka di halaman detail lewat ?aksi=.
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { FollowUp, FollowUpStatus } from '@/services/types';
import { formatDate, formatDateShort } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { initialsOf } from '@/features/insiden/logic/handling';
import { useDemoStore } from '@/services/mock/store';
import { startFollowUp, TL_NOW, withdrawSubmission } from '@/services/mock/workflow.followup';
import { MOD_TAG, boardMoves, daysLeft, isLate, sourceId, sourceKindOf, type BoardMove } from '../logic/followups';
import { SrcIc } from './SrcIc';

const LANES: { key: FollowUpStatus[]; label: string; status: FollowUpStatus }[] = [
  { key: ['belum-dimulai'], label: 'Belum dimulai', status: 'belum-dimulai' },
  { key: ['berjalan', 'dikembalikan'], label: 'Dikerjakan', status: 'berjalan' },
  { key: ['menunggu-verifikasi'], label: 'Menunggu pemeriksaan', status: 'menunggu-verifikasi' },
  { key: ['selesai'], label: 'Selesai', status: 'selesai' },
];
const MENU_LABEL: Record<string, string> = {
  mulai: 'Dikerjakan', ajukan: 'Menunggu pemeriksaan', tarik: 'Dikerjakan (tarik pengajuan)', setujui: 'Selesai', kembalikan: 'Dikerjakan (kembalikan)',
};
const DROP_HINT: Record<string, string> = {
  mulai: 'Lepas untuk mulai kerjakan', ajukan: 'Lepas untuk ajukan selesai', tarik: 'Lepas untuk tarik pengajuan',
  setujui: 'Lepas untuk menyetujui', kembalikan: 'Lepas untuk kembalikan ke PIC',
};
const LOCKED = 'Hanya PIC atau pemeriksa yang bisa memindahkan kartu ini.';
const GripIc = () => (
  <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }} fill="currentColor" stroke="none">
    {[8, 16].flatMap((x) => [5, 12, 19].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
  </svg>
);

export function TlBoard({ rows, me }: { rows: FollowUp[]; me: string }) {
  const navigate = useNavigate();
  const decide = useDemoStore((s) => s.decide);
  const [menu, setMenu] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [drag, setDrag] = useState<FollowUp | null>(null);
  const [lockedNo, setLockedNo] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout>>();

  const run = (f: FollowUp, m: BoardMove) => {
    setMenu(null);
    if (m.act === 'mulai' || m.act === 'tarik') {
      const r = decide((s) => (m.act === 'mulai' ? startFollowUp(s, f.no, me, TL_NOW) : withdrawSubmission(s, f.no, me, TL_NOW)));
      setMsg(r.ok ? { text: m.act === 'mulai' ? `${f.no} dikerjakan.` : `Pengajuan ${f.no} ditarik.` } : { text: r.reason, err: true });
      return;
    }
    if (m.act === 'ajukan' && f.evidence.length === 0) {
      setMsg({ text: `${f.no} belum punya bukti. Lampirkan bukti di halaman detail sebelum mengajukan selesai.`, err: true });
      return;
    }
    navigate(`/tindak-lanjut/${f.no}?aksi=${m.act}`);
  };
  // Lepas di luar kolom sah: kartu kembali tanpa pesan.
  const drop = (lane: FollowUpStatus) => {
    const f = drag;
    setDrag(null);
    if (!f) return;
    const m = boardMoves(f, me).find((x) => x.to === lane);
    if (m) run(f, m);
  };
  const flashLocked = (no: string) => {
    setLockedNo(no);
    clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setLockedNo(null), 2200);
  };
  // Kartu terangkat: salinan miring dengan bayangan overlay sebagai gambar seret.
  const startDrag = (e: React.DragEvent<HTMLElement>, f: FollowUp) => {
    setMsg(null);
    const el = e.currentTarget;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.classList.add('tl-kb-ghost');
    ghost.style.width = `${el.offsetWidth}px`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 24, 16);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => ghost.remove(), 0);
    setDrag(f);
  };

  return (
    <>
      {msg && <div className={'in-bn ' + (msg.err ? 'err' : 'ok')} role={msg.err ? 'alert' : 'status'} style={{ margin: '0 20px 12px' }}><div className="body">{msg.text}</div></div>}
      <div className="tl-kb" role="group" aria-label="Papan tindak lanjut">
        {LANES.map((lane) => {
          const all = rows.filter((f) => lane.key.includes(f.status));
          const cards = lane.status === 'selesai' && !more ? all.slice(0, 3) : all;
          const mine = all.filter((f) => f.createdBy === me && f.status === 'menunggu-verifikasi').length;
          const dm = drag ? boardMoves(drag, me).find((x) => x.to === lane.status) : undefined;
          const same = drag ? lane.key.includes(drag.status) : false;
          const cls = 'tl-kb-col' + (drag ? (dm ? ' ok' : same ? '' : ' dim') : '');
          return (
            <section
              key={lane.label} className={cls} aria-label={lane.label}
              onDragOver={(e) => { if (dm) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); drop(lane.status); }}
            >
              <div className="tl-kb-head">
                <span className={`p-tag ${MOD_TAG[lane.status]}`}>{lane.label}</span>
                <span className="tl-kb-cnt">{all.length}{mine > 0 && <span className="tl-kb-sub"> · {mine} perlu Anda</span>}</span>
              </div>
              {drag && dm && <span className="tl-kb-drop ok">{DROP_HINT[dm.act]}</span>}
              {drag && !dm && !same && <span className="tl-kb-drop">Tidak bisa dipindah ke sini</span>}
              {cards.map((f) => {
                const moves = boardMoves(f, me);
                const decideCard = f.status === 'menunggu-verifikasi' && f.createdBy === me;
                const late = isLate(f);
                const can = moves.length > 0;
                const kind = sourceKindOf(f);
                return (
                  <article
                    key={f.no}
                    className={'tl-kb-card' + (can ? ' can' : ' ro') + (decideCard ? ' mine' : '') + (drag?.no === f.no ? ' dragging' : '')}
                    aria-label={f.action} draggable={can} title={can ? undefined : LOCKED}
                    onDragStart={can ? (e) => startDrag(e, f) : undefined} onDragEnd={() => setDrag(null)}
                    onMouseDown={can ? undefined : () => flashLocked(f.no)}
                  >
                    {can && (
                      <div className="tl-kb-ctl">
                        <span className="tl-kb-menuwrap">
                          <button type="button" className="p-ibtn ghost tl-kb-more" aria-label={`Aksi ${f.no}`} aria-haspopup="menu" aria-expanded={menu === f.no} onClick={() => setMenu(menu === f.no ? null : f.no)}>⋯</button>
                          {menu === f.no && (
                            <div className="p-pop tl-kb-menu" role="menu">
                              <span className="h">Pindahkan ke</span>
                              {moves.map((m) => (
                                <button key={m.act} type="button" role="menuitem" onClick={() => run(f, m)}>{MENU_LABEL[m.act]}</button>
                              ))}
                              <button type="button" role="menuitem" onClick={() => navigate(`/tindak-lanjut/${f.no}`)}>Buka detail</button>
                            </div>
                          )}
                        </span>
                        <span className="tl-kb-grip" aria-hidden="true"><GripIc /></span>
                      </div>
                    )}
                    <span className="p-mono tl-id">{f.no}</span>
                    <Link to={`/tindak-lanjut/${f.no}`} className="t tl-kb-title">{f.action}</Link>
                    <span className="tl-kb-src"><SrcIc k={kind} size={13} /><span className="p-mono">{sourceId(f)}</span></span>
                    {decideCard && <span className="tl-kb-you">Perlu Anda periksa</span>}
                    {f.status === 'menunggu-verifikasi' && !decideCard && f.pic === me && <span className="tl-kb-you wait">Menunggu pemeriksaan</span>}
                    <div className="ft">
                      <span className="who"><span className="in-av" style={{ width: 20, height: 20, fontSize: 9 }}>{initialsOf(f.pic)}</span><span className="nm">{f.pic}</span></span>
                      {late ? (
                        <span className="tl-due late" title={`Terlambat ${-daysLeft(f)} hari kerja`}><Icon name="alert" size={13} />{-daysLeft(f)} hr</span>
                      ) : (
                        <span className="tl-due" title={`Tenggat ${formatDate(f.dueAt)}`}>{formatDateShort(f.dueAt)}</span>
                      )}
                      <span className="tl-ev" title="Bukti"><Icon name="attach" size={13} />{f.evidence.length}</span>
                    </div>
                    {f.pic === me && f.createdBy !== me && <span className="p-cap tl-kb-chk">Pemeriksa: {f.createdBy}</span>}
                    {lockedNo === f.no && <span className="tl-kb-tip" role="status">{LOCKED}</span>}
                  </article>
                );
              })}
              {lane.status === 'selesai' && all.length > 3 && !more && (
                <button type="button" className="p-link" onClick={() => setMore(true)}>Tampilkan {all.length - 3} lainnya</button>
              )}
              {all.length === 0 && <span className="p-cap" style={{ padding: 8 }}>Belum ada tindak lanjut di sini.</span>}
            </section>
          );
        })}
      </div>
      <div className="tl-kb-legend" role="note" aria-label="Keterangan">
        <b>Keterangan</b>
        <span className="it"><span className="tl-kb-grip on"><GripIc /></span>Bisa Anda seret</span>
        <span className="it"><Icon name="lock" size={14} />Hanya dibaca</span>
        <span className="it"><span className="sw ok" aria-hidden="true" />Bisa dilepas di sini</span>
        <span className="it"><span className="sw dim" aria-hidden="true" />Tidak bisa dilepas di sini</span>
      </div>
    </>
  );
}
