// Dialog layar Pejabat insiden berjalan: P23 Tutup, P25 Kembalikan ke PIC, P26 Ganti PIC, P27/PS10 Ubah tenggat, P28 Buka kembali, PS7.
import { DateField } from '@/components/ui/DateField';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Incident } from '@/services/types';
import { useFollowUps } from '@/features/tindak-lanjut/logic/useFollowUps';
import { PIC_GROUPS, PIC_PEOPLE } from '@/services/mock/workflow';
import { dueErrors } from '@/services/mock/workflow.closure';
import { formatDate, formatRupiah, formatWibFull } from '@/lib/format';
import { initials } from '@/lib/rbac';
import { SEV_LABEL, isHighOrCritical } from '@/lib/severity';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '../review/ReviewDialogs';
import { Ic, SelectField } from '../review/parts';
import { MOD_LABEL, MOD_TAG } from '@/features/tindak-lanjut/logic/followups';
import { partnerLabel, reopenLimitText, FU_LABEL, FU_TAG } from '../../logic/closure';
import { formatDuration, registeredAt } from '../detail/detailLogic';
import { openFollowUps } from '@/services/mock/workflow.closure';

const MAX = 500;
const Btn = ({ children, onClick, kind = 'secondary', disabled }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary'; disabled?: boolean }) => (
  <button type="button" className={`p-btn p-btn-${kind}`} onClick={onClick} disabled={disabled}>{children}</button>
);
const WARN = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';

function ReasonField({ value, onChange, error, placeholder, label = 'Alasan' }: { value: string; onChange: (v: string) => void; error?: string; placeholder?: string; label?: string }) {
  return (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>{label}<span className="p-req">*</span></span>
      <textarea className={'p-input p-area' + (error ? ' err' : '')} aria-label={label} maxLength={MAX} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 88 }} />
      {error && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{error}</span>}
      <span className="p-help row"><span></span><span>{value.length}/{MAX}</span></span>
    </div>
  );
}

const AV = ({ name }: { name: string }) => <span className="in-av">{initials(name)}</span>;

export interface CloseResult { contracts: { partner: string; ref: string }[]; note: string; followUp: 'lanjut' | 'batal'; cancelReason: string }

/** P23: Tutup insiden ini? Pejabat mengonfirmasi kontrak mitra; tindak lanjut berjalan dilanjutkan atau dibatalkan. */
export function CloseDialog({ incident: i, now, contracts, note, error, onClose, onConfirm }: {
  incident: Incident; now: string; contracts: { partner: string; ref: string }[]; note: string; error?: string; onClose: () => void; onConfirm: (r: CloseResult) => void;
}) {
  const c = i.handling?.closure;
  const fus = useFollowUps();
  const open = openFollowUps(i, fus);
  const [choice, setChoice] = useState<'lanjut' | 'batal'>('lanjut');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const due = i.handleDueAt;
  const inTime = !due || now <= due;
  const high = isHighOrCritical(i.severity);
  const submit = () => {
    if (choice === 'batal' && !reason.trim()) return setTried(true);
    onConfirm({ contracts, note, followUp: open.length ? choice : 'lanjut', cancelReason: reason });
  };
  return (
    <Modal title="Tutup insiden ini?" width={560} onClose={onClose} footer={<><Btn onClick={onClose}>Periksa lagi</Btn><Btn kind="primary" onClick={submit}><Ic d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" size={16} />Tutup insiden</Btn></>}>
      <dl className="lk-kv1" style={{ gridTemplateColumns: '140px minmax(0, 1fr)', margin: 0 }}>
        <dt>Lama penanganan</dt><dd>{formatDuration(registeredAt(i), c?.requestedAt ?? now)} · <span style={{ color: inTime ? 'var(--status-success-ink)' : 'var(--status-danger-ink, var(--err-ink))', fontWeight: 600 }}>{inTime ? 'Dalam tenggat' : 'Lewat tenggat'}</span></dd>
        <dt>Penyebab utama</dt><dd>{c?.cause || '—'}</dd>
        <dt>Tim terlibat</dt><dd>{partnerLabel(i).map((p) => p.replace(/ \((.+)\)$/, '')).join(', ') || '—'}</dd>
        {contracts.length > 0 && (<><dt>Kontrak mitra</dt><dd>{contracts.map((k) => k.ref).join(', ')}</dd></>)}
        <dt>Bukti</dt><dd>{c?.evidence?.length ?? 0} file</dd>
        <dt>Kerugian akhir</dt><dd>{c?.lossFinalIdr != null ? formatRupiah(c.lossFinalIdr) : '—'}</dd>
      </dl>
      {open.length > 0 && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>{open.length} tindak lanjut belum selesai<span className="p-req">*</span></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {open.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-subtle)' }}>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
                <span className={`p-tag ${f.tlStatus ? MOD_TAG[f.tlStatus] : FU_TAG[f.status]}`}>{f.tlStatus ? (f.tlStatus === 'dikembalikan' ? 'Dikembalikan' : MOD_LABEL[f.tlStatus]) : FU_LABEL[f.status]}</span>
              </div>
            ))}
          </div>
          <div role="radiogroup" aria-label="Tindak lanjut belum selesai" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {([['lanjut', 'Lanjutkan tindak lanjut', 'Insiden ditutup dengan tag Tindak lanjut berjalan. PIC langkah diberi tahu.'], ['batal', 'Batalkan semua', 'Wajib beralasan. PIC langkah diberi tahu.']] as const).map(([k, t, cap]) => (
              <label key={k} className="p-choice" onClick={() => setChoice(k)}>
                <span className={choice === k ? 'p-radio on' : 'p-radio'} role="radio" aria-checked={choice === k} aria-label={t}></span>
                <span><b>{t}</b><br /><span className="p-cap">{cap}</span></span>
              </label>
            ))}
          </div>
          {choice === 'batal' && <ReasonField label="Alasan pembatalan" value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan pembatalan.' : undefined} />}
        </div>
      )}
      {error && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{error}</span>}
      <span className="p-cap">{high ? `Pelapor, PIC, dan SKK Migas (keparahan ${SEV_LABEL[i.severity!]}) diberi tahu.` : 'Pelapor dan PIC diberi tahu.'} Bisa dibuka kembali dalam 30 hari.</span>
    </Modal>
  );
}

/** P25: Kembalikan ke PIC. */
export function ReturnDialog({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const first = (i.pic ?? 'PIC').split(' ')[0];
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Modal title="Kembalikan ke PIC?" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit} disabled={!reason.trim()}>Kembalikan</Btn></>}>
      <span>Insiden tetap Dalam penanganan. {first} melihat alasan Anda di Detail dan bisa meminta ditutup lagi.</span>
      <ReasonField value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} placeholder="mis. Lampirkan berita acara yang sudah ditandatangani Polsek, bukan draf." />
    </Modal>
  );
}

/** P26: Ganti PIC (PS5: Tunjuk PIC bila belum ada). */
export function ReassignDialog({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (pic: string, kind: 'perorangan' | 'grup', reason: string) => void }) {
  const [pic, setPic] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const cur = i.pic;
  const opts = [...PIC_PEOPLE.map((p) => ({ key: p.name, label: p.name, caption: p.caption, lead: <AV name={p.name} /> })), ...PIC_GROUPS.map((g) => ({ key: g.name, label: g.name, caption: g.caption, lead: <AV name={g.name} /> }))].filter((o) => o.key !== cur);
  const sel = opts.find((o) => o.key === pic);
  const submit = () => (pic && reason.trim() ? onConfirm(pic, PIC_GROUPS.some((g) => g.name === pic) ? 'grup' : 'perorangan', reason.trim()) : setTried(true));
  return (
    <Modal title={cur ? 'Ganti PIC' : 'Tunjuk PIC'} width={520} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>{cur ? 'Ganti PIC' : 'Tunjuk PIC'}</Btn></>}>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC saat ini</span>
        {cur ? <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AV name={cur} />{cur} · Koordinator Security</span> : <span>Belum ada{i.handling?.picPrev ? ` · ${i.handling.picPrev} tidak aktif` : ''}</span>}
      </div>
      <SelectField
        label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>PIC baru<span className="p-req">*</span></span>} ariaLabel="PIC baru" placeholder={!sel}
        display={sel ? <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{sel.lead}{sel.label} · {sel.caption}</span> : 'Pilih PIC'}
        options={opts} selected={pic} onPick={setPic}
        help={tried && !pic ? <span className="p-help err" role="alert"><Icon name="warn" size={14} />Pilih PIC baru.</span> : <span className="p-help">Pengguna aktif organisasi ini yang cakupannya meliputi WK insiden.</span>}
      />
      <ReasonField value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} placeholder="mis. Andi cuti 2 minggu mulai 2 Nov." />
      <span className="p-cap">PIC lama dan baru diberi tahu. Tenggat tidak berubah.</span>
    </Modal>
  );
}

/** P27 / PS10: Ubah tenggat penanganan. `initialErrors` memunculkan PS10 dari awal. */
export function DueDialog({ incident: i, today, preset, onClose, onConfirm }: {
  incident: Incident; today: string; preset?: { date: string; reason: string }; onClose: () => void; onConfirm: (date: string, reason: string) => void;
}) {
  const [date, setDate] = useState(preset?.date ?? '');
  const [reason, setReason] = useState(preset?.reason ?? '');
  const [tried, setTried] = useState(!!preset);
  const err = dueErrors(date, reason, today);
  const bad = !!(err.date || err.reason);
  const base = i.handling?.dueDefaultAt ?? i.handleDueAt;
  const sev = i.severity ? SEV_LABEL[i.severity] : '—';
  const submit = () => (bad ? setTried(true) : onConfirm(date, reason.trim()));
  return (
    <Modal title="Ubah tenggat penanganan" width={520} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>Simpan tenggat</Btn></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="p-cap" style={{ fontWeight: 600 }}>Tenggat bawaan</span>
          <b>{base ? formatWibFull(base).replace(' WIB', '') : '—'}</b>
          <span className="p-cap">{sev}</span>
        </div>
        <div className="p-field" style={{ gap: 6 }}>
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tenggat baru<span className="p-req">*</span></span>
          <DateField label="Tenggat baru" value={date} onChange={setDate} invalid={tried && !!err.date} />
          {tried && err.date && <span className="p-help err" role="alert"><Ic d={WARN} size={14} />{err.date}</span>}
        </div>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan<span className="p-req">*</span></span>
        <textarea className={'p-input p-area' + (tried && err.reason ? ' err' : '')} aria-label="Alasan" maxLength={MAX} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. Penyelidikan Polsek butuh 2 minggu; penutupan menunggu berita acara resmi." style={{ minHeight: 88 }} />
        {tried && err.reason ? <span className="p-help err" role="alert"><Ic d={WARN} size={14} />{err.reason}</span> : <span className="p-help row"><span></span><span>{reason.length}/{MAX}</span></span>}
      </div>
      <span className="p-cap">Tag Tenggat diubah tampil di Detail dan terlihat oleh SKK Migas. Tercatat di riwayat.</span>
    </Modal>
  );
}

/** P28: Buka kembali insiden? */
export function ReopenDialog({ incident: i, closedAt, onClose, onConfirm }: { incident: Incident; closedAt: string | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Modal title="Buka kembali insiden?" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>Buka kembali</Btn></>}>
      <span>Status kembali Dalam penanganan dengan PIC {i.pic ?? '—'}. Waktu penutupan lama tersimpan di riwayat.</span>
      <ReasonField value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} placeholder="mis. Kabel kembali dicuri di titik yang sama 2 Nov; penyebab belum tuntas." />
      <span className="p-cap">PIC dan SKK Migas diberi tahu.{closedAt ? ` Batas buka kembali: ${reopenLimitText(closedAt)}.` : ''}</span>
    </Modal>
  );
}

/** PS7: lewat 30 hari. */
export function NoReopenDialog({ incident: i, closedAt, onClose }: { incident: Incident; closedAt: string; onClose: () => void }) {
  const lim = reopenLimitText(closedAt);
  return (
    <Modal title="Tidak bisa dibuka kembali" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Tutup</Btn><Link to="/insiden/baru/jenis" className="p-btn p-btn-primary"><Ic d="M12 5v14M5 12h14" size={16} />Buat laporan baru</Link></>}>
      <div className="in-bn err" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
        <Ic d={WARN} size={16} />
        <div className="body">Insiden ini ditutup lebih dari 30 hari lalu. Laporkan sebagai insiden baru dan tautkan ke {i.no}.</div>
      </div>
      <span className="p-cap">Ditutup {formatDate(closedAt)} · batas buka kembali {lim}.</span>
    </Modal>
  );
}

