// Popover filter lengkap (board Main-Filter): PIC, Status, Keparahan, Kategori (19), Wilayah kerja, Periode, Lainnya.
import { Icon } from '@/components/ui/Icon';
import { SEV_DOT, SEV_LABEL, SEVERITIES } from '@/lib/severity';
import { STATUS_LABEL } from '@/services/types';
import { KATEGORI_OPTIONS, STATUS_OPTIONS } from '../../logic/list';

export type FilterKey = 'sev' | 'st' | 'pic' | 'flags' | 'kat';
export interface Filters {
  sev: string[];
  st: string[];
  pic: string[];
  flags: string[];
  kat: string[];
}
export const EMPTY_FILTERS: Filters = { sev: [], st: [], pic: [], flags: [], kat: [] };

const PIC_DEFS = ['Saya', 'Andi Pratama', 'Dedi Kurniawan', 'Belum ada PIC'];
export const FLAG_DEFS = ['Lewat tenggat', 'Dieskalasi', 'Ditandai kemungkinan ganda'];

interface Props {
  f: Filters;
  count: number;
  rowCount: number;
  toggle: (k: FilterKey, v: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function Select({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div className="p-input" style={{ height: 36 }}>
      <span style={{ flex: 1, color: muted ? 'var(--ink-muted)' : undefined }}>{text}</span>
      <Icon name="chevDown" size={16} />
    </div>
  );
}

function Check({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className="ls-check">
      <span className={on ? 'p-check on' : 'p-check'}>
        <Icon name="check" size={11} />
      </span>
      {label}
    </button>
  );
}

export function FilterPopover({ f, count, rowCount, toggle, onClear, onClose }: Props) {
  return (
    <div className="p-pop ls-pop" role="dialog" aria-label="Filter insiden">
      <div style={{ padding: '14px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 15 }}>Filter</b>
        <span className="p-cap">{count ? count + ' filter aktif' : 'Belum ada filter'}</span>
      </div>
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ls-sec">
          <span className="p-lbl">PIC penanganan</span>
          <div className="in-chips" style={{ flexWrap: 'wrap' }}>
            {PIC_DEFS.map((o) => (
              <button key={o} type="button" className="p-chip" aria-pressed={f.pic.includes(o)} onClick={() => toggle('pic', o)}>
                {o}
              </button>
            ))}
          </div>
          <div className="p-input" style={{ height: 36 }}>
            <Icon name="search" size={15} style={{ color: 'var(--ink-muted)' }} />
            <span className="ph" style={{ flex: 1 }}>
              Cari nama PIC lain
            </span>
          </div>
        </div>
        <div className="ls-sec">
          <span className="p-lbl">Status</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {STATUS_OPTIONS.map((s) => (
              <Check key={s} on={f.st.includes(s)} label={STATUS_LABEL[s]} onClick={() => toggle('st', s)} />
            ))}
          </div>
        </div>
        <div className="ls-sec">
          <span className="p-lbl">Keparahan</span>
          <div className="in-chips" style={{ flexWrap: 'wrap' }}>
            {[...SEVERITIES].reverse().map((s) => (
              <button key={s} type="button" className="p-chip" aria-pressed={f.sev.includes(s)} onClick={() => toggle('sev', s)}>
                <span className="dot" style={{ background: SEV_DOT[s] }}></span>
                {SEV_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ls-sec">
            <span className="p-lbl">Kategori</span>
            <div className="in-chips" style={{ flexWrap: 'wrap' }}>
              {KATEGORI_OPTIONS.map((o) => (
                <button key={o} type="button" className="p-chip" aria-pressed={f.kat.includes(o)} onClick={() => toggle('kat', o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="ls-sec">
            <span className="p-lbl">Wilayah kerja</span>
            <Select text="Semua WK" muted />
          </div>
        </div>
        <div className="ls-sec">
          <span className="p-lbl">Periode kejadian</span>
          <Select text="30 hari terakhir" />
        </div>
        <div className="ls-sec">
          <span className="p-lbl">Lainnya</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FLAG_DEFS.map((l) => (
              <Check key={l} on={f.flags.includes(l)} label={l} onClick={() => toggle('flags', l)} />
            ))}
          </div>
        </div>
      </div>
      <div className="p-foot">
        <button type="button" className="p-link" onClick={onClear}>
          Hapus filter
        </button>
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={onClose}>
          Tampilkan {rowCount} insiden
        </button>
      </div>
    </div>
  );
}
