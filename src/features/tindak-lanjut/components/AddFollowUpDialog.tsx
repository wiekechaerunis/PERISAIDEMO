// Board T1 (Tambah tindak lanjut dari insiden) dan T1b (Jadikan tindak lanjut dari saran pemeriksa).
import { DateField } from '@/components/ui/DateField';
import { useState } from 'react';
import type { FollowUpSource, Incident } from '@/services/types';
import { STATUS_LABEL, STATUS_TAG } from '@/services/types';
import { SEV_LABEL, SEV_TAG_CLS } from '@/lib/severity';
import { formatDate } from '@/lib/format';
import { Modal } from '@/features/insiden/components/review/ReviewDialogs';
import { addWorkingDays, MAX_ACTION, MAX_EVIDENCE_HINT, TL_CREATE_NOW } from '@/services/mock/workflow.followup';

const USERS = [
  { name: 'Rudi Hartono', ini: 'RH', cap: 'Teknisi pengamanan · WK Andalas Darat', load: '2 tindak lanjut aktif' },
  { name: 'Dedi Kurniawan', ini: 'DK', cap: 'Koordinator BUJP lapangan · WK Andalas Darat', load: '1 aktif · 1 terlambat' },
  { name: 'Andi Pratama', ini: 'AP', cap: 'PIC insiden · Anda juga yang memeriksa hasilnya', load: '4 aktif' },
];

export interface AddValues {
  action: string;
  pic: string;
  dueDate: string;
  expectedEvidence: string;
  source: FollowUpSource;
  sourceLabel?: string;
}

interface Props {
  incident: Incident;
  /** asal: dari saran pemeriksa (T1b); kosong = dari PIC insiden (T1) */
  saran?: { text: string; by: string };
  onClose: () => void;
  /** mengembalikan pesan galat bila gagal */
  onSave: (v: AddValues) => string | null;
}

const addCalendarDays = (iso: string, n: number) =>
  new Date(new Date(iso.slice(0, 10) + 'T00:00:00Z').getTime() + n * 86_400_000).toISOString().slice(0, 10);

export function AddFollowUpDialog({ incident: i, saran, onClose, onSave }: Props) {
  const [action, setAction] = useState(saran?.text ?? '');
  const [evidence, setEvidence] = useState('');
  const [pic, setPic] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'durasi' | 'tanggal'>('durasi');
  const [dur, setDur] = useState('5');
  const [unit, setUnit] = useState<'kerja' | 'kalender'>('kerja');
  const [date, setDate] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const n = Math.max(0, parseInt(dur, 10) || 0);
  const dueDate = mode === 'tanggal' ? date : n > 0 ? (unit === 'kerja' ? addWorkingDays(TL_CREATE_NOW, n) : addCalendarDays(TL_CREATE_NOW, n)) : '';
  const ok = action.trim().length > 0 && pic !== null && dueDate !== '';
  const afterIncidentDue = !!dueDate && !!i.handleDueAt && dueDate > i.handleDueAt.slice(0, 10);

  const save = () => {
    if (!ok || pic === null) return;
    const e = onSave({
      action, pic: USERS[pic].name, dueDate, expectedEvidence: evidence,
      source: saran ? 'saran-verifikator' : 'manual', sourceLabel: saran?.by,
    });
    if (e) setErr(e);
  };

  return (
    <Modal
      title={saran ? 'Jadikan tindak lanjut' : 'Tambah tindak lanjut'}
      width={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" onClick={save} aria-disabled={!ok} style={ok ? undefined : { opacity: 0.45, pointerEvents: 'none' }}>
            Tugaskan
          </button>
        </>
      }
    >
      <div className="tl-insmini">
        <span className="p-cap">Sumber · Insiden</span>
        <div className="r">
          <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{i.no}</span>
          {i.severity && <span className={`p-tag ${SEV_TAG_CLS[i.severity]}`} style={{ height: 20, fontSize: 11 }}><span className="dot"></span>{SEV_LABEL[i.severity]}</span>}
          <span className={`p-tag ${STATUS_TAG[i.status]}`} style={{ height: 20, fontSize: 11 }}>{STATUS_LABEL[i.status]}</span>
        </div>
        <b style={{ fontWeight: 600 }}>{i.title}</b>
      </div>
      {saran && <span className="tl-asal">Dari saran pemeriksa · {saran.by}</span>}
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tindakan<span className="p-req">*</span></span>
        <textarea
          className="p-input p-area tl-field tl-area" aria-label="Tindakan" maxLength={MAX_ACTION} placeholder="Apa yang harus dikerjakan"
          value={action} onChange={(e) => setAction(e.target.value)} style={{ minHeight: 72, alignItems: 'flex-start' }}
        />
        <span className="p-help row"><span>{saran ? 'Terisi dari saran. Boleh diubah sebelum disimpan.' : ''}</span><span>{action.length}/{MAX_ACTION}</span></span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Dikerjakan oleh<span className="p-req">*</span></span>
        <button type="button" className="p-input tl-pick" aria-label="PIC" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} style={{ font: 'inherit', textAlign: 'left' }}>
          <span style={{ flex: 1, display: 'inline-flex', gap: 8, alignItems: 'center', color: pic === null ? 'var(--ink-muted)' : 'var(--ink)' }}>
            {pic === null ? 'Pilih PIC tindak lanjut' : USERS[pic].name}
          </span>
          <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {open && (
          <div className="p-pop" role="listbox" aria-label="Pilih PIC" style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {USERS.map((u, k) => (
              <button
                key={u.name} type="button" role="option" aria-selected={pic === k} className="p-opt"
                onClick={() => { setPic(k); setOpen(false); }}
                style={{ height: 'auto', padding: '8px 10px', width: '100%', border: 0, background: pic === k ? 'var(--action-subtle-bg)' : 'transparent', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <span className="in-av">{u.ini}</span>
                <span style={{ display: 'flex', flexDirection: 'column', flex: 1 }}><b style={{ fontWeight: 600 }}>{u.name}</b><span className="p-cap">{u.cap}</span></span>
                <span className="p-cap">{u.load}</span>
              </button>
            ))}
          </div>
        )}
        <span className="p-help">Pengguna aktif organisasi ini yang cakupannya meliputi {i.wk}. Anda boleh memilih diri sendiri. Yang ditampilkan jabatan, bukan role sistem.</span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Tenggat<span className="p-req">*</span></span>
        <div className="tl-dur">
          <div className="p-qf" role="radiogroup" aria-label="Cara isi tenggat">
            <button type="button" role="radio" aria-checked={mode === 'durasi'} onClick={() => setMode('durasi')}>Durasi</button>
            <button type="button" role="radio" aria-checked={mode === 'tanggal'} onClick={() => setMode('tanggal')}>Tanggal</button>
          </div>
          {mode === 'durasi' ? (
            <>
              <span className="p-input" style={{ width: 72 }}>
                <input className="tl-field" aria-label="Jumlah hari" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </span>
              <span className="p-input" style={{ width: 150 }}>
                <select className="tl-field" aria-label="Satuan hari" value={unit} onChange={(e) => setUnit(e.target.value as 'kerja' | 'kalender')}>
                  <option value="kerja">Hari kerja</option>
                  <option value="kalender">Hari kalender</option>
                </select>
              </span>
            </>
          ) : (
            <DateField label="Tanggal tenggat" value={date} onChange={setDate} min={TL_CREATE_NOW.slice(0, 10)} today={TL_CREATE_NOW.slice(0, 10)} style={{ width: 190 }} />
          )}
        </div>
        <span className="p-help">{dueDate ? `Perkiraan ${formatDate(dueDate)}.` : 'Isi durasi atau pilih tanggal.'}</span>
        {afterIncidentDue && (
          <div className="in-bn info sm">
            <svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01" /></svg>
            <div className="body">Tenggat ini setelah tenggat penanganan insiden ({formatDate(i.handleDueAt!)}). Insiden tetap bisa ditutup sebelum tindak lanjut selesai.</div>
          </div>
        )}
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Bukti selesai <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
        <span className="p-input">
          <input className="tl-field" aria-label="Bukti selesai" maxLength={MAX_EVIDENCE_HINT} placeholder="Mis. foto kondisi setelah diperbaiki" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
        </span>
        <span className="p-help row"><span>Bukti yang diharapkan dari PIC saat mengajukan selesai.</span><span>{evidence.length}/{MAX_EVIDENCE_HINT}</span></span>
      </div>
      {err && <span className="p-help err" role="alert">{err}</span>}
      <span className="p-cap">Anda menjadi pemberi tugas dan pemeriksa. Bila PIC insiden berganti, peran ini ikut pindah.</span>
    </Modal>
  );
}
