// Simpan draf (B-9): draf hanya tersimpan lewat tombol Simpan draf (Ajukan = simpan + ajukan). Draf insiden pertama kali disimpan
// mendapat nomor dan menjadi insiden berstatus Draf di daftar (terlihat rekan organisasi, ADJ-18).
import { demoNow } from '@/services/mock/clock';
import { useDemoStore } from '@/services/mock/store';
import { ORG } from '@/services/mock/seed';
import { DEMO_USERS } from '@/lib/rbac';
import { useDraftStore } from './draft';
import { buildDraftIncident, nextNumber } from './submit';

/** Simpan draf aktif; mengembalikan nomornya (kosong untuk kerawanan, yang belum punya status draf). */
export function saveDraftNow(): string {
  const { draft, patch, markSaved } = useDraftStore.getState();
  if (draft.kind !== 'insiden') {
    markSaved();
    return '';
  }
  const st = useDemoStore.getState();
  const me = DEMO_USERS[st.role].name;
  const prev = draft.no ? st.incidents.find((i) => i.no === draft.no) : undefined;
  const no = draft.no ?? nextNumber('INS-SEN', st.incidents.map((i) => i.no));
  st.addIncident(buildDraftIncident(draft, no, prev?.reporter ?? me, ORG, st.config, prev));
  patch({ no, createdBy: draft.createdBy ?? me, savedAt: demoNow() });
  markSaved();
  return no;
}
