// Grup (board V2-50..57; V2-40..43 adalah generasi lama dan tidak dipakai).
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';
import { demoNow } from '@/services/mock/clock';
import { useDemoStore } from '@/services/mock/store';
import { setGroupMonitor, stopMonitoring, updateGroup } from '@/services/mock/workflow.wamon';
import type { WaGroup } from '@/services/types';
import { run } from './shared';
import { V2Root } from './V2Root';
import { GroupFormDialog, MembersPanel, StopDialog, memberCount, type GroupForm } from './grup/dialogs';
import { IC, Ic, V2Select } from './grup/parts';

type Dlg = { kind: 'watch' | 'edit' | 'stop' | 'members'; id: string };
const MIN_SEARCH = 3;

export function GrupTab() {
  const groups = useDemoStore((s) => s.waGroups);
  const numbers = useDemoStore((s) => s.waNumbers);
  const messages = useDemoStore((s) => s.waMessages);
  const [numId, setNumId] = useState('');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const number = numbers.find((n) => n.id === numId) ?? numbers[0];
  const mine = groups.filter((g) => g.numberId === number?.id);
  const term = q.trim().toLowerCase();
  const searching = term.length > 0;
  const short = searching && term.length < MIN_SEARCH;
  const today = demoNow().slice(0, 10);
  // Daftar hanya memuat grup dipantau; grup baru dan grup yang nomornya dikeluarkan tetap tampil agar tidak terlewat.
  // Pencarian minimal 3 huruf juga mencari grup yang belum dipantau.
  const rows = mine.filter((g) => {
    const shown = g.monitored || g.isNew || g.removed;
    if (!searching) return !!shown;
    return g.name.toLowerCase().includes(term) && (shown || term.length >= MIN_SEARCH);
  });
  const cur = dlg ? groups.find((g) => g.id === dlg.id) : undefined;
  const close = () => setDlg(null);

  const todayText = (g: WaGroup) => {
    const n = messages.filter((m) => m.groupId === g.id && m.at.slice(0, 10) === today).length;
    return `${n} pesan masuk · ${Math.max(g.checkedToday ?? 0, n)} diperiksa`;
  };
  const save = (g: WaGroup, mode: 'watch' | 'edit', f: GroupForm): string | null => {
    const meta = { tags: f.tags, description: f.description };
    const e = mode === 'watch'
      ? run((s) => setGroupMonitor(s, g.id, true, f.wk, f.area || undefined, meta))
      : run((s) => updateGroup(s, g.id, { wk: f.wk, area: f.area, ...meta }));
    if (e) return e;
    setToast(mode === 'watch' ? `${g.name} mulai dipantau` : `Perubahan ${g.name} disimpan`);
    close();
    return null;
  };

  return (
    <V2Root>
      <div className="pr-stack wa-scope">
        <section className="pr-tcard" aria-label="Grup">
          <div className="pr-tcard__bar" style={short ? { paddingBottom: 28 } : undefined}>
            <h2>{searching ? 'Grup' : 'Grup dipantau'} · {number?.label ?? ''}</h2>
            <div className="pr-tcard__tools">
              <div className="wa-picker">
                <span>Nomor:</span>
                <V2Select inline ariaLabel="Pilih nomor" value={number?.id ?? ''} options={numbers.map((n) => ({ value: n.id, label: n.label }))} onChange={setNumId} />
                <Ic d={IC.chev} className="text-ink-muted -ml-1 mr-1 pointer-events-none" />
              </div>
              <div className="pr-search" role="search">
                <Ic d={IC.search} />
                <input type="search" placeholder="Cari nama grup, termasuk yang belum dipantau" aria-label="Cari nama grup" className="pr-input pr-input--sm" value={q}
                  aria-describedby={short ? 'v2-cari-hint' : undefined} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
                {short && <p className="pr-help v2-shelp" id="v2-cari-hint">Ketik minimal 3 huruf untuk mencari.</p>}
              </div>
            </div>
          </div>
          <div className="pr-table-scroll">
            <table className="pr-table">
              <thead><tr><th>Grup</th><th>Dipantau</th><th>Wilayah kerja · area</th><th>Tag</th><th className="text-right">Anggota</th><th>Hari ini</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {rows.length === 0 && (
                  <tr className="v2-empty"><td colSpan={7}>{searching ? `Tidak ada grup dipantau yang cocok dengan “${q.trim()}”.` : 'Belum ada grup yang dipantau.'}</td></tr>
                )}
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        <a className="pr-row-title hover:underline" href="#anggota" onClick={(e) => { e.preventDefault(); setDlg({ kind: 'members', id: g.id }); }}>{g.name}</a>
                        {g.isNew && <span className="pr-tag pr-tag--neutral">Baru</span>}
                      </span>
                      {g.removed ? <span className="pr-row-sub">Nomor bukan anggota lagi</span> : g.monitored && g.monitoredSince ? <span className="pr-row-sub">Dipantau sejak {formatDate(g.monitoredSince)}</span> : null}
                    </td>
                    <td>
                      <span className="wa-switch-cell">
                        <button type="button" role="switch" aria-checked={g.monitored} className="wa-switch" aria-label={`Pantau ${g.name}`} disabled={g.removed}
                          onClick={() => setDlg({ kind: g.monitored ? 'stop' : 'watch', id: g.id })}><span aria-hidden="true" className="pr-switch" /></button>
                      </span>
                    </td>
                    {g.monitored && g.wk ? <td>{g.wk}{g.area ? ` · ${g.area}` : ''}</td> : <td className="text-ink-muted">Belum diatur</td>}
                    <td>{g.monitored && g.tags?.length ? <span className="inline-flex gap-1 flex-wrap">{g.tags.map((t) => <span key={t} className="pr-tag pr-tag--muted">{t}</span>)}</span> : <span className="text-ink-muted">–</span>}</td>
                    <td className="text-right tabular-nums">{memberCount(g)}</td>
                    {g.monitored ? <td>{todayText(g)}</td> : <td className="text-ink-muted">Tidak dipantau</td>}
                    <td className="text-right">
                      {g.monitored && (
                        <span className="wa-rowmenu inline-flex">
                          <button aria-label={`Ubah ${g.name}`} title="Ubah grup" type="button" className="pr-btn pr-btn--subtle pr-btn--sm !px-2" onClick={() => setDlg({ kind: 'edit', id: g.id })}><Ic d={IC.pencil} /></button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!searching && (
            <p className="pr-help" style={{ margin: 0, padding: '10px 16px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Ic d={IC.info} size={14} />Hanya grup yang dipantau yang ditampilkan. Untuk memantau grup lain, cari namanya di kolom pencarian (minimal 3 huruf).
            </p>
          )}
        </section>
      </div>
      {dlg && cur && (dlg.kind === 'watch' || dlg.kind === 'edit') && (
        <GroupFormDialog key={dlg.kind + cur.id} mode={dlg.kind} group={cur} number={number} onClose={close} onSubmit={(f) => save(cur, dlg.kind as 'watch' | 'edit', f)} />
      )}
      {dlg && cur && dlg.kind === 'stop' && (
        <StopDialog group={cur} number={number} onClose={close} onConfirm={() => { const e = run((s) => stopMonitoring(s, cur.id)); if (!e) { setToast(`Berhenti memantau ${cur.name}`); close(); } }} />
      )}
      {dlg && cur && dlg.kind === 'members' && <MembersPanel group={cur} number={number} onClose={close} />}
      <div className="pr-toasts" role="status" aria-live="polite">
        {toast && <div className="v2-toast" role="status"><Ic d={IC.check} /><span>{toast}</span></div>}
      </div>
    </V2Root>
  );
}
