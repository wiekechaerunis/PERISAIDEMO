// Popover filter (board Main-Filter, B-16): Status dan Keparahan (chip pilih-banyak), Kategori dan WK (dropdown), PIC penanganan
// (dropdown pilih-banyak, Saya dan Belum ada PIC paling atas), Periode kejadian (chip), Lainnya (checkbox).
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SEV_DOT, SEV_LABEL, SEVERITIES } from '@/lib/severity';
import { STATUS_LABEL } from '@/services/types';
import { KATEGORI_OPTIONS, STATUS_OPTIONS } from '../../logic/list';
import type { PeriodDraft } from '../../logic/period';
import { PeriodField } from './PeriodField';

export type FilterKey = 'sev' | 'st' | 'pic' | 'flags' | 'kat' | 'wk';
export interface Filters {
  sev: string[];
  st: string[];
  pic: string[];
  flags: string[];
  kat: string[];
  wk: string[];
}
export const EMPTY_FILTERS: Filters = { sev: [], st: [], pic: [], flags: [], kat: [], wk: [] };

const PIC_DEFS = ['Saya', 'Belum ada PIC', 'Andi Pratama', 'Dedi Kurniawan', 'Budi Santoso', 'Tim Pengamanan ADR Area 2'];
export const WK_DEFS = ['WK Andalas Darat', 'WK Batu Ampar'];
export const FLAG_DEFS = ['Lewat tenggat', 'Dieskalasi', 'Ditandai kemungkinan ganda'];

interface Props {
  f: Filters;
  count: number;
  rowCount: number;
  toggle: (k: FilterKey, v: string) => void;
  onClear: () => void;
  /** Tampilkan: terapkan periode (pilihan lain sudah langsung berlaku) lalu tutup panel */
  onApply: () => void;
  period: PeriodDraft;
  onPeriodChange: (d: PeriodDraft) => void;
  /** false bila rentang khusus belum lengkap atau tidak valid */
  periodOk: boolean;
  /** ISO WIB dari demoNow() */
  now: string;
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

/** Dropdown pilih-banyak di dalam panel (daftar terbuka ikut alur panel supaya tidak terpotong area gulir, lihat D-P6). */
function MultiSelect({ label, all, opts, picked, onToggle }: { label: string; all: string; opts: string[]; picked: string[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const text = picked.length === 0 ? all : picked.length === 1 ? picked[0] : `${picked.length} dipilih`;
  return (
    <div className="ls-sec">
      <span className="p-lbl">{label}</span>
      <button type="button" className="p-input ls-dd-btn" aria-haspopup="true" aria-expanded={open} aria-label={`${label}: ${text}`} onClick={() => setOpen(!open)}>
        <span style={{ flex: 1, color: picked.length ? undefined : 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
        <Icon name="chevDown" size={16} />
      </button>
      {open && (
        <div className="p-pop ls-dd" role="group" aria-label={label}>
          {opts.map((o) => (
            <div key={o} className="row" style={{ justifyContent: 'flex-start' }}>
              <Check on={picked.includes(o)} label={o} onClick={() => onToggle(o)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterPopover({ f, count, rowCount, toggle, onClear, onApply, period, onPeriodChange, periodOk, now }: Props) {
  return (
    <div className="p-pop ls-pop" role="dialog" aria-label="Filter insiden">
      <div style={{ padding: '14px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 15 }}>Filter</b>
        <span className="p-cap">{count ? count + ' filter aktif' : 'Belum ada filter'}</span>
      </div>
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ls-sec">
          <span className="p-lbl">Status <span className="ls-o">· bisa pilih lebih dari satu</span></span>
          <div className="in-chips" style={{ flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map((s) => (
              <button key={s} type="button" className="p-chip" aria-pressed={f.st.includes(s)} onClick={() => toggle('st', s)}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="ls-sec">
          <span className="p-lbl">Keparahan <span className="ls-o">· bisa pilih lebih dari satu</span></span>
          <div className="in-chips" style={{ flexWrap: 'wrap' }}>
            {[...SEVERITIES].reverse().map((s) => (
              <button key={s} type="button" className="p-chip" aria-pressed={f.sev.includes(s)} onClick={() => toggle('sev', s)}>
                <span className="dot" style={{ background: SEV_DOT[s] }}></span>
                {SEV_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
          <MultiSelect label="Kategori" all="Semua kategori" opts={[...KATEGORI_OPTIONS]} picked={f.kat} onToggle={(v) => toggle('kat', v)} />
          <MultiSelect label="Wilayah kerja" all="Semua WK" opts={WK_DEFS} picked={f.wk} onToggle={(v) => toggle('wk', v)} />
        </div>
        <MultiSelect label="PIC penanganan" all="Semua PIC" opts={PIC_DEFS} picked={f.pic} onToggle={(v) => toggle('pic', v)} />
        <PeriodField draft={period} onChange={onPeriodChange} now={now} />
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
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={onApply} disabled={!periodOk || rowCount === 0}>
          {!periodOk ? 'Tampilkan insiden' : rowCount === 0 ? 'Tidak ada insiden' : `Tampilkan ${rowCount} insiden`}
        </button>
      </div>
    </div>
  );
}
