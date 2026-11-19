// Layar permintaan penutupan (P22): kartu Bahan pertimbangan AI dan kartu keputusan "Butuh keputusan penutupan dari Anda".
import { useState } from 'react';
import type { Incident } from '@/services/types';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { formatWib } from '@/lib/format';
import { Ic, SelectField } from '../review/parts';
import { detailOf } from '../detail/detailLogic';
import {
  CONTRACT_OPTIONS, closureFilled, dueRemaining, mismatches, riwayat, strip, timeShort, whatHappened, reviewDeadline,
} from '../../logic/closure';
import { openFollowUps } from '@/services/mock/workflow.closure';
import { P } from './ClosureBlocks';

type Hl = 'dp' | 'bk' | 'rg' | 'tl' | null;

const Tile = () => <span className="tile"><Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" size={18} /></span>;

export function BriefCard({ i, hl, setHl, onAudit }: { i: Incident; hl: Hl; setHl: (h: Hl) => void; onAudit: () => void }) {
  const c = i.handling?.closure;
  const [open, setOpen] = useState<number | null>(null);
  const set = (k: Exclude<Hl, null>) => () => setHl(hl === k ? null : k);
  const fus = useFollowUps();
  const st = strip(i, fus);
  const mis = mismatches(i);
  const rw = riwayat(i);
  const entries = [...(i.timeline ?? []), ...(i.handling?.notes ?? [])];
  const steps = (c?.aiSteps ?? [...(i.handling?.notes ?? [])].sort((a, b) => (a.at > b.at ? 1 : -1)).slice(-3).map((n) => ({ at: n.at, text: n.text, source: 'Catatan PIC', orig: undefined as string | undefined }))).map((s) => {
    const src = entries.find((e) => e.at === s.at);
    const files = i.handling?.noteFiles?.[s.at] ?? [];
    return { ...s, orig: s.orig ?? `Isi asli: "${src?.text ?? s.text}"${files.length ? ` + ${files.join(', ')}` : ''} ·` };
  });
  const d = detailOf(i);
  void d;
  const chip = (k: Exclude<Hl, null>, label: string, path: string) => (
    <button type="button" aria-pressed={hl === k} onClick={set(k)}><Ic d={path} size={13} />{label}</button>
  );
  return (
    <section className="p-card in-sec rcv" aria-label="Bahan pertimbangan penutupan">
      <div className="rcv-hd">
        <Tile />
        <div className="t">
          <h2 className="in-h">Bahan pertimbangan dari {steps.length} langkah penanganan <span className="p-tag t-info" style={{ height: 20, fontSize: 11, marginLeft: 6, verticalAlign: 2 }}>AI</span></h2>
          <span className="p-cap">Disusun dari laporan, data penutupan, dan riwayat. Cocokkan dengan bukti sebelum memutuskan.</span>
          <span className="chip">Laporan awal · Data penutupan · Riwayat {rw.length} entri</span>
        </div>
      </div>
      <div className="rcv-strip">
        {st.map((x) => (
          <div className="it" key={x.k} title={x.title}>
            <span className="k">{x.k}</span><b>{x.v}</b>
            <span className="n">{x.check ? <b className="ck">{x.n}</b> : x.n}</span>
          </div>
        ))}
      </div>
      <div className="cl-what"><span className="k">Apa yang terjadi <span className="p-cap" style={{ fontWeight: 500 }}>· dari laporan pelapor, {timeShort(i.occurredAt).replace(',', '')}</span></span>{whatHappened(i)}</div>
      <div>
        <span className="cl-tlh">Yang sudah dilakukan <span className="p-cap" style={{ fontWeight: 500 }}>· urut dari awal · dari Riwayat dan tindak lanjut selesai</span></span>
        <ol className="cl-tl">
          {steps.map((x, n) => (
            <li key={x.at}>
              <span className="dot">{n + 1}</span>
              <button type="button" aria-pressed={open === n} onClick={() => setOpen(open === n ? null : n)}>
                <span className="w">{timeShort(x.at)} · <b className="srcl">{x.source}</b></span>
                <span className="t">{x.text}</span>
                <span className="src" style={{ display: open === n ? 'flex' : 'none' }}>{x.orig} <a href="#audit" onClick={(e) => { e.preventDefault(); onAudit(); }}>Lihat di Riwayat</a></span>
              </button>
            </li>
          ))}
        </ol>
        <a href="#audit" className="cl-all" onClick={(e) => { e.preventDefault(); onAudit(); }}>Lihat semua di Riwayat ({rw.length}) →</a>
      </div>
      {mis.map((m) => (
        <div className="cl-mis" key={m.claim}>
          <span className="wr"><Ic d="M12 9v4M12 17h.01" size={12} /></span>
          <div>
            <span className="k">Belum cocok · perlu dicek</span>
            Data penutupan menyebut <b>{m.claim}</b>, tetapi tindak lanjut “{m.followUp.replace(/\s+di\s+.+$/, '')}” masih <b>{m.status}</b> dan belum ada catatan di Riwayat.
            <span className="ln"><button type="button" onClick={set('dp')}>Lihat Data penutupan</button><button type="button" onClick={set('tl')}>Lihat tindak lanjut</button></span>
          </div>
        </div>
      ))}
      <div className="cl-chips">
        <span className="p-cap" style={{ alignSelf: 'center', marginRight: 2 }}>Cek cepat:</span>
        {chip('bk', 'Cek bukti', P.clip)}
        {chip('rg', 'Bandingkan kerugian', 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6')}
        {chip('tl', 'Lihat tindak lanjut', P.list)}
      </div>
      <div className="rcv-ft">
        <span className="fw"><Ic d={P.check} size={14} /><span>Ringkasan AI dari isian di halaman ini. Isi aslinya ada di Data penutupan, Tindak lanjut, Isi laporan &amp; lampiran, dan Riwayat.</span></span>
        <span className="fb"><span className="p-cap">Membantu?</span>
          <button type="button" className="ib" aria-label="Membantu"><Ic d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.4 22H7V10l4-8a3 3 0 0 1 4 3.9z" size={15} /></button>
          <button type="button" className="ib" aria-label="Tidak membantu"><Ic d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.6 2H17v12l-4 8a3 3 0 0 1-4-3.9z" size={15} /></button>
        </span>
        <button type="button" className="p-ibtn ghost" aria-label="Ciutkan" style={{ width: 30, height: 30 }}><Ic d="m18 15-6-6-6 6" size={16} /></button>
      </div>
    </section>
  );
}

const Ready = ({ pressed, onClick, icon, cls, title, sub }: { pressed: boolean; onClick: () => void; icon: string; cls: 'ok' | 'nt' | 'wr'; title: React.ReactNode; sub: string }) => (
  <button type="button" aria-pressed={pressed} onClick={onClick}>
    <span className={cls}><Ic d={icon} size={11} /></span>
    <span className="tx">{title}<span className="s">{sub}</span></span>
    <span className="go">Lihat</span>
  </button>
);

export function DecisionPanel({ i, now, hl, setHl, contracts, onContracts, note, onNote, onReturn, onClose, grupFrom }: {
  i: Incident; now: string; hl: Hl; setHl: (h: Hl) => void; contracts: { partner: string; ref: string }[];
  onContracts: (c: { partner: string; ref: string }[]) => void; note: string; onNote: (v: string) => void; onReturn: () => void; onClose: () => void; grupFrom?: string;
}) {
  const c = i.handling?.closure;
  const fill = closureFilled(i);
  const set = (k: Exclude<Hl, null>) => () => setHl(hl === k ? null : k);
  const fus = useFollowUps();
  const open = openFollowUps(i, fus);
  const mis = mismatches(i);
  const asked = c?.requestedAt ?? now;
  const due = i.handleDueAt;
  const rem = due ? dueRemaining(due, asked) : null;
  const ev = c?.evidence ?? [];
  return (
    <section className="p-card in-warn-card" style={{ padding: 20, background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
      <div className="cl-dec">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}><Ic d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={15} /></span>
          <h2 className="p-h2">Butuh keputusan penutupan dari Anda</h2>
        </div>
        <div className="meta">
          <span className="r"><Ic d={P.person} size={13} /><span>Diajukan <b>{c?.requestedBy ?? i.pic ?? 'PIC'}</b>{grupFrom ? `, diambil alih dari ${grupFrom}` : ''} · {formatWib(asked)} WIB</span></span>
          <span className="r"><Ic d={P.clock} size={13} /><span>Batas tinjau <b>{formatWib(reviewDeadline(asked))} WIB</b> · 2 hari kerja</span></span>
          {due && rem && <span className="r" style={{ paddingLeft: 19 }}>Tenggat penanganan {formatWib(due).replace(/ 20\d\d,/, ',')} · {rem.text} · {i.escalated ? 'dieskalasi' : 'belum dieskalasi'}</span>}
        </div>
        <div className="cl-ready">
          <span className="hd">Kesiapan penutupan</span>
          <Ready pressed={hl === 'dp'} onClick={set('dp')} icon={P.check} cls="ok" title="Data penutupan lengkap" sub={`${fill.done} dari ${fill.total} isian wajib terisi`} />
          <Ready pressed={hl === 'bk'} onClick={set('bk')} icon={P.check} cls="ok" title="Bukti terlampir" sub={`${ev.length} file: ${ev.map((e) => e.caption || e.name).join(', ').toLowerCase()}`} />
          {open.length > 0 && <Ready pressed={hl === 'tl'} onClick={set('tl')} icon={P.clock} cls="nt" title={`${open.length} tindak lanjut masih berjalan`} sub="Tidak menghalangi penutupan; tetap dipantau sampai selesai" />}
          {mis.length > 0 && (
            <button type="button" aria-pressed={hl === 'tl'} onClick={set('tl')}>
              <span className="wr"><Ic d="M12 9v4M12 17h.01" size={11} /></span>
              <span className="tx">{mis.length} klaim belum cocok dengan tindak lanjut<span className="p-tag t-info" style={{ height: 18, fontSize: 10, marginLeft: 6, verticalAlign: 1 }}>AI</span>
                <span className="s">Gembok disebut sudah diganti, tindak lanjutnya masih {mis[0].status} · perlu dicek</span></span>
              <span className="go">Lihat</span>
            </button>
          )}
        </div>
        {contracts.length > 0 && (
          <div className="p-field">
            <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kontrak mitra yang terlibat<span className="p-req">*</span></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contracts.map((k, n) => (
                <SelectField
                  key={k.partner} label={null} ariaLabel={`Kontrak ${k.partner}`} selected={k.ref} placeholder={!k.ref}
                  display={k.ref ? <>{k.partner} · <span className="p-mono" style={{ fontSize: 12 }}>{k.ref}</span></> : `Pilih kontrak ${k.partner}`}
                  options={(CONTRACT_OPTIONS[k.partner] ?? [k.ref]).filter(Boolean).map((r) => ({ key: r, label: r }))}
                  onPick={(r) => onContracts(contracts.map((x, m) => (m === n ? { ...x, ref: r } : x)))}
                />
              ))}
            </div>
            <span className="p-help">Diisi awal dari kontrak aktif di WK ini untuk tiap mitra di Tim terlibat. Disimpan untuk penautan ke BUJP dan Monev nanti.</span>
          </div>
        )}
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Catatan penutupan <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
          <textarea className="p-input p-area" aria-label="Catatan penutupan" value={note} onChange={(e) => onNote(e.target.value)} placeholder="mis. Pastikan patroli tambahan tetap jalan sampai 12 Nov." style={{ minHeight: 64, background: 'var(--surface)' }} />
        </div>
        <div className="cl-acts">
          <button type="button" className="p-btn p-btn-secondary" style={{ background: 'var(--surface)' }} onClick={onReturn}><Ic d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1" size={16} />Kembalikan ke PIC</button>
          <button type="button" className="p-btn p-btn-primary" onClick={onClose}><Ic d={P.check} size={16} />Tutup insiden</button>
        </div>
        <p className="p-cap" style={{ margin: 0, textAlign: 'right' }}>Keputusan dicatat di jejak audit atas nama Anda. Insiden yang ditutup ikut dipakai untuk memperbarui prakiraan.</p>
      </div>
    </section>
  );
}
