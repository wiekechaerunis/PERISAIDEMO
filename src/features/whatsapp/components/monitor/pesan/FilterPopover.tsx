// Popover Filter (papan V2-06, V2-06b). Filter "Diteruskan ke SKK" tidak dibuat (K8).
import { useEffect, useState } from 'react';
import type { WaGroup, WaMessage, WaNumber, WaRule } from '@/services/types';
import { Ic, P } from '../nomor/icons';
import { MultiSelect } from './MultiSelect';
import { NO_FILTER, RANGES, STATUS_KEYS, isFiltering, type Filters, type StatusKey } from './util';

export function FilterPopover({ applied, onApply, numbers, groups, rules, messages }: {
  applied: Filters; onApply: (f: Filters) => void; numbers: WaNumber[]; groups: WaGroup[]; rules: WaRule[]; messages: WaMessage[];
}) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Filters>(applied);
  useEffect(() => { if (open) setD(applied); }, [open, applied]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setD((p) => ({ ...p, [k]: v }));
  const monitored = groups.filter((g) => g.monitored);
  const tags = Array.from(new Set(groups.map((g) => g.wk).filter((x): x is string => !!x)));
  const senders = Array.from(new Set(messages.map((m) => m.sender)));
  const toggleStatus = (s: StatusKey) => set('status', d.status.includes(s) ? d.status.filter((x) => x !== s) : [...d.status, s]);
  return (
    <div className="relative">
      <button aria-haspopup="dialog" aria-expanded={open} aria-controls="wa-filter" type="button" className="pr-btn pr-btn--secondary pr-btn--sm" onClick={() => setOpen(!open)}>
        <Ic d={P.rules} />Filter
      </button>
      {open && (
        <div id="wa-filter" role="dialog" aria-label="Filter" className="pr-popover">
          <div className="pr-popover__head">
            <h3>Filter</h3>
            <button type="button" className="pr-close" aria-label="Tutup filter" onClick={() => setOpen(false)}><Ic d={P.close} /></button>
          </div>
          <div className="pr-popover__body">
            <fieldset>
              <legend>Status <span className="v2-hint" style={{ display: 'inline', margin: 0 }}>· bisa pilih lebih dari satu</span></legend>
              <div className="pr-chipset">
                {STATUS_KEYS.map((s) => <button key={s} type="button" className="pr-chip-opt" aria-pressed={d.status.includes(s)} onClick={() => toggleStatus(s)}>{s}</button>)}
              </div>
            </fieldset>
            {numbers.length > 1 && (
              <fieldset>
                <legend>Nomor</legend>
                <MultiSelect label="Nomor" noun="nomor" placeholder="Semua nomor" value={d.numbers} onChange={(v) => set('numbers', v)} options={numbers.map((n) => ({ value: n.id, label: n.label }))} />
              </fieldset>
            )}
            <fieldset>
              <legend>Tag grup</legend>
              <MultiSelect label="Tag grup" noun="tag" placeholder="Semua tag" value={d.tags} onChange={(v) => set('tags', v)} options={tags.map((t) => ({ value: t, label: t }))} />
            </fieldset>
            <fieldset>
              <legend>Grup</legend>
              <MultiSelect
                label="Grup" noun="grup dipantau" placeholder="Semua grup" value={d.groups} onChange={(v) => set('groups', v)} subIcon
                options={monitored.map((g) => ({ value: g.id, label: g.name, sub: numbers.find((n) => n.id === g.numberId)?.label }))}
              />
              <span className="v2-hint">Hanya grup yang dipantau. Bisa pilih lebih dari satu.</span>
            </fieldset>
            <fieldset>
              <legend>Pengirim</legend>
              <MultiSelect label="Pengirim" noun="pengirim" placeholder="Semua pengirim" value={d.senders} onChange={(v) => set('senders', v)} options={senders.map((s) => ({ value: s, label: s }))} />
            </fieldset>
            <fieldset>
              <legend>Aturan</legend>
              <MultiSelect label="Aturan" noun="aturan" placeholder="Semua aturan" value={d.rules} onChange={(v) => set('rules', v)} options={rules.map((r) => ({ value: r.id, label: r.name }))} />
            </fieldset>
            <fieldset>
              <legend>Dikirim</legend>
              <div className="pr-chipset">
                {RANGES.map((r) => <button key={r.key} type="button" className="pr-chip-opt" aria-pressed={d.range === r.key} onClick={() => set('range', d.range === r.key ? '' : r.key)}>{r.label}</button>)}
              </div>
              {d.range === 'rentang' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" className="pr-input pr-input--sm" aria-label="Dari tanggal" value={d.from} onChange={(e) => set('from', e.target.value)} />
                  <input type="date" className="pr-input pr-input--sm" aria-label="Sampai tanggal" value={d.to} onChange={(e) => set('to', e.target.value)} />
                </div>
              )}
            </fieldset>
          </div>
          <div className="pr-popover__foot">
            <button type="button" className="pr-applied__clear" onClick={() => { setD(NO_FILTER); onApply(NO_FILTER); }}>Hapus filter</button>
            <button type="button" className="pr-btn pr-btn--primary pr-btn--sm" onClick={() => { onApply(d); setOpen(false); }}>Terapkan</button>
          </div>
        </div>
      )}
      {!open && isFiltering(applied) && <span className="sr-only" role="status">Filter aktif</span>}
    </div>
  );
}
