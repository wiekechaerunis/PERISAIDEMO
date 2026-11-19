// Board MP2-Penanganan (detail Penanganan PIC; menu ⋯ → MP4 Eskalasi / MP3 Isi data penutupan). Logika = PicHandlingPage desktop (DetailView).
import { demoNow } from '@/services/mock/clock';
import { reviewerBy } from '@/lib/rbac';
import { TlCard } from '@/features/tindak-lanjut/components/TlCard';
import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';
import { formatDateShort, formatWibFull } from '@/lib/format';
import type { Incident } from '@/services/types';
import { CLOSURE_REQUIRED, closureDone, escalate, handlingOf, respondStep, takeOver } from '@/services/mock/workflow.handling';

import { STEP_CATALOG } from '@/services/mock/seedHistory';
import { MobileShell } from '../ui/MobileShell';
import { Ic } from '@/features/insiden/components/review/parts';
import { AddTlHost } from '@/features/tindak-lanjut/components/AddTlHost';
import { dueBadge, effectiveDue, PEJABAT_NAME, picMode } from '@/features/insiden/logic/handling';
import { IncHead, KejadianSec, LampiranSec, MenuItem, P, PtStrip, RiwayatSec, Sheet, TimesSec, ToastLine, type ToastM } from './parts';
import { EscalateSheet } from './EscalateSheet';

const stepMeta = (text: string) => {
  const s = STEP_CATALOG.find((x) => x.text === text);
  return s ? `${s.tag} · tercatat di insiden serupa` : 'Dari insiden serupa';
};

export function PicDetail({ i }: { i: Incident }) {
  const role = useDemoStore((s) => s.role);
  const decide = useDemoStore((s) => s.decide);
  const me = DEMO_USERS[role].name;
  const [params, setParams] = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [esc, setEsc] = useState(false);
  const loc = useLocation();
  const flash = (loc.state as { toast?: string } | null)?.toast;
  const [toast, setToast] = useState<ToastM | null>(flash ? { text: flash } : null);

  const h = handlingOf(i);
  const mode = picMode(i, me);
  const due = effectiveDue(i, null);
  const badge = due ? dueBadge(due) : null;
  const working = i.status === 'dalam-penanganan';
  const waiting = i.status === 'minta-ditutup';
  const stored = h.closure;
  const returned = working && stored?.returnReason ? { text: stored.returnReason, by: PEJABAT_NAME, at: stored.requestedAt ?? demoNow() } : null;
  const canAct = (working || waiting) && mode !== 'grup-lain' && mode !== 'grup-belum';
  const notes = h.notes.length;
  const done = closureDone(stored);
  const steps = i.forwardedSteps ?? [];
  const answered = (s: string) => (h.stepsDone?.includes(s) ? 'done' : h.stepsIgnored?.includes(s) ? 'ignored' : null);
  const pending = steps.filter((s) => !answered(s)).length;
  const tlSpec = params.get('tl') ? { dari: params.get('tl'), langkah: params.get('langkah') } : null;

  const toWork = () => setParams((p) => { const n = new URLSearchParams(p); n.set('langkah', 'penutupan'); return n; });
  const openTl = (kind: 'baru' | 'saran', step?: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set('tl', kind);
      if (step) n.set('langkah', step);
      return n;
    });
  const doStep = (step: string, as: 'done' | 'ignored' | null) => {
    if (as === 'done') return openTl('saran', step);
    decide((s) => respondStep(s, i.no, step, as));
  };
  const doTake = () => {
    const r = decide((s) => takeOver(s, i.no, me));
    setToast(r.ok ? { text: 'Anda mengambil alih penanganan. Anggota lain diberi tahu.' } : { text: r.reason, tone: 'err' });
  };
  const doEscalate = (a: { to: 'pejabat' | 'skk'; name: string; reason: string }): string | null => {
    const r = decide((s) => escalate(s, i.no, me, a));
    if (!r.ok) return r.reason;
    setEsc(false);
    setToast({ text: `Insiden dieskalasi ke ${a.name.split(' · ')[0]}.` });
    return null;
  };
  const closeMenu = () => setMenu(false);

  const foot = canAct && working
    ? (
      <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={toWork}>
        <Ic d={P.tick} size={16} />{returned ? 'Perbaiki data penutupan' : 'Tangani insiden'}
      </button>
    )
    : working && mode === 'grup-belum'
      ? (
        <button type="button" className="p-btn p-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={doTake}>
          <Ic d={P.person} size={16} />Ambil alih penanganan
        </button>
      )
      : undefined;

  return (
    <MobileShell
      title="Detail insiden" backTo="/insiden" bodyStyle={{ paddingBottom: 96 }}
      footer={foot}
      overlay={
        <>
          {menu && (
            <Sheet role="menu" ariaLabel="Aksi lain" onClose={closeMenu} footer={<button type="button" className="p-btn p-btn-secondary" onClick={closeMenu}>Batal</button>}>
              <MenuItem icon={P.up} label="Eskalasi" onClick={() => { closeMenu(); setEsc(true); }} />
              {working && <MenuItem icon={P.tick} label="Isi data penutupan" onClick={() => { closeMenu(); toWork(); }} />}
            </Sheet>
          )}
          {esc && <EscalateSheet onClose={() => setEsc(false)} onConfirm={doEscalate} />}
          <ToastLine toast={toast} onClose={() => setToast(null)} />
          {tlSpec && <AddTlHost incident={i} dari={tlSpec.dari} langkah={tlSpec.langkah} />}
        </>
      }
      actions={canAct ? <button type="button" className="ib44" aria-label="Aksi lain" aria-haspopup="menu" onClick={() => setMenu(true)}><Ic d={P.more} size={20} /></button> : undefined}
    >
      <IncHead i={i} extra={i.escalated || h.escalatedTo ? <span className="p-tag t-caution">Dieskalasi</span> : undefined} />

      {mode === 'grup-lain' && (
        <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
          <Ic d={P.eye} size={16} />
          <div className="body">Penanganan sudah diambil alih <b>{h.takenBy}</b>. Anda hanya bisa melihat.</div>
        </div>
      )}

      {waiting && stored && (
        <div className="in-bn info sm" style={{ alignSelf: 'stretch' }}>
          <Ic d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM12 11v6M12 7.5v.5" size={16} />
          <div className="body">
            <b>Menunggu ditutup oleh {reviewerBy(stored.reviewers)}.</b> Diajukan {formatDateShort(stored.requestedAt ?? demoNow())}, {(stored.requestedAt ?? demoNow()).slice(11, 16)} · batas tinjau 2 hari kerja.
          </div>
        </div>
      )}

      {working && mode !== 'grup-lain' && (
        <div className="sec" style={{ background: 'color-mix(in srgb, var(--caution-bg) 45%, var(--surface))', borderColor: 'color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}>
          <div className="pk">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="lk-acc-ic" style={{ background: 'var(--caution-bg)', color: 'var(--caution-ink)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--caution-ink) 30%, var(--caution-bg))' }}><Ic d={P.warn} size={15} /></span>
              <h2 style={{ margin: 0, fontSize: 15 }}>{mode === 'grup-belum' ? 'Butuh penanganan dari tim Anda' : 'Butuh penanganan dari Anda'}</h2>
            </div>
            <div className="due">
              <span className="p-cap">Tenggat penanganan</span>
              <span className="big" style={{ fontSize: 18, lineHeight: '26px' }}>{due ? formatWibFull(due) : 'Belum ditetapkan'}</span>
              {badge && <span className={badge.cls} style={{ alignSelf: 'flex-start' }}><Ic d={P.clock} size={13} />{badge.text}</span>}
            </div>
            {returned && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'inset 0 0 0 1px var(--border)' }}>
                <b style={{ fontSize: 13 }}>Penutupan dikembalikan</b>
                <span className="p-cap" style={{ color: 'var(--ink)' }}>“{returned.text}”</span>
                <span className="p-cap">{returned.by} · {formatWibFull(returned.at)}</span>
              </div>
            )}
            {mode !== 'grup-belum' && (
              <div className="chk">
                <span className="hdl">Sebelum ajukan penutupan</span>
                <div className="it">
                  <span className={notes ? 'ok' : 'no'}>{notes ? <Ic d={'M20 6 9 17l-5-5'} size={11} /> : null}</span>
                  <span>Catat langkah penanganan<span className="s">{notes ? `${notes} catatan di Riwayat` : 'Belum ada catatan'}</span></span>
                </div>
                <div className="it">
                  <span className="no"></span>
                  <span>{returned ? 'Perbaiki data penutupan' : 'Lengkapi data penutupan'}<span className="s">{returned ? 'Sesuaikan dengan alasan pengembalian, lalu ajukan lagi' : `${done} dari ${CLOSURE_REQUIRED.length} isian wajib terisi`}</span></span>
                </div>
              </div>
            )}
            {steps.length > 0 && mode !== 'grup-belum' && (
              <div className="in-sar">
                <div className="sarh"><b>Saran dari pemeriksa</b><span className="p-tag t-caution" style={{ height: 22, fontSize: 11 }}>{pending ? `${pending} perlu ditanggapi` : 'Semua sudah ditanggapi'}</span></div>
                <span className="p-cap" style={{ marginTop: -4 }}>{PEJABAT_NAME} memilih langkah ini dari insiden serupa yang sudah ditutup. Tidak wajib.</span>
                <div className="rows">
                  {steps.map((s) => {
                    const a = answered(s);
                    return (
                      <div key={s} className={'r' + (a ? ' done' : '')}>
                        <b>{s}</b>
                        <span className="m">{stepMeta(s)}</span>
                        {!a ? (
                          <span className="a" style={{ display: 'flex' }}>
                            <button type="button" className="p-btn p-btn-secondary p-btn-sm" style={{ minHeight: 44 }} onClick={() => doStep(s, 'done')}><Ic d={P.plus} size={14} />Jadikan tindak lanjut</button>
                            <button type="button" className="p-btn p-btn-ghost p-btn-sm" style={{ minHeight: 44 }} onClick={() => doStep(s, 'ignored')}>Abaikan</button>
                          </span>
                        ) : (
                          <span className="st" style={{ display: 'block' }}>
                            {a === 'done' ? '✓ Form tindak lanjut dibuka dengan isi terisi' : '✕ Diabaikan'} · <button type="button" style={{ minHeight: 44 }} onClick={() => doStep(s, null)}>Batalkan</button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(waiting || mode === 'grup-lain' || !working) && <PtStrip i={i} dueCls={badge?.cls} dueText={badge?.text} />}
      {mode !== 'grup-lain' && mode !== 'grup-belum' && <TlCard i={i} canAdd={working || waiting} />}

      <TimesSec i={i} />
      <KejadianSec i={i} />
      <LampiranSec i={i} />
      <RiwayatSec i={i} due={due} />
    </MobileShell>
  );
}
