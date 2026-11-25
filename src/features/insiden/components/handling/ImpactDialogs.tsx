// Perbarui dampak (PD1, PD1m), tinjau perubahan level oleh Pejabat (PD2), Koreksi data setelah ditutup (PD3). ADJ-07.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatRupiah, formatWibFull } from '@/lib/format';
import { SEV_LABEL, SEV_TAG_CLS, isHighOrCritical, type CasualtyKind, type OpsImpact } from '@/lib/severity';
import { useDemoStore } from '@/services/mock/store';
import type { Incident } from '@/services/types';
import { MIN_IMPACT_REASON, lossLine, opsLine, previewImpact, type ImpactPatch } from '@/services/mock/workflow.impact';

const OPS: [OpsImpact, string][] = [['tidak', 'Tidak terganggu'], ['sebagian', 'Terganggu sebagian'], ['berhenti', 'Berhenti']];
const KB: [CasualtyKind, string][] = [['p3k', 'Luka ringan (P3K)'], ['klinik', 'Dibawa ke klinik/RS'], ['berat', 'Luka berat atau cacat'], ['meninggal', 'Meninggal']];
const bare = { flex: 1, border: 0, outline: 0, background: 'none', font: 'inherit', color: 'inherit', minWidth: 0 } as const;
const num = (v: string) => (v.replace(/\D/g, '') ? Number(v.replace(/\D/g, '')) : null);

function Frame({ title, sub, onClose, children, footer, labelId }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; labelId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <>
      <div className="in-scrim" onClick={onClose}></div>
      <div className="in-dlg" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="p-dialog" style={{ width: 600 }}>
          <div className="dh">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h3 id={labelId}>{title}</h3>
              {sub && <span className="p-cap">{sub}</span>}
            </div>
            <button type="button" ref={ref} className="p-ibtn ghost" style={{ width: 28, height: 28 }} aria-label="Tutup dialog" onClick={onClose}>
              <Icon name="close" size={15} />
            </button>
          </div>
          <div className="db" style={{ gap: 16, maxHeight: '64vh', overflowY: 'auto' }}>{children}</div>
          <div className="df">{footer}</div>
        </div>
      </div>
    </>
  );
}

/** PD1: Perbarui dampak (PIC atau Pejabat Berwenang, selama Dalam penanganan). */
export function ImpactDialog({ incident: i, byPejabat, onClose, onSave }: { incident: Incident; byPejabat: boolean; onClose: () => void; onSave: (p: ImpactPatch) => string | null }) {
  const d = i.detail!;
  const slice = useDemoStore.getState();
  const [p, setP] = useState<ImpactPatch>({
    ops: d.ops, opsHours: d.opsHours, ongoing: d.ongoing, opsUnknown: !!d.opsUnknown, casualties: { ...d.casualties },
    lossIdr: d.lossIdr, lossUnknown: !!d.lossUnknown, reason: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (x: Partial<ImpactPatch>) => setP((v) => ({ ...v, ...x }));
  const pv = previewImpact(i, p, slice, byPejabat);
  const tooShort = p.reason.trim().length < MIN_IMPACT_REASON;
  const cas = p.casualties;
  const toggleKb = (k: CasualtyKind) => {
    const next = { ...cas };
    delete next.belum;
    if (k in next) delete next[k];
    else next[k] = 1;
    set({ casualties: next });
  };
  const changed = (a: string, b: string) => (a !== b ? <span className="p-tag t-caution" style={{ height: 18, fontSize: 11, marginLeft: 6 }}>Berubah</span> : null);
  const lvl = pv.to ?? i.severity;
  const lines: string[] =
    pv.dir === 'up' && !byPejabat
      ? [
          'Level baru langsung berlaku begitu Anda menekan Simpan pembaruan.',
          ...(isHighOrCritical(pv.to) ? [`SKK Migas langsung diberi tahu karena level menjadi ${SEV_LABEL[pv.to!]}.`] : []),
          'Tenggat dihitung dari waktu kenaikan, tidak lebih lama dari tenggat sebelumnya.',
          `Pejabat Berwenang diberi tahu dan bisa mengembalikan ke ${i.severity ? SEV_LABEL[i.severity] : 'level sebelumnya'} dengan alasan.`,
        ]
      : pv.dir === 'down' && !byPejabat
        ? [`${i.severity ? SEV_LABEL[i.severity] : 'Level lama'} tetap berlaku sampai Pejabat Berwenang mengonfirmasi penurunan.`, `Tenggat tetap ${i.handleDueAt ? formatWibFull(i.handleDueAt) : '—'}.`]
        : pv.dir !== 'same'
          ? ['Anda Pejabat Berwenang, jadi level berubah tanpa konfirmasi.', `Tenggat ${pv.dir === 'up' ? 'dihitung ulang dari waktu kenaikan' : 'tidak diperpanjang'}.`]
          : ['Level tidak berubah.'];
  return (
    <Frame
      labelId="pd-t" title="Perbarui dampak" sub="Isi dengan yang sudah diketahui sekarang. Nilai lama tetap tercatat di Riwayat." onClose={onClose}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" disabled={tooShort} onClick={() => setErr(onSave(p))}>Simpan pembaruan</button>
        </>
      }
    >
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi operasi{changed(opsLine(d), opsLine(p))}</span>
        <div className="in-chips" role="radiogroup" aria-label="Kondisi operasi">
          {OPS.map(([k, l]) => (
            <button key={k} type="button" role="radio" className="p-chip" aria-checked={!p.opsUnknown && p.ops === k} aria-pressed={!p.opsUnknown && p.ops === k} onClick={() => set({ ops: k, opsUnknown: false, ...(k === 'tidak' ? { opsHours: null, ongoing: false } : {}) })}>{l}</button>
          ))}
          <button type="button" role="radio" className="p-chip" aria-checked={!!p.opsUnknown} aria-pressed={!!p.opsUnknown} onClick={() => set({ opsUnknown: true, ops: null, opsHours: null })}>Belum diketahui</button>
        </div>
        <span className="p-cap">Sebelumnya {opsLine(d)}</span>
        {!p.opsUnknown && p.ops && p.ops !== 'tidak' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="p-input" style={{ width: 140 }}>
              <input aria-label="Lama operasi terganggu" inputMode="numeric" style={{ ...bare, textAlign: 'right' }} value={p.opsHours ?? ''} onChange={(e) => set({ opsHours: num(e.target.value) })} />
              <span className="affix">jam</span>
            </span>
            <button type="button" className="in-checked" role="checkbox" aria-checked={p.ongoing} onClick={() => set({ ongoing: !p.ongoing })} style={{ fontSize: 13 }}>
              <span className={p.ongoing ? 'p-check on' : 'p-check'}><Icon name="check" size={11} /></span>Masih berlangsung
            </button>
          </div>
        )}
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Kondisi korban</span>
        <div className="in-chips" role="group" aria-label="Kondisi korban" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="p-chip" aria-pressed={Object.keys(cas).length === 0} onClick={() => set({ casualties: {} })}>Tidak ada</button>
          {KB.map(([k, l]) => <button key={k} type="button" className="p-chip" aria-pressed={k in cas} onClick={() => toggleKb(k)}>{l}</button>)}
          <button type="button" className="p-chip" aria-pressed={'belum' in cas} onClick={() => set({ casualties: { belum: 0 } })}>Belum diketahui</button>
        </div>
        {KB.filter(([k]) => k in cas).map(([k, l]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
            <span className="p-input" style={{ width: 120 }}>
              <input aria-label={`Jumlah orang · ${l}`} inputMode="numeric" style={{ ...bare, textAlign: 'right' }} value={cas[k] ?? 0} onChange={(e) => set({ casualties: { ...cas, [k]: num(e.target.value) ?? 0 } })} />
              <span className="affix">orang</span>
            </span>
          </div>
        ))}
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Perkiraan kerugian{changed(lossLine(d), lossLine(p))}</span>
        <span className="p-input" style={{ maxWidth: 320 }}>
          <span className="affix">Rp</span>
          <input aria-label="Perkiraan kerugian" inputMode="numeric" disabled={p.lossUnknown} style={{ ...bare, textAlign: 'right' }}
            value={p.lossUnknown ? 'Belum diketahui' : p.lossIdr ? p.lossIdr.toLocaleString('id-ID') : ''} onChange={(e) => set({ lossIdr: num(e.target.value) })} />
        </span>
        <button type="button" className="in-checked" role="checkbox" aria-checked={!!p.lossUnknown} style={{ fontSize: 13, alignSelf: 'flex-start' }} onClick={() => set({ lossUnknown: !p.lossUnknown, lossIdr: null })}>
          <span className={p.lossUnknown ? 'p-check on' : 'p-check'}><Icon name="check" size={11} /></span>Belum diketahui
        </button>
        <span className="p-cap">Sebelumnya {lossLine(d)}</span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan atau sumber info<span className="p-req">*</span></span>
        <textarea className="p-input p-area" aria-label="Alasan atau sumber info" maxLength={500} style={{ minHeight: 64, border: 0, font: 'inherit', width: '100%', boxSizing: 'border-box' }}
          placeholder="mis. Pompa pengganti rusak saat dipasang, operasi berhenti lagi. Estimasi bagian teknik 29 Okt." value={p.reason} onChange={(e) => set({ reason: e.target.value })} />
        <span className="p-help">Minimal {MIN_IMPACT_REASON} karakter · tampil di Riwayat</span>
      </div>
      <section className="am-note" aria-label="Akibat pembaruan" style={{ flexDirection: 'column' }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lvl && <span className={'p-tag ' + SEV_TAG_CLS[lvl]}><span className="dot"></span>{SEV_LABEL[lvl]}</span>}
          <b>{pv.dir === 'up' ? 'Level naik' : pv.dir === 'down' ? (byPejabat ? 'Level turun' : 'Saran turun, menunggu Pejabat') : 'Level tetap'}</b>
        </span>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
        <span className="p-cap">Saran dari matriks keparahan yang tersimpan di insiden ini. Angka contoh (K-2).</span>
      </section>
      {err && <span className="p-help err" role="alert">{err}</span>}
    </Frame>
  );
}

/** PD2: kartu Pejabat untuk perubahan level dari pembaruan dampak. */
export function LevelChangeCard({ incident: i, onResolve }: { incident: Incident; onResolve: (accept: boolean, reason: string) => void }) {
  const lc = i.levelChange!;
  const [reason, setReason] = useState('');
  const up = lc.dir === 'up';
  return (
    <section className="p-card in-sec" aria-label={up ? `Level naik ke ${SEV_LABEL[lc.to]}` : 'Konfirmasi penurunan level'} style={{ gap: 10, boxShadow: 'inset 0 0 0 1px var(--caution-ink)' }}>
      <h2 className="p-h2">{up ? `Level naik ke ${SEV_LABEL[lc.to]}` : 'Konfirmasi penurunan level'}</h2>
      <span className="p-cap">{up ? 'Naik karena dampak diperbarui' : 'Saran turun, menunggu Anda'} · {lc.by} · {formatWibFull(lc.at)}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className={'p-tag ' + SEV_TAG_CLS[lc.from]}><span className="dot"></span>{SEV_LABEL[lc.from]}</span>→
        <span className={'p-tag ' + SEV_TAG_CLS[lc.to]}><span className="dot"></span>{SEV_LABEL[lc.to]}</span>
      </span>
      <span className="p-cap">
        {up ? 'SKK Migas sudah diberi tahu bila level Tinggi/Kritis. Kembalikan hanya bila kenaikan ini tidak tepat.' : `${SEV_LABEL[lc.to]} baru berlaku setelah Anda mengonfirmasi. Tenggat tetap; ubah lewat Ubah tenggat bila perlu.`}
      </span>
      {up && (
        <label className="p-field">
          <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan bila dikembalikan ke {SEV_LABEL[lc.from]}<span className="p-req">*</span></span>
          <textarea className="p-input p-area" aria-label="Alasan mengembalikan level" style={{ minHeight: 56, border: 0, font: 'inherit', width: '100%', boxSizing: 'border-box' }} value={reason} onChange={(e) => setReason(e.target.value)} />
          <span className="p-help">Wajib bila Anda menekan Kembalikan ke {SEV_LABEL[lc.from]} · SKK Migas diberi tahu koreksinya</span>
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="p-btn p-btn-secondary" disabled={up && !reason.trim()} onClick={() => onResolve(false, reason)}>
          {up ? `Kembalikan ke ${SEV_LABEL[lc.from]}` : `Tetap ${SEV_LABEL[lc.from]}`}
        </button>
        <button type="button" className="p-btn p-btn-primary" onClick={() => onResolve(true, '')}>
          {up ? `Biarkan ${SEV_LABEL[lc.to]}` : `Turunkan ke ${SEV_LABEL[lc.to]}`}
        </button>
      </div>
    </section>
  );
}

/** PD3: Koreksi data insiden yang sudah ditutup (kerugian final), tanpa Buka kembali. */
export function CorrectionDialog({ incident: i, onClose, onSave }: { incident: Incident; onClose: () => void; onSave: (loss: number, reason: string) => string | null }) {
  const prev = i.handling?.closure?.lossFinalIdr ?? null;
  const [loss, setLoss] = useState<number | null>(prev);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const ok = loss !== null && reason.trim().length >= MIN_IMPACT_REASON;
  return (
    <Frame
      labelId="kd-t" title="Koreksi data insiden" sub="Untuk angka yang baru pasti setelah ditutup. Status tetap Ditutup; PIC dan tenggat tidak aktif lagi." onClose={onClose}
      footer={
        <>
          <button type="button" className="p-btn p-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="p-btn p-btn-primary" disabled={!ok} onClick={() => loss !== null && setErr(onSave(loss, reason))}>Simpan koreksi</button>
        </>
      }
    >
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Yang dikoreksi</span>
        <span>Kerugian final</span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Nilai baru</span>
        <span className="p-input" style={{ maxWidth: 320 }}>
          <span className="affix">Rp</span>
          <input aria-label="Kerugian final baru" inputMode="numeric" style={{ ...bare, textAlign: 'right' }} value={loss ? loss.toLocaleString('id-ID') : ''} onChange={(e) => setLoss(num(e.target.value))} />
        </span>
        <span className="p-cap">Sebelumnya {prev != null ? formatRupiah(prev) : '—'}</span>
      </div>
      <div className="p-field">
        <span className="p-lbl" style={{ color: 'var(--ink)' }}>Alasan koreksi<span className="p-req">*</span></span>
        <textarea className="p-input p-area" aria-label="Alasan koreksi" style={{ minHeight: 64, border: 0, font: 'inherit', width: '100%', boxSizing: 'border-box' }} value={reason} onChange={(e) => setReason(e.target.value)} />
        <span className="p-help">Tercatat di Riwayat dengan nilai sebelum dan sesudah</span>
      </div>
      <span className="p-cap">Perlu penanganan baru? Pakai Buka kembali, bukan koreksi.</span>
      {err && <span className="p-help err" role="alert">{err}</span>}
    </Frame>
  );
}
