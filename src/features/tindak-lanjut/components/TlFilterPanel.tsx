// Panel Filter (T36 KKKS, T36K SKK): chip status, tenggat, sumber, PIC, pemeriksa, saklar dibatalkan. Hasil dihitung langsung.
import type { FollowUpStatus } from '@/services/types';
import { EMPTY_TL_FILTER, MOD_LABEL, type TlFilter } from '../logic/followups';

interface Props {
  value: TlFilter;
  skk: boolean;
  /** jumlah hasil dengan filter ini */
  count: number;
  onChange: (v: TlFilter) => void;
  onClose: () => void;
}

const STATUS: FollowUpStatus[] = ['belum-dimulai', 'berjalan', 'menunggu-verifikasi', 'selesai'];
const STATUS_SKK: FollowUpStatus[] = ['selesai', 'dibatalkan'];
const SOURCE = [['insiden', 'Insiden'], ['kerawanan', 'Kerawanan'], ['arahan', 'Arahan SKK']] as const;

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const Chip = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
  <button type="button" className="p-chip" aria-pressed={on} onClick={onClick}>{label}</button>
);

export function TlFilterPanel({ value, skk, count, onChange, onClose }: Props) {
  const set = (p: Partial<TlFilter>) => onChange({ ...value, ...p });
  return (
    <div className="p-pop tl-fp" role="dialog" aria-label={skk ? 'Filter tindak lanjut SKK' : 'Filter tindak lanjut'}>
      <div className="p-head"><b>Filter</b></div>
      <div className="p-field">
        <span className="p-lbl">Status</span>
        <div className="in-chips" role="group" aria-label="Status">
          {(skk ? STATUS_SKK : STATUS).map((s) => <Chip key={s} on={value.status.includes(s)} label={MOD_LABEL[s]} onClick={() => set({ status: toggle(value.status, s) })} />)}
        </div>
      </div>
      {!skk && (
        <div className="p-field">
          <span className="p-lbl">Tenggat</span>
          <div className="in-chips" role="group" aria-label="Tenggat">
            <Chip on={value.due === 'late'} label="Terlambat" onClick={() => set({ due: value.due === 'late' ? null : 'late' })} />
            <Chip on={value.due === 'week'} label="Jatuh tempo minggu ini" onClick={() => set({ due: value.due === 'week' ? null : 'week' })} />
          </div>
        </div>
      )}
      <div className="p-field">
        <span className="p-lbl">Sumber</span>
        <div className="in-chips" role="group" aria-label="Sumber">
          {SOURCE.map(([k, l]) => <Chip key={k} on={value.source.includes(k)} label={l} onClick={() => set({ source: toggle(value.source, k) })} />)}
        </div>
      </div>
      {!skk && (
        <>
          <div className="p-field">
            <span className="p-lbl">PIC</span>
            <label className="p-input"><input aria-label="PIC" placeholder="Semua PIC" value={value.pic} onChange={(e) => set({ pic: e.target.value })} className="tl-bare" /></label>
          </div>
          <div className="p-field">
            <span className="p-lbl">Pemeriksa</span>
            <label className="p-input"><input aria-label="Pemeriksa" placeholder="Semua pemeriksa" value={value.giver} onChange={(e) => set({ giver: e.target.value })} className="tl-bare" /></label>
          </div>
          <label className="tl-sw">
            <input type="checkbox" role="switch" checked={value.showCancelled} onChange={(e) => set({ showCancelled: e.target.checked })} />
            <span>Tampilkan yang dibatalkan</span>
          </label>
        </>
      )}
      <div className="p-foot">
        <button type="button" className="p-link" onClick={() => onChange(EMPTY_TL_FILTER)}>Atur ulang</button>
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={onClose}>Terapkan · {count} tindak lanjut</button>
      </div>
    </div>
  );
}
