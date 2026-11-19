// Panel simulasi WhatsApp (khusus demo): ponsel tiruan untuk menautkan nomor, mengelola grup, dan mengirim pesan ke grup.
// Bukan aplikasi WhatsApp dan tidak meniru logo, warna merek, atau ikonnya. Hanya-baca terhadap PERISAI: panel tidak pernah menampilkan pesan "dikirim oleh PERISAI".
import { useState } from 'react';
import { create } from 'zustand';
import { useDemoStore } from '@/services/mock/store';
import { ingest, scanLink, simulateNewGroup, simulateRemoved, unlinkDevice, type WaMon, type WaResult } from '@/services/mock/workflow.wamon';
import type { WaKind } from '@/services/mock/waRules';
import { PAIR_CODE } from '../components/WaMonitorTabs';

interface SimUi { open: boolean; toggle: () => void; close: () => void }
export const useWaSimUi = create<SimUi>((set) => ({ open: false, toggle: () => set((s) => ({ open: !s.open })), close: () => set({ open: false }) }));

const OTHER_PHONE = '0812 7000 9999';
const PERSONAS = [
  { name: 'Joko', role: 'Danru BUJP', own: false }, { name: 'Brigadir Tama', role: 'Polsek', own: false },
  { name: 'Dika', role: 'Satpam internal', own: false }, { name: 'Nomor organisasi sendiri', role: 'Posko', own: true },
];
const SAMPLES: { label: string; bubbles: { text: string; foto?: boolean; lokasi?: boolean }[] }[] = [
  { label: '1 · LAPSIT rutin', bubbles: [{ text: 'LAPSIT Pos 3 06.00 aman terkendali' }] },
  { label: '2 · Konfirmasi singkat', bubbles: [{ text: 'siap ndan' }] },
  { label: '3 · Aki genset hilang (3 bubble)', bubbles: [{ text: 'Lapor ndan, aki genset Pos 4 ADR-07 hilang' }, { text: '(foto)', foto: true }, { text: 'kejadian sekitar jam 02.00, genset mati ±3 jam', lokasi: true }] },
  { label: '4 · Pagar ditambal', bubbles: [{ text: 'Pagar sisi panel ADR-07 sudah ditambal sementara, patroli ditambah 1 regu', foto: true }] },
  { label: '5 · Orang mencurigakan', bubbles: [{ text: 'Ada 2 orang mencurigakan di sekitar pagar barat, sudah dihalau' }] },
  { label: '6 · Pipa flowline (tanpa kerugian)', bubbles: [{ text: 'Satpam memergoki orang memotong pipa flowline, pelaku lari, pipa tidak jadi hilang' }] },
];

const mon = (): WaMon => useDemoStore.getState() as unknown as WaMon;
function apply(fn: (s: WaMon) => WaResult & { verdict?: { captured: boolean; ruleIds: string[]; reason?: string } }): { err?: string; res?: ReturnType<typeof fn> } {
  let out: { err?: string; res?: ReturnType<typeof fn> } = {};
  useDemoStore.getState().updateWaMon((s) => {
    const r = fn(s as WaMon);
    if (!r.ok) { out = { err: r.reason }; return {}; }
    out = { res: r };
    return r.state;
  });
  return out;
}

export function WaSimPanel() {
  const { open, close } = useWaSimUi();
  const numbers = useDemoStore((s) => s.waNumbers ?? []);
  const groups = useDemoStore((s) => s.waGroups ?? []);
  const rules = useDemoStore((s) => s.waRules ?? []);
  const [phone, setPhone] = useState<string>('');
  const [tab, setTab] = useState<'perangkat' | 'grup' | 'chat'>('perangkat');
  const [toast, setToast] = useState<{ text: string; err?: boolean } | null>(null);
  const [code, setCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [persona, setPersona] = useState(0);
  const [text, setText] = useState('');
  const [foto, setFoto] = useState(false);
  const [lokasi, setLokasi] = useState(false);
  const [sent, setSent] = useState<{ who: string; text: string; tag: string }[]>([]);
  const [seq, setSeq] = useState(0);
  if (!open) return null;

  const phones = [...numbers.map((n) => n.phone), OTHER_PHONE];
  const cur = phone || phones[0];
  const number = numbers.find((n) => n.phone === cur);
  const myGroups = number ? groups.filter((g) => g.numberId === number.id && !g.removed) : [];
  const gid = groupId && myGroups.some((g) => g.id === groupId) ? groupId : myGroups[0]?.id ?? '';

  const link = () => {
    const pending = numbers.find((n) => n.status === 'menunggu');
    if (!pending) { setToast({ text: 'Tidak ada kode yang sedang tampil di PERISAI.', err: true }); return; }
    const r = apply((s) => scanLink(s, pending.id, cur));
    setToast(r.err ? { text: r.err, err: true } : { text: 'Perangkat tertaut: Google Chrome (PERISAI).' });
  };
  const byCode = () => {
    if (code.trim().toUpperCase() !== PAIR_CODE) { setToast({ text: 'Kode salah. Periksa kode 8 karakter di PERISAI.', err: true }); return; }
    link();
  };
  const send = (bubbles: { text: string; foto?: boolean; lokasi?: boolean }[]) => {
    if (!gid) { setToast({ text: 'Pilih grup dulu.', err: true }); return; }
    const p = PERSONAS[persona];
    let n = seq;
    for (const b of bubbles) {
      const kinds: WaKind[] = ['teks', ...(b.foto ? (['foto'] as WaKind[]) : []), ...(b.lokasi ? (['lokasi'] as WaKind[]) : [])];
      const at = nextAt(n++);
      const r = apply((s) => ingest(s, { groupId: gid, sender: p.own ? number?.label ?? 'Posko' : p.name, senderRole: p.role, text: b.text, kinds, photos: b.foto ? ['foto-contoh.jpg'] : undefined, fromOwnNumber: p.own, at }));
      if (r.err) { setToast({ text: r.err, err: true }); return; }
      const v = r.res && 'verdict' in r.res ? r.res.verdict : undefined;
      const tag = v?.captured ? `Tertangkap · ${rules.filter((x) => v.ruleIds.includes(x.id)).map((x) => x.name).join(', ')}` : `Tidak ditangkap · ${v?.reason ?? ''}`;
      setSent((l) => [...l, { who: p.name, text: b.text, tag }]);
      setToast({ text: tag, err: !v?.captured });
    }
    setSeq(n);
    setText(''); setFoto(false); setLokasi(false);
  };

  return (
    <aside role="dialog" aria-label="Simulasi WhatsApp" style={{ position: 'fixed', right: 16, bottom: 16, width: 360, height: 640, maxHeight: 'calc(100vh - 32px)', zIndex: 60, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 24, boxShadow: '0 12px 40px rgba(0,0,0,.25), 0 0 0 1px var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <b style={{ fontSize: 13, flex: 1 }}>Simulasi · bukan aplikasi WhatsApp</b>
        <button type="button" className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup simulasi" onClick={close}>×</button>
      </div>
      <div style={{ padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <label className="p-cap" htmlFor="sim-ph">Ponsel</label>
        <select id="sim-ph" className="p-input" aria-label="Ponsel" style={{ flex: 1 }} value={cur} onChange={(e) => setPhone(e.target.value)}>
          {numbers.map((n) => <option key={n.id} value={n.phone}>{n.label} · {n.phone}</option>)}
          <option value={OTHER_PHONE}>Ponsel lain · {OTHER_PHONE}</option>
        </select>
      </div>
      <div role="tablist" aria-label="Layar ponsel" style={{ display: 'flex', gap: 4, padding: '0 14px' }}>
        {(['perangkat', 'grup', 'chat'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={'p-btn p-btn-sm ' + (tab === t ? 'p-btn-primary' : 'p-btn-ghost')} onClick={() => setTab(t)}>{t === 'perangkat' ? 'Perangkat tertaut' : t === 'grup' ? 'Grup' : 'Chat grup'}</button>
        ))}
      </div>
      {toast && <div role={toast.err ? 'alert' : 'status'} className={'in-bn sm ' + (toast.err ? 'err' : 'ok')} style={{ margin: '8px 14px 0' }}><div className="body">{toast.text}</div></div>}
      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'perangkat' && (
          <>
            <span className="p-cap">Perangkat tertaut ({number?.devices.length ?? 0} dari 4)</span>
            {(number?.devices ?? []).map((d) => <div key={d} className="p-file"><div className="grow"><b>{d}</b></div></div>)}
            {number && number.devices.length > 0 && <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => { apply((s) => unlinkDevice(s, number.id)); setToast({ text: 'Perangkat dilepas. Nomor di PERISAI Terputus.' }); }}>Lepas perangkat</button>}
            <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={link}>Tautkan perangkat</button>
            <div className="p-field"><span className="p-cap">Tautkan dengan nomor telepon</span><input className="p-input" aria-label="Kode tautan" maxLength={8} placeholder="Kode 8 karakter" value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={byCode}>Tautkan dengan kode</button>
          </>
        )}
        {tab === 'grup' && (
          <>
            <span className="p-cap">Grup tempat nomor ini menjadi anggota</span>
            {myGroups.length === 0 && <span className="p-cap">Nomor ini belum terhubung atau tidak punya grup.</span>}
            {myGroups.map((g) => (
              <div key={g.id} className="p-file"><div className="grow"><b>{g.name}</b></div><button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={() => { apply((s) => simulateRemoved(s, g.id)); setToast({ text: `Nomor dikeluarkan dari ${g.name}.` }); }} aria-label={`Keluarkan nomor dari ${g.name}`}>Keluarkan nomor dari grup</button></div>
            ))}
            {number && <button type="button" className="p-btn p-btn-secondary p-btn-sm" onClick={() => { apply((s) => simulateNewGroup(s, number.id, `Grup baru ${groups.length + 1}`)); setToast({ text: 'Nomor ditambahkan ke grup baru.' }); }}>Tambahkan ke grup baru</button>}
          </>
        )}
        {tab === 'chat' && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="p-input" aria-label="Grup" style={{ flex: 1 }} value={gid} onChange={(e) => setGroupId(e.target.value)}>{myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              <select className="p-input" aria-label="Pengirim" style={{ flex: 1 }} value={persona} onChange={(e) => setPersona(Number(e.target.value))}>{PERSONAS.map((p, i) => <option key={p.name} value={i}>{p.name} · {p.role}</option>)}</select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80 }} aria-label="Percakapan simulasi">
              {sent.map((m, i) => <div key={i} className="in-wa"><div className="bub"><b style={{ fontSize: 11 }}>{m.who}</b><br />{m.text}</div><span className="p-cap">{m.tag}</span></div>)}
              {sent.length === 0 && <span className="p-cap">Belum ada pesan terkirim dari ponsel ini.</span>}
            </div>
            <select className="p-input" aria-label="Pesan siap pakai" value="" onChange={(e) => { const s = SAMPLES[Number(e.target.value)]; if (s) send(s.bubbles); }}>
              <option value="">Pesan siap pakai…</option>
              {SAMPLES.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            </select>
            <textarea className="p-input p-area" aria-label="Pesan" placeholder="Ketik pesan" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 56 }} />
            <label className="p-choice"><input type="checkbox" checked={foto} onChange={(e) => setFoto(e.target.checked)} /><span>Foto contoh</span></label>
            <label className="p-choice"><input type="checkbox" checked={lokasi} onChange={(e) => setLokasi(e.target.checked)} /><span>Bagikan lokasi</span></label>
            <button type="button" className="p-btn p-btn-primary p-btn-sm" disabled={!text.trim()} onClick={() => send([{ text, foto, lokasi }])}>Kirim</button>
          </>
        )}
      </div>
    </aside>
  );
}

import { demoNow } from '@/services/mock/clock';
/** Waktu kirim simulasi: jam demo + n menit (bubble berurutan 1 menit). */
function nextAt(n: number): string {
  const d = new Date(demoNow().slice(0, 16) + ':00Z');
  d.setUTCMinutes(d.getUTCMinutes() + n);
  return d.toISOString().slice(0, 19);
}
void mon;
