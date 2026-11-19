// Sheet layar Review mobile: Setujui (MV3), Aksi lain (MV4), Minta revisi (MV4b), Gabung (MV5), Batalkan (MV6),
// serta Jadikan kerawanan dan Tandai terbatas (tanpa board khusus: memakai pola sheet MV4b/MV6).
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { Incident } from '@/services/types';
import { PIC_GROUPS } from '@/services/mock/workflow';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical } from '@/lib/severity';
import { formatDate } from '@/lib/format';
import { MAX_REASON, officialCategory, picName, type DupCandidate, type ReviewForm } from '@/features/insiden/logic/review';
import { Ic } from '@/features/insiden/components/review/parts';

const PRI: Record<string, string> = { tinggi: 'Tinggi', normal: 'Normal', rendah: 'Rendah' };
const WARN = 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z';

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  role?: 'dialog' | 'menu';
  label?: string;
  labelledBy?: string;
  sbStyle?: CSSProperties;
}

/** Scrim + `.sheet` (`.grab`, `.sb`, `.sf`) persis markup board. */
export function Sheet({ onClose, children, footer, role = 'dialog', label, labelledBy, sbStyle }: SheetProps) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role={role} aria-modal={role === 'dialog' ? true : undefined} aria-label={label} aria-labelledby={labelledBy}>
        <div className="grab" aria-hidden="true"></div>
        {role === 'dialog' ? <div className="sb" style={sbStyle}>{children}</div> : children}
        {footer && <div className="sf">{footer}</div>}
      </div>
    </>
  );
}

const Title = ({ id, children }: { id: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><b id={id} style={{ fontSize: 17, lineHeight: '24px' }}>{children}</b></div>
);
const Btn = ({ children, onClick, kind = 'secondary' }: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'destructive' }) => (
  <button type="button" className={'p-btn p-btn-' + kind} onClick={onClick}>{children}</button>
);

function Reason({ label, value, onChange, placeholder, error, help }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; help?: string }) {
  return (
    <div className="p-field">
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>{label}<span className="p-req">*</span></span>
      <textarea className={'p-input p-area' + (error ? ' err' : '')} aria-label={label} maxLength={MAX_REASON} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 80 }} />
      {error && <span className="p-help err" role="alert"><Icon name="warn" size={14} />{error}</span>}
      {help && <span className="p-help">{help}</span>}
    </div>
  );
}

const Cell = ({ term, children, caption, wide }: { term: string; children: ReactNode; caption: string; wide?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 0', borderTop: '1px solid var(--border-subtle)', ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
    <span className="p-cap" style={{ fontWeight: 600 }}>{term}</span>
    <b style={{ fontSize: 14 }}>{children}</b>
    <span className="p-cap">{caption}</span>
  </div>
);

// ---- MV3 Setujui ----
export function ApproveSheet({ form, dueIso, onClose, onConfirm }: { form: ReviewForm; dueIso: string; onClose: () => void; onConfirm: () => void }) {
  const id = useId();
  const grup = form.picKind === 'grup';
  const g = PIC_GROUPS.find((x) => x.name === form.group);
  const n = form.steps.length;
  const tenggat = `Tenggat ${formatDate(dueIso)}`;
  return (
    <Sheet onClose={onClose} labelledBy={id} footer={<><Btn kind="primary" onClick={onConfirm}>Setujui insiden</Btn><Btn onClick={onClose}>Periksa lagi</Btn></>}>
      <Title id={id}>Setujui insiden ini?</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
        <Cell term="Klasifikasi" caption={form.jenis ?? 'Tanpa jenis'}>{officialCategory(form)}</Cell>
        <Cell term="Keparahan" caption={`Prioritas ${PRI[form.priority]}`}>
          <span className={'p-tag ' + SEV_TAG_CLS[form.severity]}><span className="dot"></span>{SEV_LABEL[form.severity]}</span>
        </Cell>
        <Cell term="PIC penanganan" caption={grup ? `${g?.caption ?? ''} · ${tenggat}` : tenggat}>{picName(form)}</Cell>
        <Cell term="Saran langkah ke PIC" wide caption={n ? 'Tidak wajib bagi PIC.' : 'Tidak ada saran. Bisa dipilih dari bahan pertimbangan insiden serupa.'}>
          {n ? `${n} langkah dikirim sebagai saran` : 'Tidak ada saran langkah'}
        </Cell>
      </div>
      <span className="p-cap">
        {grup
          ? 'Insiden jadi data resmi. Pelapor dan semua anggota tim diberi tahu. Anggota pertama yang mengambil alih menjadi PIC.'
          : 'Insiden jadi data resmi. Pelapor dan PIC diberi tahu, lalu penanganan dimulai.'}
      </span>
    </Sheet>
  );
}

// ---- MV4 Aksi lain ----
type Action = 'revisi' | 'krw' | 'terbatas' | 'batal';
const MENU_BTN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minHeight: 56, padding: '8px 16px', border: 0, background: 'none', font: 'inherit', textAlign: 'left', color: 'var(--ink)' };
export function ActionsSheet({ onClose, onPick }: { onClose: () => void; onPick: (k: Action) => void }) {
  const items: [Action, string, string][] = [
    ['revisi', 'Minta revisi', 'Kembalikan ke pelapor dengan alasan'],
    ['krw', 'Jadikan kerawanan', 'Bila ternyata tanpa dampak'],
    ['terbatas', 'Tandai terbatas', 'Batasi siapa yang bisa melihat rincian'],
    ['batal', 'Batalkan insiden', 'Laporan tidak benar'],
  ];
  return (
    <Sheet onClose={onClose} role="menu" label="Aksi lain" footer={<Btn onClick={onClose}>Tutup</Btn>}>
      {items.map(([k, t, c]) => (
        <button key={k} type="button" role="menuitem" style={k === 'batal' ? { ...MENU_BTN, color: 'var(--error-ink)' } : MENU_BTN} onClick={() => onPick(k)}>
          <b>{t}</b><span className="p-cap">{c}</span>
        </button>
      ))}
    </Sheet>
  );
}

// ---- MV4b Minta revisi ----
const PARTS = ['Temuan', 'Kejadian & dampak', 'Lampiran'];
export function RevisionSheet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const id = useId();
  const [parts, setParts] = useState<string[]>(['Kejadian & dampak']);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const bad = !reason.trim() ? 'Tulis alasan revisi.' : parts.length === 0 ? 'Pilih bagian yang perlu diperbaiki.' : '';
  const submit = () => (bad ? setTried(true) : onConfirm(`${reason.trim()} (Bagian: ${parts.join(', ')})`));
  return (
    <Sheet onClose={onClose} labelledBy={id} footer={<><Btn kind="primary" onClick={submit}>Minta revisi</Btn><Btn onClick={onClose}>Batal</Btn></>}>
      <Title id={id}>Minta revisi laporan</Title>
      <span className="p-lbl" style={{ color: 'var(--ink)' }}>Bagian yang perlu diperbaiki<span className="p-req">*</span></span>
      {PARTS.map((t) => {
        const on = parts.includes(t);
        return (
          <label key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 44 }}>
            <input type="checkbox" className="mv-hid" checked={on} onChange={() => setParts(on ? parts.filter((x) => x !== t) : [...parts, t])} />
            <span className={on ? 'p-check on' : 'p-check'} aria-hidden="true">{on && <Ic d="M20 6 9 17l-5-5" size={12} />}</span>
            <b style={{ fontWeight: 600 }}>{t}</b>
          </label>
        );
      })}
      <Reason label="Alasan revisi" value={reason} onChange={setReason} placeholder="mis. Perkiraan kerugian belum ada. Mohon lengkapi." error={tried ? bad : undefined} />
    </Sheet>
  );
}

// ---- MV5 Gabung ----
export function MergeSheet({ candidates, onClose, onMerge, onLink, onSeparate }: {
  candidates: DupCandidate[]; onClose: () => void; onMerge: (no: string) => void; onLink: (no: string) => void; onSeparate: () => void;
}) {
  const id = useId();
  const [sel, setSel] = useState<string | null>(candidates.find((c) => c.linkable)?.no ?? null);
  const [more, setMore] = useState(false);
  const shown = more ? candidates : candidates.slice(0, 3);
  const dis = sel === null;
  const off: CSSProperties | undefined = dis ? { opacity: 0.45, pointerEvents: 'none' } : undefined;
  return (
    <Sheet
      onClose={onClose} labelledBy={id} sbStyle={{ gap: 12, overflow: 'auto' }}
      footer={
        <>
          <button type="button" className="p-btn p-btn-primary" aria-disabled={dis} style={off} onClick={() => sel && onMerge(sel)}>{sel ? `Gabung ke ${sel}` : 'Gabung'}</button>
          <button type="button" className="p-btn p-btn-secondary" aria-disabled={dis} style={off} onClick={() => sel && onLink(sel)}>{sel ? `Tautkan dengan ${sel}` : 'Tautkan'}</button>
          <Btn onClick={onSeparate}>Tetap sebagai insiden terpisah</Btn>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--caution-bg)', color: 'var(--caution-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Ic d={WARN} size={16} /></span>
        <b id={id} style={{ fontSize: 17, lineHeight: '24px' }}>Sepertinya sudah dilaporkan</b>
      </div>
      <span style={{ color: 'var(--ink-subtle)' }}>{candidates.length} insiden berkategori sama di dekat lokasi ini. Pilih yang kejadiannya sama untuk Gabung atau Tautkan.</span>
      <div className="in-dups" role="radiogroup" aria-label="Insiden mirip">
        {shown.map((d) => {
          const on = sel === d.no;
          return (
            <div key={d.no} className={'in-dupw' + (on ? ' on' : '') + (d.linkable ? '' : ' dis')}>
              <button type="button" className="in-dsel" role="radio" aria-checked={on} aria-disabled={!d.linkable} onClick={() => d.linkable && setSel(on ? null : d.no)}>
                <span className="in-rad" aria-hidden="true"></span>
                <span className="t">
                  <b>{d.title}</b>
                  <span className="m"><span className="p-mono">{d.no}</span><span>· {d.status}</span></span>
                  <span className="m">
                    <span className="in-match">{d.dist}</span><span className="in-match">Selisih {d.dt}</span>
                    <span className={'p-tag ' + d.sevCls} style={{ marginLeft: 'auto' }}><span className="dot"></span>{d.sevLabel}</span>
                  </span>
                  {!d.linkable && <span className="in-dnote"><Ic d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" size={12} />Sudah ditutup. Buka kembali dulu bila ingin menggabung</span>}
                </span>
              </button>
              <Link to={`/insiden/${d.no}`} className="in-dopen" aria-label={`Buka ${d.no}`}>
                <Ic d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" size={16} />
              </Link>
            </div>
          );
        })}
        {!more && candidates.length > 3 && <button type="button" className="in-dmore" onClick={() => setMore(true)}>Lihat {candidates.length - 3} lainnya</button>}
      </div>
    </Sheet>
  );
}

// ---- MV6 Batalkan ----
export function CancelSheet({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Sheet onClose={onClose} labelledBy={id} footer={<><Btn kind="destructive" onClick={submit}>Batalkan insiden</Btn><Btn onClick={onClose}>Kembali</Btn></>}>
      <Title id={id}>Batalkan insiden?</Title>
      <span style={{ color: 'var(--ink-subtle)' }}>Insiden keluar dari statistik. Laporan tidak dihapus.</span>
      <Reason label="Alasan pembatalan" value={reason} onChange={setReason} placeholder="mis. Kabel dipindah kontraktor, bukan dicuri." error={tried && !reason.trim() ? 'Tulis alasan pembatalan.' : undefined} />
      {(isHighOrCritical(i.severity) || i.skkNotified) && (
        <div className="in-bn caution" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
          <Ic d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" size={16} />
          <div className="body">SKK Migas sudah menerima kabar insiden ini dan akan diberi tahu pembatalannya.</div>
        </div>
      )}
    </Sheet>
  );
}

// ---- Jadikan kerawanan (teks dari dialog desktop V33) ----
export function KerawananSheet({ incident: i, onClose, onConfirm }: { incident: Incident; onClose: () => void; onConfirm: (reason: string) => void }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm(reason.trim()) : setTried(true));
  return (
    <Sheet onClose={onClose} labelledBy={id} footer={<><Btn kind="primary" onClick={submit}>Jadikan kerawanan</Btn><Btn onClick={onClose}>Batal</Btn></>}>
      <Title id={id}>Jadikan kerawanan?</Title>
      <span style={{ color: 'var(--ink-subtle)' }}>Laporan ini tanpa kerugian, korban, atau gangguan operasi, jadi dicatat sebagai <b>kerawanan</b> dengan nomor KRW- baru dan tidak dihitung sebagai insiden. Insiden lama dibatalkan dan menaut ke kerawanan baru.</span>
      <Reason label="Alasan" value={reason} onChange={setReason} help="Tercatat di jejak audit dan terlihat oleh SKK Migas." placeholder="mis. Pompa tetap menyala; kabel yang putus cadangan, tidak ada kerugian." error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} />
      {isHighOrCritical(i.severity) && (
        <div className="in-bn caution" style={{ padding: '10px 12px', fontSize: 12, lineHeight: '17px' }}>
          <Ic d={WARN} size={16} />
          <div className="body"><b>Insiden ini {SEV_LABEL[i.severity!]}.</b> SKK Migas akan diberi tahu bahwa insiden diturunkan menjadi kerawanan.</div>
        </div>
      )}
    </Sheet>
  );
}

// ---- Tandai terbatas (teks dari dialog desktop V34) ----
export function RestrictedSheet({ incident: i, pic, onClose, onConfirm }: { incident: Incident; pic: string; onClose: () => void; onConfirm: () => void }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const submit = () => (reason.trim() ? onConfirm() : setTried(true));
  return (
    <Sheet onClose={onClose} labelledBy={id} footer={<><Btn kind="primary" onClick={submit}>Tandai terbatas</Btn><Btn onClick={onClose}>Batal</Btn></>}>
      <Title id={id}>Tandai terbatas</Title>
      <span style={{ color: 'var(--ink-subtle)' }}>Rincian dan lampiran hanya terlihat oleh orang yang ditunjuk. Ekspor disamarkan.</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Selalu bisa melihat</span>
        <span className="p-cap">Pelapor ({i.reporter}), Pejabat Berwenang organisasi ini, PIC ({pic})</span>
      </div>
      <Reason label="Alasan" value={reason} onChange={setReason} placeholder="mis. Diduga melibatkan oknum internal; tunggu hasil penyelidikan." error={tried && !reason.trim() ? 'Tulis alasan.' : undefined} />
    </Sheet>
  );
}
