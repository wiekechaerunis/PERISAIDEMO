// Skenario uji end-to-end level state (padanan e2e/alur-0007.spec.ts): Sari setujui 0007 → Andi tangani dan ajukan penutupan →
// Sari tutup dengan TL dilanjutkan → Hendra (SKK) melihat → Rudi unggah bukti dan ajukan selesai → Andi setujui.
import { describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { resetDemoClock, demoNow } from './clock';
import type { DecisionResult, Slice } from './workflow';
import { approve } from './workflow';
import { requestClosure, saveClosure, saveNote, closureCompleteness, closureSummary } from './workflow.handling';
import { closeIncident } from './workflow.closure';
import { addEvidence, addFollowUp, approveDone, submitDone } from './workflow.followup';
import { handleDaysOf, remainingLabel } from '@/lib/deadline';
import { registeredAt } from '@/features/insiden/components/detail/detailLogic';

const NO = 'INS-SEN-2026-0007';
let s: Slice;
const run = (r: DecisionResult) => {
  if (!r.ok) throw new Error(r.reason);
  s = { ...s, ...r.state };
};
const inc = () => s.incidents.find((i) => i.no === NO)!;

describe('Alur 0007 (skenario 2–7)', () => {
  it('berjalan dari Setujui sampai TL selesai dengan data konsisten', () => {
    resetDemoClock();
    s = seedState();

    // 2. Sari menyetujui dengan 3 hari kerja (bawaan Tinggi)
    run(approve(s, NO, { by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi', priority: 'tinggi', pic: 'Andi Pratama', picKind: 'perorangan', steps: ['Ganti kabel dan pastikan pengamanan panel.', 'Lakukan patroli tambahan.'], dueDays: 3 }));
    expect(inc().status).toBe('dalam-penanganan');
    expect(inc().handleDays).toBe(3);
    expect(inc().handleDueAt).toBe('2026-11-02T07:00:00');
    expect(handleDaysOf(inc(), registeredAt(inc()))).toBe(3);

    // 3. Andi: TL dari saran (PIC Rudi), catatan, 5 isian penutupan + bukti, ajukan penutupan
    run(addFollowUp(s, { incidentNo: NO, action: 'Lakukan patroli tambahan.', pic: 'Rudi Hartono', dueDate: '2026-11-06', source: 'saran-verifikator', sourceLabel: 'Sari Wulandari', by: 'Andi Pratama' }));
    const tl = s.followUps![0];
    run(saveNote(s, NO, 'Andi Pratama', 'Kabel diganti, pompa menyala.'));
    for (const p of [
      { actions: 'Kabel 40 m diganti dan pompa menyala.' }, { partners: ['bujp' as const] }, { cause: 'Pencurian kabel', causeDetail: 'Panel di luar jangkauan CCTV.' },
      { factors: ['Celah pagar'] }, { evidence: [{ name: 'a.jpg', sizeKb: 1, caption: '' }] }, { result: 'tidak-ada' as const },
    ]) run(saveClosure(s, NO, 'Andi Pratama', p as never));
    // ADJ-14: 5 isian wajib; Penjelasan penyebab wajib karena Tinggi
    expect(closureCompleteness(inc())).toMatchObject({ done: 5, total: 5, complete: true });
    run(requestClosure(s, NO, 'Andi Pratama', null));
    expect(inc().status).toBe('minta-ditutup');
    expect(closureSummary(inc().handling?.closure)).toContain('Kabel 40 m diganti');

    // 4. Sari menutup dengan TL dilanjutkan
    run(closeIncident(s, NO, 'Sari Wulandari', { confirmedContracts: true, followUp: 'lanjut' }));
    expect(inc().status).toBe('ditutup');
    expect(s.followUps!.find((f) => f.no === tl.no)!.status).toBe('belum-dimulai');

    // 5. SKK melihat data penutupan yang sama (5/5)
    expect(closureCompleteness(inc()).done).toBe(5);

    // 6. Rudi: unggah bukti tanpa Mulai kerjakan → status tetap; lalu ajukan selesai
    run(addEvidence(s, tl.no, 'Rudi Hartono', { name: 'patroli.jpg', sizeKb: 100 }));
    expect(s.followUps!.find((f) => f.no === tl.no)!.status).toBe('belum-dimulai');
    run(submitDone(s, tl.no, 'Rudi Hartono', 'Patroli berjalan.'));
    expect(s.followUps!.find((f) => f.no === tl.no)!.status).toBe('menunggu-verifikasi');

    // 7. Andi menyetujui
    run(approveDone(s, tl.no, 'Andi Pratama'));
    expect(s.followUps!.find((f) => f.no === tl.no)!.status).toBe('selesai');

    // sisa waktu satu fungsi, dan tidak ada tanggal browser (19 Nov) di jejak insiden
    expect(remainingLabel('2026-11-02T07:00:00', '2026-10-28T13:00:00').text).toBe('sisa 2 hari');
    expect(JSON.stringify(inc().timeline)).not.toContain('2026-11-19');
    expect(demoNow().startsWith('2026-10-28')).toBe(true);
  });
});
