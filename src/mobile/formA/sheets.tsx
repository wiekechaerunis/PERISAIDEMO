// Bottom sheet pilihan langkah 1–2: Kategori (MS14), Jenis (MS15), Wilayah kerja (MS13), Tim terlibat/mitra (M3).
import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '../ui/BottomSheet';
import { PARTNER_OPTS } from '@/features/insiden/logic/handling';
import { CONTRACT_OPTIONS } from '@/features/insiden/logic/closure';

export interface PickOption {
  key: string;
  label: string;
  desc?: string;
}

const ROW = { display: 'flex', gap: 12, alignItems: 'center', width: '100%', minHeight: 56, padding: '8px 16px', border: 0, font: 'inherit', textAlign: 'left', color: 'var(--ink)', cursor: 'pointer' } as const;
const GRP = { padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--ink-muted)' } as const;

/** Sheet pilih-satu dengan pencarian dan tombol Terapkan (board MS14 Kategori, MS15 Jenis). */
export function PickerSheet({
  title, searchLabel, group, options, selected, onApply, onClose,
}: { title: string; searchLabel: string; group: string; options: PickOption[]; selected: string | null; onApply: (key: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [pending, setPending] = useState<string | null>(selected);
  const shown = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="ks-t" style={{ maxHeight: '92%' }}>
        <div className="grab" aria-hidden="true"></div>
        <div style={{ padding: '4px 16px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b id="ks-t" style={{ fontSize: 17, lineHeight: '24px' }}>{title}</b>
          <label className="p-input" style={{ height: 44 }}>
            <Icon name="search" size={16} />
            <input
              aria-label={searchLabel} placeholder={searchLabel} value={q} onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }}
            />
          </label>
        </div>
        <div role="listbox" aria-label={title} style={{ overflow: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={GRP}>{group}</div>
          {shown.map((o) => {
            const on = pending === o.key;
            return (
              <button key={o.key} type="button" role="option" aria-selected={on} onClick={() => setPending(o.key)} style={{ ...ROW, background: on ? 'var(--action-subtle-bg)' : 'none' }}>
                <span className={on ? 'p-radio on' : 'p-radio'} aria-hidden="true"></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <b>{o.label}</b>
                  {o.desc && <span className="p-cap">{o.desc}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="sf" style={{ marginTop: 8 }}>
          <button type="button" className="p-btn p-btn-primary" disabled={pending === null} onClick={() => pending !== null && onApply(pending)}>Terapkan</button>
        </div>
      </div>
    </>
  );
}

/** Sheet Wilayah kerja untuk lokasi di luar cakupan WK (board MS13). */
export function WkSheet({ options, selected, onPick, onClose }: { options: string[]; selected: string; onPick: (wk: string) => void; onClose: () => void }) {
  return (
    <BottomSheet title="Wilayah kerja" onClose={onClose}>
      <div role="listbox" aria-label="Wilayah kerja" style={{ margin: '0 -16px' }}>
        {options.map((w) => (
          <button key={w} type="button" role="option" aria-selected={selected === w} onClick={() => onPick(w)} style={{ ...ROW, background: selected === w ? 'var(--action-subtle-bg)' : 'none' }}>
            <span className={selected === w ? 'p-radio on' : 'p-radio'} aria-hidden="true"></span>
            <b>{w}</b>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

const SHIELD = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const BAN = 'M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z';
const nameOf = (full: string) => full.split(' · ')[0];
const typeOf = (full: string) => full.split(' · ')[1] ?? '';
const TYPE_LABEL: Record<string, string> = { Polri: 'PKS POLRI', TNI: 'PKT TNI', BUJP: 'BUJP' };

/** Sheet "Tim terlibat" (board M3): pilih mitra dari kontrak aktif WK. Mengembalikan nama mitra terpilih. */
export function MitraSheet({ wk, selected, onSave, onClose }: { wk: string; selected: string[]; onSave: (names: string[]) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>(selected);
  const toggle = (n: string) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const partners = PARTNER_OPTS.filter((p) => p.type !== 'int').map((p) => p.name);
  const active = partners.filter((n) => CONTRACT_OPTIONS[nameOf(n)]);
  const others = partners.filter((n) => !CONTRACT_OPTIONS[nameOf(n)]);
  const match = (n: string) => `${n} ${(CONTRACT_OPTIONS[nameOf(n)] ?? []).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase());
  const row = (n: string) => {
    const on = sel.includes(n);
    const ref = CONTRACT_OPTIONS[nameOf(n)]?.[0];
    return (
      <button key={n} type="button" className={on ? 'op on' : 'op'} role="checkbox" aria-checked={on} onClick={() => toggle(n)}>
        <span className="in-mi"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d={SHIELD} /></svg></span>
        <span className="t"><b>{nameOf(n)}</b><span>{TYPE_LABEL[typeOf(n)] ?? typeOf(n)}{ref && <> · <span className="p-mono">{ref}</span></>}</span></span>
        {on && <Icon name="check" size={16} />}
      </button>
    );
  };
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" style={{ height: '78%' }}>
        <div className="grab" aria-hidden="true"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 8px 16px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b id="sh-t" style={{ fontSize: 16 }}>Tim terlibat</b>
            <span className="p-cap">Siapa saja yang ikut menangani. Boleh lebih dari satu.</span>
          </span>
          <button type="button" className="ib44" aria-label="Tutup" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: '0 16px 8px 16px' }}>
          <label className="p-input">
            <Icon name="search" size={16} />
            <input aria-label="Cari mitra atau nomor kontrak" placeholder="Cari mitra atau nomor kontrak" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 }} />
          </label>
        </div>
        <div className="in-pop" style={{ position: 'static', boxShadow: 'none', borderRadius: 0, flex: 1, overflow: 'auto' }}>
          {active.filter(match).length > 0 && <div className="grp">Kontrak aktif di {wk}</div>}
          {active.filter(match).map(row)}
          {others.filter(match).length > 0 && <div className="grp">Mitra lain</div>}
          {others.filter(match).map(row)}
          <div className="sep"></div>
          <button type="button" className="op" onClick={() => onSave([])}>
            <span className="in-mi"><svg className="p-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}><path d={BAN} /></svg></span>
            <span className="t"><b>Hanya security internal</b><span>Tidak ada BUJP, TNI, atau Polri yang terlibat</span></span>
          </button>
        </div>
        <div style={{ padding: '10px 16px 18px 16px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="p-btn p-btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }} onClick={() => onSave(sel)}>Simpan · {sel.length} dipilih</button>
        </div>
      </div>
    </>
  );
}
