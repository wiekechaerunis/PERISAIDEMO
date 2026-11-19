// Aturan pemantauan (board V2-30 Aturan, V2-31 Aturan bawaan, V2-32 Aturan baru). Editor berupa panel samping.
import { useState } from 'react';
import { useDemoStore } from '@/services/mock/store';
import type { WaRule } from '@/services/types';
import { toggleRule } from '@/services/mock/workflow.wamon';
import { run } from './shared';
import { V2Root } from './V2Root';
import { RulePanel } from './aturan/RulePanel';
import { condChips, sourceChips } from './aturan/ruleModel';

const MAX_CHIPS = 4;

function Chips({ items, empty }: { items: string[]; empty?: string }) {
  const list = items.length ? items : empty ? [empty] : [];
  const shown = list.slice(0, MAX_CHIPS);
  const more = list.length - shown.length;
  return (
    <span className="wa-badges">
      {shown.map((c, i) => <span key={`${c}-${i}`} className="pr-tag pr-tag--neutral">{c}</span>)}
      {more > 0 && <span className="pr-tag wa-more">+{more} lainnya</span>}
    </span>
  );
}

export function AturanTab() {
  const rules = useDemoStore((s) => s.waRules);
  const numbers = useDemoStore((s) => s.waNumbers ?? []);
  const groups = useDemoStore((s) => s.waGroups ?? []);
  const messages = useDemoStore((s) => s.waMessages ?? []);
  const [edit, setEdit] = useState<{ rule: WaRule; isNew: boolean } | null>(null);
  const [numId, setNumId] = useState<string>('');
  const num = numbers.find((n) => n.id === numId) ?? numbers[0];
  const blank = (): WaRule => ({ id: `R-${Date.now().toString(36)}`, name: '', enabled: true, priority: false, ignore: {}, capture: {}, followUp: { count: 3, minutes: 5 } });
  const gname = (id: string) => groups.find((g) => g.id === id)?.name ?? id;
  const count = (id: string) => messages.filter((m) => m.ruleIds?.includes(id)).length;
  return (
    <V2Root>
      <div className="pr-page pr-stack wa-scope">
        <section className="pr-tcard" aria-label="Aturan">
          <div className="pr-tcard__bar">
            <h2>Aturan{num ? ` ${num.label}` : ''}</h2>
            <div className="pr-tcard__tools">
              {numbers.length > 0 && (
                <label className="wa-picker">Nomor:
                  <select aria-label="Pilih nomor" value={num?.id ?? ''} onChange={(e) => setNumId(e.target.value)}>
                    {numbers.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, pointerEvents: 'none', marginLeft: -4, marginRight: 4 }} aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
                </label>
              )}
              <button type="button" className="pr-btn pr-btn--primary pr-btn--md" onClick={() => setEdit({ rule: blank(), isNew: true })}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" /></svg>Tambah aturan
              </button>
            </div>
          </div>
          <div className="pr-table-scroll">
            <table className="pr-table wa-rules">
              <thead>
                <tr><th style={{ width: '19%' }}>Nama aturan</th><th style={{ width: '26%' }}>Sumber</th><th>Abaikan bila</th><th>Tangkap bila</th><th style={{ width: 72 }}>Aktif</th></tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className={r.builtin ? 'wa-builtin' : ''} onClick={() => setEdit({ rule: r, isNew: false })}>
                    <td>
                      <button type="button" className="pr-row-title" aria-label={`Ubah ${r.name}`}>{r.name}</button>
                      {r.builtin && <span className="pr-row-sub">Aturan bawaan · tidak bisa dihapus</span>}
                      <span className="pr-row-sub"><span className="whitespace-nowrap">{count(r.id)} pesan</span> · <span className="whitespace-nowrap">30 hari</span></span>
                      {r.priority && <span className="pr-tag pr-tag--caution">Prioritas</span>}
                    </td>
                    <td><Chips items={sourceChips(r, gname)} /></td>
                    <td><Chips items={condChips(r.ignore)} /></td>
                    <td><Chips items={condChips(r.capture)} empty="Semua pesan" /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" role="switch" aria-checked={r.enabled} className="wa-switch" aria-label={`Aktif: ${r.name}`} onClick={() => run((s) => toggleRule(s, r.id, !r.enabled))}>
                        <span aria-hidden="true" className="pr-switch" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pr-help">Pesan disimpan bila cocok dengan minimal satu aturan aktif. Di setiap aturan, syarat “Abaikan bila” dicek lebih dulu, lalu “Tangkap bila”.</p>
        </section>
      </div>
      {edit && <RulePanel key={edit.rule.id} rule={edit.rule} isNew={edit.isNew} groups={groups.filter((g) => !num || g.numberId === num.id)} onClose={() => setEdit(null)} />}
    </V2Root>
  );
}
