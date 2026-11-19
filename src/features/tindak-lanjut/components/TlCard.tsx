// Kartu "Tindak lanjut · {n}" di Insiden (detail, Tangani insiden, Data penutupan, Review penutupan, dialog Tutup, mobile).
// Satu komponen untuk semua layar. Insiden hanya memegang kartu ini; daftar, detail, dan pengerjaan tindak lanjut ada di modul
// Tindak Lanjut (artifact sendiri, TLJ-01), jadi setiap baris dan tombol Buat menaut ke sana.
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { FollowUpItem, Incident } from '@/services/types';
import { FOLLOWUP_LABEL, FOLLOWUP_TAG } from '@/services/types';
import { formatDate } from '@/lib/format';
import { Ic as P } from '@/features/insiden/components/review/parts';
import { followUpItemsOf } from '@/services/mock/workflow.closure';
import { FU_LABEL, FU_TAG } from '@/features/insiden/logic/closure';
import { initialsOf } from '@/features/insiden/logic/handling';
import { TL_NOW } from '@/services/mock/workflow.followup';
import { useFollowUps } from '../logic/useFollowUps';
import { useDemoStore } from '@/services/mock/store';
import { DEMO_USERS } from '@/lib/rbac';

const PLUS = 'M12 5v14M5 12h14';
const CLOCK = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2';

const isFinal = (f: FollowUpItem) => f.status === 'selesai' || f.status === 'dibatalkan';
const label = (f: FollowUpItem) => (f.tlStatus ? FOLLOWUP_LABEL[f.tlStatus] : FU_LABEL[f.status]);
const tag = (f: FollowUpItem) => (f.tlStatus ? FOLLOWUP_TAG[f.tlStatus] : FU_TAG[f.status]);

/** Urutan: Terlambat → Menunggu pemeriksaan → Dikerjakan → Belum dimulai (yang final dilipat). */
export function tlRank(f: FollowUpItem): number {
  if (f.dueAt < TL_NOW) return 0;
  if (f.tlStatus === 'menunggu-verifikasi') return 1;
  if (f.tlStatus === 'belum-dimulai' || (!f.tlStatus && f.status === 'belum-dimulai')) return 3;
  return 2;
}
export const sortTl = (items: FollowUpItem[]) => [...items].sort((a, b) => tlRank(a) - tlRank(b) || a.dueAt.localeCompare(b.dueAt));

interface Props {
  i: Incident;
  hl?: boolean;
  /** keterangan di bawah judul (mis. tetap berjalan setelah insiden ditutup) */
  note?: string;
  empty?: ReactNode;
  /** sembunyikan kartu bila tidak ada tindak lanjut */
  hideWhenEmpty?: boolean;
  /** tampilkan tombol Buat tindak lanjut (insiden masih ditangani) */
  canAdd?: boolean;
  id?: string;
}

export function TlCard({ i, hl, note, empty, hideWhenEmpty, canAdd, id }: Props) {
  const all = followUpItemsOf(i, useFollowUps());
  const items = sortTl(all);
  const [showFinal, setShowFinal] = useState(false);
  const me = DEMO_USERS[useDemoStore((s) => s.role)].name;
  if (hideWhenEmpty && !items.length) return null;
  const live = items.filter((f) => !isFinal(f));
  const final = items.filter(isFinal);
  const rows = showFinal ? [...live, ...final] : live;
  return (
    <section className={'p-card in-sec' + (hl ? ' in-hl' : '')} style={{ gap: 10 }} id={id}>
      <div className="lk-card-head" style={{ marginBottom: 0 }}>
        <h2 className="in-h">Tindak lanjut{items.length ? ` · ${items.length}` : ''}</h2>
        {canAdd && (
          <Link to={{ search: '?tl=baru' }} className="in-tl-add"><P d={PLUS} size={13} />Buat tindak lanjut</Link>
        )}
      </div>
      {note && items.length > 0 && <span className="p-cap">{note}</span>}
      {items.length === 0 ? (
        empty ?? <span className="p-cap" style={{ padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-subtle)', color: 'var(--ink-subtle)' }}>Belum ada tindak lanjut.</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => (
            <Link key={r.id} to={r.tl ? `/tindak-lanjut/${r.tl}` : '#'} className="in-tlr rail">
              <span className="p-mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{r.tl ?? r.id}</span>
              <b style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</b>
              <span className="m">
                <span className={'in-due ' + (!isFinal(r) && r.dueAt < TL_NOW ? 'late' : 'ok')}><P d={CLOCK} size={13} />{formatDate(r.dueAt)}</span>
                <span className={`p-tag ${tag(r)}`}>{label(r)}</span>
              </span>
              <span className="who"><span className="in-av" style={{ width: 18, height: 18, fontSize: 9 }}>{initialsOf(r.owner)}</span>{r.owner}{r.owner === me && <span className="p-tag t-info" style={{ height: 18, fontSize: 11, marginLeft: 4 }}>Anda</span>}</span>
            </Link>
          ))}
          {final.length > 0 && !showFinal && (
            <button type="button" className="p-tbtn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowFinal(true)}>Tampilkan {final.length} yang sudah final</button>
          )}
        </div>
      )}
    </section>
  );
}
