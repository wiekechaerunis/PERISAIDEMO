// Dialog dan panel tab Grup: Pantau (V2-53/53b), Ubah (V2-55), Anggota (V2-56), Berhenti memantau (V2-57).
import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { MAX_GROUP_DESC } from '@/services/mock/workflow.wamon';
import type { WaGroup, WaNumber } from '@/services/types';
import { WK } from '../shared';
import { Dlg, IC, Ic, TagInput, V2Select } from './parts';

/** Area contoh per wilayah kerja (prototipe). Wilayah kerja tanpa entri belum punya area. */
export const AREAS: Record<string, string[]> = { 'WK Andalas Darat': ['Musi Banyuasin', 'Muara Enim', 'Prabumulih'] };

export const memberCount = (g: WaGroup) => 1 + (g.members?.length ?? 0);
export const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '').replace(/^0/, '');
  return `+62 ${d.slice(0, 3)}-****-${d.slice(-4)}`;
};

export interface GroupForm { wk: string; area: string; tags: string[]; description: string }

/** Pantau (mode "watch") dan Ubah (mode "edit"): satu formulir, judul dan tombol berbeda. */
export function GroupFormDialog({ mode, group, number, onClose, onSubmit }: {
  mode: 'watch' | 'edit'; group: WaGroup; number?: WaNumber; onClose: () => void; onSubmit: (f: GroupForm) => string | null;
}) {
  const [f, setF] = useState<GroupForm>({ wk: group.wk ?? '', area: group.area ?? '', tags: group.tags ?? [], description: group.description ?? '' });
  const [err, setErr] = useState('');
  const areas = AREAS[f.wk] ?? [];
  const tid = mode === 'watch' ? 'wa-watch' : 'wa-group-edit';
  const submit = () => {
    const e = onSubmit(f);
    if (e) setErr(e);
  };
  return (
    <Dlg labelledBy={tid} className="pr-dialog pr-dialog--md" onClose={onClose}>
      <div className="pr-dialog__frame">
        <header className="pr-dialog__head">
          <div className="min-w-0">
            <h2 id={tid}>{mode === 'watch' ? `Pantau "${group.name}"?` : `Ubah "${group.name}"`}</h2>
            <p>{memberCount(group)} anggota · {number?.label ?? ''}</p>
          </div>
          <button type="button" className="pr-close" aria-label="Tutup dialog" onClick={onClose}><Ic d={IC.x} /></button>
        </header>
        <div className="pr-dialog__body">
          <div className="pr-field">
            <label htmlFor="wa-watch-wk" className="pr-label">Wilayah kerja<span aria-hidden="true" className="pr-req">*</span></label>
            <V2Select id="wa-watch-wk" value={f.wk} invalid={!!err} placeholder="Pilih wilayah kerja" options={WK.map((w) => ({ value: w, label: w }))}
              onChange={(v) => { setErr(''); setF({ ...f, wk: v, area: '' }); }} />
            {err && <p className="pr-help" role="alert" style={{ color: 'var(--error-ink)' }}>{err}</p>}
          </div>
          <div className="pr-field">
            <label htmlFor="wa-watch-area" className="pr-label">Area <span className="font-medium text-ink-muted">(opsional)</span></label>
            <V2Select id="wa-watch-area" value={f.area} disabled={areas.length === 0} placeholder={f.wk ? 'Wilayah kerja ini belum punya area' : 'Pilih wilayah kerja dulu'}
              options={areas.map((a) => ({ value: a, label: a }))} onChange={(v) => setF({ ...f, area: v })} />
          </div>
          <TagInput id={`${tid}-tag`} tags={f.tags} onChange={(tags) => setF({ ...f, tags })} />
          <div className="pr-field">
            <label htmlFor="wa-watch-desc" className="pr-label">Keterangan <span className="font-medium text-ink-muted">(opsional)</span></label>
            <textarea id="wa-watch-desc" aria-invalid="false" aria-describedby="wa-watch-desc-hint" rows={3} maxLength={MAX_GROUP_DESC} className="pr-input h-auto py-2"
              placeholder="Laporan situasi tiap 6 jam dari Danru pos 1–5" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <p id="wa-watch-desc-hint" className="pr-help">Untuk peninjau: isi grup ini dan siapa pelapornya. {f.description.length}/{MAX_GROUP_DESC}</p>
          </div>
          {mode === 'watch' && (
            <div className="pr-note"><Ic d={IC.note} size={16} /><span>Mulai dibaca sejak sekarang. Pesan sebelum grup dipantau tidak dibaca. Pastikan anggota grup sudah diberi tahu.</span></div>
          )}
        </div>
        <footer className="pr-dialog__foot">
          <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={onClose}>Batal</button>
          <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={submit}>{mode === 'watch' ? 'Pantau grup' : 'Simpan'}</button>
        </footer>
      </div>
    </Dlg>
  );
}

export function StopDialog({ group, number, onClose, onConfirm }: { group: WaGroup; number?: WaNumber; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dlg labelledBy="v2-stop" className="pr-dialog pr-dialog--md" onClose={onClose}>
      <div className="pr-dialog__frame">
        <header className="pr-dialog__head">
          <div className="min-w-0"><h2 id="v2-stop">Berhenti memantau "{group.name}"?</h2><p>{memberCount(group)} anggota · {number?.label ?? ''}</p></div>
          <button type="button" className="pr-close" aria-label="Tutup dialog" onClick={onClose}><Ic d={IC.x} /></button>
        </header>
        <div className="pr-dialog__body">
          <p style={{ margin: 0 }}>Pesan baru di grup ini tidak dibaca lagi. Pesan yang sudah masuk tetap ada di Pesan masuk.</p>
          <p style={{ margin: 0 }} className="pr-help">Grup ini hilang dari daftar. Untuk memantau lagi, cari namanya di kolom pencarian.</p>
        </div>
        <footer className="pr-dialog__foot">
          <button type="button" className="pr-btn pr-btn--secondary pr-btn--md" onClick={onClose}>Batal</button>
          <button type="button" className="pr-btn pr-btn--md v2-danger" onClick={onConfirm}>Berhenti memantau</button>
        </footer>
      </div>
    </Dlg>
  );
}

const initials = (n: string) => n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export function MembersPanel({ group, number, onClose }: { group: WaGroup; number?: WaNumber; onClose: () => void }) {
  const [q, setQ] = useState('');
  const self = { name: 'Nomor ini', phone: maskPhone(number?.phone ?? ''), self: true };
  const all = [self, ...(group.members ?? []).map((m) => ({ ...m, self: false }))];
  const t = q.trim().toLowerCase();
  const rows = t ? all.filter((m) => (m.name ?? 'tanpa nama whatsapp').toLowerCase().includes(t) || m.phone.includes(t)) : all;
  const at = group.membersAt ?? number?.linkedAt;
  return (
    <Dlg labelledBy="wa-members-title" className="pr-sidepanel wa-panel" onClose={onClose}>
      <div className="pr-sidepanel__head">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-0.5">
            <h2 id="wa-members-title">Anggota {group.name}</h2>
            <span className="pr-help">{all.length} anggota · {at ? `diperbarui ${formatDate(at)}, saat nomor tersambung` : 'belum pernah diperbarui'}</span>
          </div>
        </div>
        <button type="button" className="pr-close" aria-label="Tutup panel" onClick={onClose}><Ic d={IC.x} /></button>
      </div>
      <div className="pr-sidepanel__body">
        <div className="pr-search !w-full mb-3" role="search">
          <Ic d={IC.search} />
          <input type="search" className="pr-input pr-input--sm" placeholder="Cari nama" aria-label="Cari nama anggota" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="wa-members">
          {rows.map((m) => (
            <div className="wa-member" key={m.phone + (m.name ?? '')}>
              <span className="wa-av" aria-hidden="true">{m.self ? <Ic d={IC.phone} /> : m.name ? initials(m.name) : '?'}</span>
              <span className="min-w-0"><b>{m.name ?? 'Tanpa nama WhatsApp'}</b><span className="wa-num">{m.phone}</span></span>
              {m.self ? <span className="pr-tag pr-tag--muted">PERISAI</span> : <span />}
            </div>
          ))}
          {rows.length === 0 && <p className="pr-help" style={{ margin: 0, padding: '12px 0' }}>Tidak ada anggota yang cocok dengan “{q}”.</p>}
        </div>
      </div>
      <div className="pr-sidepanel__foot"><span className="pr-help mr-auto">Nomor disamarkan. Anggota bisa dipilih di aturan “Pengirim: orang tertentu”.</span></div>
    </Dlg>
  );
}
