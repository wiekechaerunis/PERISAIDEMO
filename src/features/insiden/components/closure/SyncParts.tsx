// Bagian penutupan hasil sinkron INS-ADJ + Desain v2 (25 Nov):
// - DecisionSummary: tombol "Ringkasan untuk keputusan" (ADJ-13, P22, P22r), tertutup bawaan, 5 poin; menggantikan panel AI terpisah.
// - ClosureStatusCard: status penutupan sebagai kartu di atas kolom kanan (B-22).
// - DurationRows: Lama penanganan (disetujui → ditutup) dan Total waktu (registrasi → ditutup) (ADJ-10).
// - SelfCloseDialog: peringatan PIC/pemeriksa juga menyetujui penutupan (ADJ-02, ADJ-03), tidak memblokir.
import { useEffect, useRef, useState } from 'react';
import type { Incident } from '@/services/types';
import { formatRupiah } from '@/lib/format';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { closedAtOf, openFollowUps } from '@/services/mock/workflow.closure';
import { detailOf, registeredAt, verifiedEntry } from '../detail/detailLogic';
import { durFull, mismatches, timeShort } from '../../logic/closure';
import { P } from './ClosureBlocks';
import { Ic } from '../review/parts';

/** Waktu insiden disetujui di Pemeriksaan (awal Lama penanganan). */
export const approvedAt = (i: Incident): string | undefined => i.verifiedAt ?? verifiedEntry(i)?.at;
/** Pemeriksa (yang menyetujui di Pemeriksaan). */
export const approvedBy = (i: Incident): string | undefined => i.verifiedBy ?? verifiedEntry(i)?.by;

/** ADJ-10: dua ukuran waktu; `to` = waktu ditutup (atau sekarang untuk perkiraan saat Periksa penutupan). */
export function durations(i: Incident, to: string): { lama: string | null; total: string } {
  const a = approvedAt(i);
  return { lama: a ? durFull(a, to) : null, total: durFull(registeredAt(i), to) };
}

export function DurationRows({ i, to, pending }: { i: Incident; to: string; pending?: boolean }) {
  const d = durations(i, to);
  const cap = pending ? 'sampai sekarang · final saat ditutup' : undefined;
  return (
    <>
      <div className="row">
        <span className="k">Lama penanganan</span>
        <span className="v">{d.lama ?? '—'}</span>
        <span className="c">{cap ?? 'disetujui di Pemeriksaan → ditutup'}</span>
      </div>
      <div className="row">
        <span className="k">Total waktu</span>
        <span className="v">{d.total}</span>
        <span className="c">{cap ?? 'waktu registrasi → ditutup'}</span>
      </div>
    </>
  );
}

/** B-22: Menunggu penutupan → kartu info "Menunggu ditutup"; Ditutup → kartu sukses "Insiden ditutup". */
export function ClosureStatusCard({ i, by, children }: { i: Incident; by?: string; children?: React.ReactNode }) {
  const closed = i.status === 'ditutup';
  const at = closed ? closedAtOf(i) : i.handling?.closure?.requestedAt;
  return (
    <section
      className="p-card in-sec"
      style={{ gap: 8, background: closed ? 'var(--status-success-bg, #EAF6EC)' : 'var(--info-bg, #EAF1FB)' }}
      aria-label={closed ? 'Insiden ditutup' : 'Menunggu ditutup'}
    >
      <h2 className="p-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ic d={closed ? P.check : P.info} size={18} />
        {closed ? 'Insiden ditutup' : 'Menunggu ditutup'}
      </h2>
      <span className="p-cap" style={{ color: 'var(--ink)' }}>
        {closed
          ? `Ditutup ${at ? timeShort(at) : '—'}${i.handling?.closure?.closedBy ? ` oleh ${i.handling.closure.closedBy}` : ''}.`
          : `Diajukan ${i.handling?.closure?.requestedBy ?? i.pic ?? 'PIC'}${at ? ` · ${timeShort(at)}` : ''}${by ? ` · menunggu ${by}` : ''}.`}
      </span>
      {children}
    </section>
  );
}

/** ADJ-13: "Ringkasan untuk keputusan" (5 poin, dibuka atas permintaan). Tanpa rekomendasi tutup/kembalikan. */
export function DecisionSummary({ i, onLook }: { i: Incident; onLook?: (what: 'dp' | 'tl' | 'rw') => void }) {
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState<'ya' | 'tidak' | null>(null);
  const fus = useFollowUps();
  const c = i.handling?.closure;
  const d = detailOf(i);
  const mis = mismatches(i);
  const running = openFollowUps(i, fus);
  const est = d.lossIdr;
  const fin = c?.lossFinalIdr ?? null;
  const pct = est && fin != null ? Math.round(((fin - est) / est) * 100) : null;
  const restored = c?.restoredAt ?? c?.aiRestoredAt;
  const occurredH = restored ? Math.round((new Date(restored + 'Z').getTime() - new Date(i.occurredAt + 'Z').getTime()) / 3_600_000) : null;
  const opsGap = d.opsHours && occurredH !== null && occurredH > d.opsHours * 2;
  const selfChecked = (i.handling?.followUps ?? []).filter((f) => f.status === 'selesai' && f.owner === i.pic);
  const checks: { text: string; look: 'dp' | 'tl' | 'rw' }[] = [
    ...mis.map((m) => ({ text: `${m.claim} disebut di Data penutupan, tetapi tindak lanjut “${m.followUp}” masih ${m.status}.`, look: 'tl' as const })),
    ...selfChecked.map((f) => ({ text: `Tindak lanjut “${f.title}” selesai dan diperiksa oleh PIC-nya sendiri.`, look: 'tl' as const })),
    ...(opsGap ? [{ text: `Laporan menulis operasi berhenti ${d.opsHours} jam, tetapi operasi baru pulih ${timeShort(restored!)} (±${occurredH} jam sejak kejadian).`, look: 'dp' as const }] : []),
  ];
  const steps = (c?.aiSteps ?? []).map((s) => s.text);
  return (
    <section className="p-card in-sec" aria-label="Ringkasan untuk keputusan">
      <button type="button" className="p-ai" aria-expanded={open} onClick={() => setOpen(!open)} style={{ alignSelf: 'flex-start' }}>
        <Ic d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" size={15} />
        <span className="lbl">Ringkasan untuk keputusan</span>
        <span className="p-tag t-info" style={{ height: 18, fontSize: 11 }}>AI</span>
      </button>
      {open && (
        <dl className="lk-kv1" style={{ gridTemplateColumns: '170px minmax(0, 1fr)' }}>
          <dt>Kejadian</dt>
          <dd>{(d.story || d.securityImpact || i.title).split('. ')[0].replace(/\.$/, '')} · {timeShort(i.occurredAt)}.</dd>
          <dt>Yang dilakukan</dt>
          <dd>
            {steps.length ? steps.join(' ') : (c?.summary ?? c?.outcome ?? 'Belum ada catatan penanganan.')}
            {c?.evidence?.length ? ` Bukti: ${c.evidence.map((e) => e.caption || e.name).join(', ')}.` : ''}{' '}
            <button type="button" className="lk-alink" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 12 }} onClick={() => onLook?.('rw')}>Lihat jejak</button>
          </dd>
          <dt>Dampak akhir</dt>
          <dd>
            {[
              fin != null ? `Kerugian ${formatRupiah(fin)}${pct ? ` (${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}%)` : ''}` : 'Kerugian akhir belum diisi',
              c?.lpo?.choice === 'ada' && c.lpo.volumeBbl ? `produksi hilang ${c.lpo.volumeBbl} bbl` : null,
              restored ? `operasi pulih ${timeShort(restored)}` : null,
              c?.legal ? `proses hukum: ${c.legal.status === 'dilaporkan' ? 'dilaporkan ke polisi' : c.legal.status}` : null,
            ].filter(Boolean).join(' · ')}
          </dd>
          <dt>Masih berjalan setelah ditutup</dt>
          <dd>{running.length ? running.map((f) => `${f.title} (${f.status === 'dikerjakan' ? 'Dikerjakan' : 'Belum dimulai'})`).join(' · ') : 'Tidak ada tindak lanjut yang berjalan.'}</dd>
          <dt>Perlu dicek · {checks.length}</dt>
          <dd>
            {checks.length === 0 ? (
              'Tidak ada yang perlu dicek'
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {checks.map((x) => (
                  <li key={x.text}>
                    {x.text}{' '}
                    <button type="button" className="lk-alink" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 12 }} onClick={() => onLook?.(x.look)}>Lihat</button>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </dl>
      )}
      {open && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="p-cap">Dibuat AI dari laporan, hasil penanganan, dan Riwayat. Cocokkan dengan bukti.</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="p-cap">Membantu?</span>
            <button type="button" className="p-chip" aria-pressed={vote === 'ya'} onClick={() => setVote('ya')}>Ya</button>
            <button type="button" className="p-chip" aria-pressed={vote === 'tidak'} onClick={() => setVote('tidak')}>Tidak</button>
          </span>
        </div>
      )}
    </section>
  );
}

/** ADJ-02 + ADJ-03: satu dialog yang menyebut kondisi yang berlaku; tidak memblokir. */
export function selfCloseReasons(i: Incident, by: string): { pic: boolean; reviewer: boolean } {
  return { pic: i.pic === by, reviewer: approvedBy(i) === by };
}
export function selfCloseTitle(r: { pic: boolean; reviewer: boolean }): string {
  if (r.pic && r.reviewer) return 'Anda PIC insiden ini dan juga memeriksa laporannya. Tetap tutup?';
  return r.pic ? 'Anda PIC insiden ini. Tetap tutup?' : 'Anda juga memeriksa laporan ini. Tetap tutup?';
}
/** Teks Riwayat untuk penutupan oleh orang yang sama. */
export function selfCloseNote(r: { pic: boolean; reviewer: boolean }): string {
  return [r.pic ? 'ditutup sendiri' : null, r.reviewer ? 'diperiksa dan ditutup orang yang sama' : null].filter(Boolean).join('; ');
}

export function SelfCloseDialog({ reasons, onCancel, onContinue }: { reasons: { pic: boolean; reviewer: boolean }; onCancel: () => void; onContinue: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  return (
    <>
      <div className="in-scrim" onClick={onCancel}></div>
      <div className="in-dlg" role="alertdialog" aria-modal="true" aria-labelledby="sc-t">
        <div className="p-dialog">
          <div className="dh"><h3 id="sc-t">{selfCloseTitle(reasons)}</h3></div>
          <div className="db">
            <span>
              Penyetuju sebaiknya orang yang berbeda. Sistem tidak memblokir; bila dilanjutkan, Riwayat dan Jejak audit mencatat “
              {selfCloseNote(reasons)}”.
            </span>
          </div>
          <div className="df">
            <button type="button" className="p-btn p-btn-secondary" ref={ref} onClick={onCancel}>Batal</button>
            <button type="button" className="p-btn p-btn-primary" onClick={onContinue}>Tetap tutup</button>
          </div>
        </div>
      </div>
    </>
  );
}
