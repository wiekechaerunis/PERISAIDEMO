// Dialog layar detail Kerawanan: Naikkan jadi insiden · pilih (KD2) dan Tambah perkembangan (KD6).
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '../review/ReviewDialogs';
import { Ic } from '../review/parts';
import { MAX_PROGRESS } from '@/services/mock/workflow.kerawanan';

export type RaisePick = 'a' | 'b';

const ICONS: Record<RaisePick, string> = {
  a: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 12l-4-4-4 4M12 16V8',
  b: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6',
};

interface RaiseProps {
  krwNo: string;
  location: string;
  onClose: () => void;
  onNext: (pick: RaisePick) => void;
}

/** KD2: "Apa yang sebenarnya terjadi?" Dua cabang; Lanjut ke KD3 (a) atau Laporan baru (b). */
export function RaiseDialog({ krwNo, location, onClose, onNext }: RaiseProps) {
  const [pick, setPick] = useState<RaisePick>('a');
  const opts: [RaisePick, string, string, string][] = [
    [
      'a', 'Kerawanan ini ternyata berdampak',
      'Kejadian yang sama, tetapi ternyata ada kerugian, korban, atau gangguan operasi. Laporan ini menjadi insiden; nomor KRW tetap sebagai asal.',
      'Berikutnya Anda melengkapi kategori, dampak, keparahan, PIC penanganan, dan alasan. Kerawanan ini menjadi insiden itu sendiri (satu catatan), pindah dari tab Kerawanan ke tab Insiden.',
    ],
    [
      'b', 'Terjadi kejadian baru di lokasi ini',
      'Kejadian terpisah dari kerawanan ini. Dibuat laporan insiden baru; kerawanan ini tetap tercatat sebagai kerawanan.',
      `Laporan baru dibuka dengan lokasi ${location} terisi dan tautan Kerawanan terkait: ${krwNo}.`,
    ],
  ];
  const cur = opts.find((o) => o[0] === pick) ?? opts[0];
  return (
    <Modal
      title="Naikkan jadi insiden?" width={520} onClose={onClose}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" onClick={() => onNext(pick)}>Lanjut</button>
        </>
      }
    >
      <span id="dlg-q" style={{ fontWeight: 600 }}>Apa yang sebenarnya terjadi?</span>
      <div role="radiogroup" aria-labelledby="dlg-q" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opts.map(([k, label, desc]) => (
          <button key={k} type="button" role="radio" className="jn" aria-checked={pick === k} onClick={() => setPick(k)}>
            <span className="ic"><Ic d={ICONS[k]} size={15} /></span>
            <span className="tx"><b>{label}</b><span className="p-cap">{desc}</span></span>
          </button>
        ))}
      </div>
      <div className="in-bn info sm" role="status">
        <Icon name="info" size={16} />
        <span>{cur[3]}</span>
      </div>
    </Modal>
  );
}

interface ProgressProps {
  krwNo: string;
  title: string;
  /** Pejabat menaikkan sendiri; selain itu mengajukan */
  canRaise: boolean;
  onClose: () => void;
  onSave: (v: { text: string; worsening: boolean; photos: string[] }) => void;
  onEscalate: () => void;
}

/** KD6: Tambah perkembangan: "Apa yang berubah?" wajib, foto opsional, tanda Makin rawan (Pejabat diberi tahu seketika). */
export function ProgressDialog({ krwNo, title, canRaise, onClose, onSave, onEscalate }: ProgressProps) {
  const [text, setText] = useState('');
  const [worsening, setWorsening] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const err = tried && !text.trim();
  const save = () => (text.trim() ? onSave({ text, worsening, photos }) : setTried(true));
  const pickFiles = () => file.current?.click();
  return (
    <Modal
      title="Tambah perkembangan" width={560} onClose={onClose}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" onClick={save}>Simpan perkembangan</button>
        </>
      }
    >
      <span className="p-cap"><span className="p-mono" style={{ fontSize: 12 }}>{krwNo}</span> · {title}</span>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Apa yang berubah?<span className="p-req">*</span></span>
        <textarea
          className={'p-input p-area' + (err ? ' err' : '')} aria-label="Apa yang berubah?" maxLength={MAX_PROGRESS} value={text}
          style={{ minHeight: 96 }} onChange={(e) => setText(e.target.value)}
        />
        {err && <span className="p-help err" role="alert"><Icon name="warn" size={14} />Isi apa yang berubah.</span>}
        <span className="p-help row"><span>Sejak kerawanan dicatat.</span><span>{text.length}/{MAX_PROGRESS}</span></span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Foto <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}>· opsional</span></span>
        <input
          ref={file} type="file" multiple accept="image/*" className="rb-hide" aria-label="Pilih foto" data-testid="foto-input"
          onChange={(e) => { setPhotos(Array.from(e.target.files ?? []).map((f) => f.name)); e.target.value = ''; }}
        />
        <div className="p-drop">
          <span className="di"><Icon name="upload" size={20} /></span>
          <span style={{ fontSize: 13 }}>Tarik foto ke sini atau <button type="button" className="p-link" onClick={pickFiles}>pilih file</button></span>
          <span className="p-cap">{photos.length ? photos.join(', ') : 'Foto kondisi terbaru di lokasi.'}</span>
        </div>
      </div>
      <button
        type="button" role="checkbox" aria-checked={worsening} onClick={() => setWorsening(!worsening)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, border: 0, background: 'none', padding: 0, font: 'inherit', color: 'var(--ink)', cursor: 'pointer', textAlign: 'left' }}
      >
        <span className={worsening ? 'p-check on' : 'p-check'}><Icon name="check" size={12} /></span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b style={{ fontWeight: 600 }}>Makin rawan, minta perhatian Pejabat Berwenang</b>
          <span className="p-cap">Pejabat langsung diberi tahu, tidak menunggu ringkasan harian.</span>
        </span>
      </button>
      <div className="in-bn info sm" role="status">
        <Icon name="info" size={16} />
        <span>
          Bila sudah ada kerugian, korban, atau gangguan operasi, gunakan{' '}
          <a href="#" className="lk-alink" style={{ fontWeight: 600 }} onClick={(e) => { e.preventDefault(); onEscalate(); }}>
            {canRaise ? 'Naikkan jadi insiden' : 'Ajukan jadi insiden'}
          </a>
        </span>
      </div>
    </Modal>
  );
}
