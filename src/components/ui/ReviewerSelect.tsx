// "Diperiksa oleh" (pola WFL-01 FR-WF-37, sama dengan WP&B; tampilan board I14m, B-14): combobox pilih-banyak berisi chip per orang
// (× hapus). Saat terbuka: cari, "Pilih semua · {judul}" + hitungan, daftar bercentang (nama, jabatan, "(Anda)").
// Bawaan semua terpilih. Mode `allowEmpty` (modal Ajukan): kosong → "Pilih minimal satu pemeriksa." dan pemanggil menonaktifkan aksi;
// tanpa mode itu nama terakhir tidak bisa dilepas (minimal satu).
import { useRef, useState } from 'react';
import { useDismiss } from './useDismiss';
import { Icon } from './Icon';
import { reviewerTitle as titleOf } from '@/lib/rbac';

interface Props {
  options: string[];
  /** null = semua terpilih (bawaan) */
  value: string[] | null;
  onChange: (v: string[] | null) => void;
  label?: string;
  id?: string;
  /** boleh dikosongkan (galat ditampilkan, pemanggil menonaktifkan aksi) */
  allowEmpty?: boolean;
  /** nama pengguna aktif: ditandai "(Anda)" bila ada di daftar (ADJ-01) */
  self?: string;
  /** teks bantuan di bawah isian; bawaan REVIEWER_HELP */
  help?: string;
  /** judul grup di "Pilih semua · …" */
  groupTitle?: string;
}

export const REVIEWER_HELP = 'Bawaan semua terpilih, minimal satu. Yang memutus lebih dulu menyelesaikan tugas; yang lain tidak bisa melanjutkan.';
export const REVIEWER_EMPTY = 'Pilih minimal satu pemeriksa.';

export function ReviewerSelect({
  options, value, onChange, label = 'Diperiksa oleh', id = 'diperiksa-oleh', allowEmpty = false, self, help = REVIEWER_HELP,
  groupTitle = 'Semua Pejabat Berwenang',
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const picked = value ? options.filter((o) => value.includes(o)) : options;
  const all = picked.length === options.length;
  const empty = picked.length === 0;
  useDismiss(open, box, () => setOpen(false));

  const emit = (next: string[]) => onChange(next.length === options.length ? null : next);
  const toggle = (name: string) => {
    const on = picked.includes(name);
    if (on && picked.length === 1 && !allowEmpty) return; // minimal satu
    emit(on ? picked.filter((p) => p !== name) : options.filter((o) => picked.includes(o) || o === name));
  };
  const toggleAll = () => {
    if (all) {
      if (allowEmpty) emit([]);
    } else emit(options);
  };
  const shown = options.filter((o) => !q.trim() || `${o} ${titleOf(o)}`.toLowerCase().includes(q.trim().toLowerCase()));
  const nameOf = (o: string) => (o === self ? `${o} (Anda)` : o);

  return (
    <div className="p-field rv-cbx" ref={box} style={{ gap: 6 }}>
      <span className="p-lbl" id={`${id}-l`} style={{ color: 'var(--ink)' }}>{label}<span className="p-req">*</span></span>
      <div className="rv-w">
        <div
          className={'p-input rv-box' + (empty ? ' err' : open ? ' focus' : '')} id={id} role="combobox" tabIndex={0}
          aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l`}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          {empty && <span className="ph">Pilih pemeriksa</span>}
          {picked.map((p) => (
            <span key={p} className="p-pill">
              <b>{nameOf(p)}</b>
              <button
                type="button" className="rv-x" aria-label={`Hapus ${p}`}
                onClick={(e) => { e.stopPropagation(); toggle(p); }}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
          <Icon name="chevDown" size={16} className="car" />
        </div>
        {open && (
          <div className="p-pop" role="listbox" aria-multiselectable="true" aria-label={groupTitle}>
            <label className="p-input srch">
              <Icon name="search" size={15} style={{ color: 'var(--ink-muted)' }} />
              <input
                aria-label="Cari nama atau jabatan" placeholder="Cari nama atau jabatan" value={q} onChange={(e) => setQ(e.target.value)}
                style={{ flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', minWidth: 0 }}
              />
            </label>
            <div className="p-list">
              <button type="button" className="p-opt all" onClick={toggleAll}>
                <span className={all ? 'p-check on' : picked.length ? 'p-check ind' : 'p-check'}><Icon name="check" size={11} /></span>
                Pilih semua
                <span className="p-cap" style={{ marginLeft: 'auto', fontWeight: 500 }}>{picked.length} dari {options.length} · {groupTitle}</span>
              </button>
              <div className="sep" aria-hidden="true"></div>
              {shown.map((o) => {
                const on = picked.includes(o);
                return (
                  <button key={o} type="button" className="p-opt" role="option" aria-selected={on} onClick={() => toggle(o)}>
                    <span className={on ? 'p-check on' : 'p-check'}><Icon name="check" size={11} /></span>
                    <span className="mnm">
                      <b>{o}{o === self && <span style={{ fontWeight: 500, color: 'var(--ink-muted)' }}> (Anda)</span>}</b>
                      {titleOf(o) && <span>{titleOf(o)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="ft p-cap">Daftar dari role Pejabat Berwenang di organisasi Anda.</div>
          </div>
        )}
      </div>
      <span className={empty ? 'p-help err' : 'p-help'}>{empty ? REVIEWER_EMPTY : help}</span>
    </div>
  );
}
