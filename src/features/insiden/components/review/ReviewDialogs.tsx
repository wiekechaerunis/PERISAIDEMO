// Dialog layar Review: Setujui (V13/V13g), Gabung (V22), Minta revisi (V31), Batalkan (V32), Jadikan kerawanan (V33), Tandai terbatas (V34).
import { useEffect, useId, useState, type ReactNode } from 'react';
import type { Incident } from '@/services/types';
import { PIC_GROUPS } from '@/services/mock/workflow';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical } from '@/lib/severity';
import { formatDate } from '@/lib/format';
import { addWorkingDays } from '@/lib/workdays';
import { Icon } from '@/components/ui/Icon';
import { MAX_REASON, officialCategory, picName, type ReviewForm } from '../../logic/review';
import { Ic, SelectField } from './parts';

interface ModalProps {
  title: string;
  width: number;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

/** Cangkang dialog board: scrim + `.in-dlg` > `.p-dialog` (dh, db, df). */
export function Modal({ title, width, onClose, children, footer }: ModalProps) {
  const id = useId();
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="rv-modal">
      <div className="in-scrim" onClick={onClose}></div>
      <div className="in-dlg" style={{ width }} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="p-dialog">
          <div className="dh">
            <h3 id={id}>{title}</h3>
            <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onClose}>
              <Ic d="M18 6 6 18M6 6l12 12" size={16} />
            </button>
          </div>
          <div className="db">{children}</div>
          <div className="df">{footer}</div>
        </div>
      </div>
    </div>
  );
}

const Btn = ({ children, onClick, kind = 'secondary', disabled }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'destructive'; disabled?: boolean }) => (
  <button type="button" className={`p-btn p-btn-${kind}`} onClick={onClick} disabled={disabled}>{children}</button>
);

function Reason({ label, value, onChange, placeholder, help, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; help?: string; error?: string }) {
  return (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>{label}<span className="p-req">*</span></span>
      <textarea className={'p-input p-area' + (error ? ' err' : '')} aria-label={label} maxLength={MAX_REASON} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 88 }} />
      {error && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{error}</span>}
      <span className="p-help row"><span>{help}</span><span>{value.length}/{MAX_REASON}</span></span>
    </div>
  );
}

const Cell = ({ term, children, caption, wide }: { term: string; children: ReactNode; caption?: string; wide?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 0', borderTop: '1px solid var(--border-subtle)', minWidth: 0, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
    <dt className="p-cap" style={{ fontWeight: 600 }}>{term}</dt>
    <dd style={{ margin: 0, fontWeight: 600 }}>{children}</dd>
    {caption && <dd className="p-cap" style={{ margin: 0 }}>{caption}</dd>}
  </div>
);

const PRI: Record<string, string> = { tinggi: 'Tinggi', normal: 'Normal', rendah: 'Rendah' };

export interface DueInput { days: number; reason: string }

export function ApproveDialog({ form, defaultDays, startIso, onClose, onConfirm }: { form: ReviewForm; defaultDays: number; startIso: string; onClose: () => void; onConfirm: (due: DueInput) => void }) {
  const [daysText, setDaysText] = useState(String(defaultDays));
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const n = /^[0-9]+$/.test(daysText.trim()) ? Number(daysText.trim()) : 0;
  const valid = n >= 1;
  const dueIso = addWorkingDays(startIso, valid ? n : defaultDays);
  const changed = valid && n !== defaultDays;
  const submit = () => {
    setTried(true);
    if (!valid || (changed && !reason.trim())) return;
    onConfirm({ days: n, reason: reason.trim() });
  };
  const grup = form.picKind === 'grup';
  const g = PIC_GROUPS.find((x) => x.name === form.group);
  const steps = form.steps;
  const tenggat = `tenggat ${formatDate(dueIso)}`;
  return (
    <Modal
      title="Setujui insiden ini?" width={560} onClose={onClose}
      footer={<><Btn onClick={onClose}>Periksa lagi</Btn><Btn kind="primary" onClick={submit}><Icon name="check" size={16} />Setujui insiden</Btn></>}
    >
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24 }}>
        <Cell term="Klasifikasi" caption={form.jenis ?? undefined}>{officialCategory(form)}</Cell>
        <Cell term="Keparahan" caption={`Prioritas ${PRI[form.priority]}`}>
          <span className={'p-tag ' + SEV_TAG_CLS[form.severity]} style={{ height: 20 }}><span className="dot"></span>{SEV_LABEL[form.severity]}</span>
        </Cell>
        <Cell term="PIC penanganan" caption={grup ? `${g?.caption ?? ''} · ${tenggat}` : tenggat.charAt(0).toUpperCase() + tenggat.slice(1)}>{picName(form)}</Cell>
        <Cell
          term="Saran langkah ke PIC" wide
          caption={steps.length ? `${steps.map((s) => s.replace(/\.$/, '')).join('; ')}. Tidak wajib bagi PIC.` : 'Tidak ada saran. Bisa dipilih dari bahan pertimbangan insiden serupa.'}
        >
          {steps.length ? `${steps.length} langkah dikirim sebagai saran` : 'Tidak ada saran langkah'}
        </Cell>
      </dl>
      <div className="p-field" style={{ marginTop: 4 }}>
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tenggat penanganan<span className="p-req">*</span></span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className={'p-input' + (tried && !valid ? ' err' : '')} style={{ width: 80 }}>
            <input aria-label="Tenggat penanganan (hari kerja)" inputMode="numeric" value={daysText} onChange={(e) => setDaysText(e.target.value)} style={{ border: 0, outline: 0, background: 'none', font: 'inherit', width: '100%' }} />
          </label>
          <span className="p-cap" style={{ color: 'var(--ink)' }}>hari kerja</span>
          <span className="p-cap">sampai <b style={{ color: 'var(--ink)' }}>{formatDate(dueIso)}</b>, 07:00 WIB</span>
        </div>
        <span className="p-help">{changed ? `Bawaan ${SEV_LABEL[form.severity]}: ${defaultDays} hari kerja (${formatDate(addWorkingDays(startIso, defaultDays))}).` : `Bawaan ${SEV_LABEL[form.severity]} dari konfigurasi, dihitung hari kerja sejak registrasi.`}</span>
        {tried && !valid && <span className="p-help err" role="alert">Isi bilangan bulat, minimal 1 hari kerja.</span>}
      </div>
      {changed && (
        <div className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kenapa berbeda dari konfigurasi?<span className="p-req">*</span></span>
          <textarea className={'p-input p-area' + (tried && !reason.trim() ? ' err' : '')} aria-label="Kenapa berbeda dari konfigurasi?" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} style={{ minHeight: 56, border: 0, font: 'inherit', width: '100%', boxSizing: 'border-box' }} />
          <span className="p-help row"><span>Tercatat di riwayat dan terlihat SKK. Tag Tenggat diubah tampil di Detail.</span><span>{reason.length}/300</span></span>
          {tried && !reason.trim() && <span className="p-help err" role="alert">Tulis alasan.</span>}
        </div>
      )}
      <span className="p-cap">
        {grup
          ? 'Insiden jadi data resmi. Pelapor dan semua anggota tim diberi tahu. Anggota pertama yang mengambil alih menjadi PIC.'
          : 'Insiden jadi data resmi. Pelapor dan PIC diberi tahu, lalu penanganan dimulai.'}
      </span>
    </Modal>
  );
}

export function MergeDialog({ incident: i, parent, onClose, onConfirm, onOther }: { incident: Incident; parent: Incident; onClose: () => void; onConfirm: () => void; onOther: () => void }) {
  const box: React.CSSProperties = { flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 'var(--radius-lg)', boxShadow: 'inset 0 0 0 1px var(--border)', display: 'flex', flexDirection: 'column', gap: 4 };
  const ell: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  const n = i.detail?.attachments.length ?? 0;
  return (
    <Modal
      title="Gabung laporan ini?" width={560} onClose={onClose}
      footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={onConfirm}>Gabung</Btn></>}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={box}>
          <span className="p-mono p-cap">{i.no}</span><b style={ell}>{i.title}</b>
          <span className="p-tag t-neutral" style={{ height: 20, alignSelf: 'flex-start' }}>Jadi Dibatalkan</span>
        </div>
        <span style={{ color: 'var(--ink-muted)', display: 'inline-flex' }}><Ic d="M5 12h14M13 6l6 6-6 6" size={16} /></span>
        <div style={box}>
          <span className="p-mono p-cap">{parent.no}</span><b style={ell}>{parent.title}</b>
          <span className="p-tag t-info" style={{ height: 20, alignSelf: 'flex-start' }}>Tetap berjalan</span>
        </div>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--ink-subtle)' }}>
        {[`${n} foto, pelapor, dan ${i.source === 'wa' ? 'pesan WhatsApp' : 'sumber'} pindah ke kronologinya`, 'Tidak dihitung dua kali di statistik', 'Tanpa notifikasi jalur cepat baru'].map((t) => (
          <li key={t} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--ink-muted)', display: 'inline-flex', marginTop: 2 }}><Ic d="M20 6 9 17l-5-5" size={14} /></span><span>{t}</span>
          </li>
        ))}
      </ul>
      <a href="#" className="lk-alink" style={{ fontSize: 12 }} onClick={(e) => { e.preventDefault(); onOther(); }}>Gabung ke insiden lain</a>
    </Modal>
  );
}

const PARTS: [string, string][] = [
  ['Temuan', 'Jenis, waktu, judul, lokasi'],
  ['Kejadian & dampak', 'Kategori, keparahan, dampak, korban, pihak yang sudah menangani'],
  ['Lampiran', 'Foto dan dokumen'],
];

export function RevisionDialog({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [parts, setParts] = useState<string[]>(['Kejadian & dampak']);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const bad = !reason.trim() ? 'Tulis alasan revisi.' : parts.length === 0 ? 'Pilih bagian yang perlu diperbaiki.' : '';
  const submit = () => (bad ? setTried(true) : onConfirm(`${reason.trim()} (Bagian: ${parts.join(', ')})`));
  return (
    <Modal title="Minta revisi laporan" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>Minta revisi</Btn></>}>
      <span><span className="p-mono">{i.no}</span> · {i.title}</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Bagian yang perlu diperbaiki<span className="p-req">*</span></span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PARTS.map(([t, c]) => {
            const on = parts.includes(t);
            return (
              <label key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" checked={on} onChange={() => setParts(on ? parts.filter((x) => x !== t) : [...parts, t])} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                <span className={on ? 'p-check on' : 'p-check'} aria-hidden="true">{on && <Icon name="check" size={11} />}</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontWeight: 600 }}>{t}</b><span className="p-cap">{c}</span></span>
              </label>
            );
          })}
        </div>
        <span className="p-help">Bagian terpilih disorot di form pelapor.</span>
      </div>
      <Reason label="Alasan revisi" value={reason} onChange={setReason} error={tried ? bad : undefined} placeholder="mis. Perkiraan kerugian belum ada. Mohon lengkapi dari data gudang." />
      <span className="p-cap">Waktu registrasi tidak berubah saat laporan diajukan ulang.</span>
    </Modal>
  );
}

export function CancelDialog({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Modal title="Batalkan insiden?" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Kembali</Btn><Btn kind="destructive" onClick={submit}>Batalkan insiden</Btn></>}>
      <span>Insiden keluar dari statistik. Laporan tidak dihapus.</span>
      <Reason label="Alasan pembatalan" value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan pembatalan.' : undefined} placeholder="mis. Kabel dipindah kontraktor untuk perbaikan panel, bukan dicuri." />
      {(isHighOrCritical(i.severity) || i.skkNotified) && (
        <div className="p-banner" role="status" style={{ alignItems: 'flex-start' }}>
          <Ic d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" size={16} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b>SKK Migas sudah menerima kabar insiden ini.</b><span>Mereka dan pelapor diberi tahu bahwa insiden dibatalkan.</span>
          </span>
        </div>
      )}
    </Modal>
  );
}

export function KerawananDialog({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const high = isHighOrCritical(i.severity);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Modal title="Jadikan kerawanan?" width={480} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>Jadikan kerawanan</Btn></>}>
      <span>Laporan ini tanpa kerugian, korban, atau gangguan operasi, jadi dicatat sebagai <b>kerawanan</b> dengan nomor KRW- baru dan tidak dihitung sebagai insiden. Insiden lama dibatalkan dan menaut ke kerawanan baru.</span>
      <SelectField
        label={<span className="p-lbl" style={{ color: 'var(--ink)' }}>Jenis kerawanan<span className="p-req">*</span></span>}
        ariaLabel="Jenis kerawanan" display="Kejadian tanpa dampak" selected="Kejadian tanpa dampak" onPick={() => undefined}
        options={[{ key: 'Kejadian tanpa dampak', label: 'Kejadian tanpa dampak' }]}
      />
      <Reason label="Alasan" value={reason} onChange={setReason} help="Tercatat di jejak audit dan terlihat oleh SKK Migas." error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} placeholder="mis. Pompa tetap menyala; kabel yang putus cadangan, tidak ada kerugian." />
      {high && (
        <div className="in-bn caution">
          <Ic d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={16} />
          <div className="body"><b>Insiden ini {SEV_LABEL[i.severity!]}.</b> SKK Migas akan diberi tahu bahwa insiden diturunkan menjadi kerawanan.</div>
        </div>
      )}
      <div className="in-bn info sm">
        <Ic d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5" size={16} /><span>Laporan keluar dari hitungan insiden.</span>
      </div>
    </Modal>
  );
}

export function RestrictedDialog({ incident: i, pic, onClose, onConfirm }: { incident: Incident; pic: string; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const [extra, setExtra] = useState<string[]>(['Hendra Wijaya · Pengawas SKK']);
  const [q, setQ] = useState('');
  const add = () => {
    const v = q.trim();
    if (v && !extra.includes(v)) setExtra([...extra, v]);
    setQ('');
  };
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Modal title="Tandai terbatas" width={520} onClose={onClose} footer={<><Btn onClick={onClose}>Batal</Btn><Btn kind="primary" onClick={submit}>Tandai terbatas</Btn></>}>
      <span>Rincian dan lampiran hanya terlihat oleh orang yang ditunjuk. Ekspor disamarkan.</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Selalu bisa melihat</span>
        <span className="p-cap">Pelapor ({i.reporter}), Pejabat Berwenang organisasi ini, PIC ({pic})</span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tambahan yang boleh melihat <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
        <span className="p-input" style={{ height: 'auto', minHeight: 40, flexWrap: 'wrap', gap: 6, padding: '6px 8px' }}>
          {extra.map((e) => (
            <span key={e} className="p-chip" aria-pressed="true" style={{ height: 28 }}>
              {e}
              <button type="button" aria-label={`Hapus ${e}`} onClick={() => setExtra(extra.filter((x) => x !== e))} style={{ border: 0, background: 'none', padding: 0, color: 'inherit', display: 'inline-flex', cursor: 'pointer' }}><Ic d="M18 6 6 18M6 6l12 12" size={14} /></button>
            </span>
          ))}
          <input
            aria-label="Cari pengguna" placeholder="Cari pengguna di organisasi ini atau SKK" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            style={{ flex: 1, minWidth: 120, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit' }}
          />
        </span>
      </div>
      <Reason label="Alasan" value={reason} onChange={setReason} error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} placeholder="mis. Diduga melibatkan oknum internal; tunggu hasil penyelidikan." />
    </Modal>
  );
}
