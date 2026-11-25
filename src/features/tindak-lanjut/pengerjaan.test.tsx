// Kartu Pengerjaan satu kartu (PgKartu/T14N): aturan status TLJ-01 §9 #20 dan tampilan Ajukan selesai.
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { seedState } from '@/services/mock/seed';
import type { DecisionResult } from '@/services/mock/workflow';
import { addEvidence, addFollowUpNote, removeEvidence, submitDone, withdrawSubmission } from '@/services/mock/workflow.followup';
import type { FollowUp } from '@/services/types';
import { FollowUpWorkCard } from './components/FollowUpWorkCard';

const NO = 'TL-SEN-2026-0041'; // Belum dimulai, PIC Rudi Hartono
const RUDI = 'Rudi Hartono';
const st = (r: DecisionResult) => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const fu = (s: ReturnType<typeof st>, no = NO) => s.followUps!.find((f) => f.no === no)!;
const file = { name: 'foto-pagar.jpg', sizeKb: 900 };

const card = (f: FollowUp, work = true) =>
  render(
    <FollowUpWorkCard
      f={f} giver="Andi Pratama" work={work} pull={work} note="" onNote={() => {}} notePhotos={0} onAttachPhoto={() => {}}
      doneNote="" onDoneNote={() => {}} onStart={() => {}} onAddNote={() => {}} onPickFile={() => {}} onRemoveFile={() => {}}
      onSubmit={() => {}} onWithdraw={() => {}}
    />,
  );

describe('Pengerjaan satu kartu: aturan status', () => {
  it('unggah bukti saat Belum dimulai tidak mengubah status (bukti tetap draf)', () => {
    const s = st(addEvidence(seedState(), NO, RUDI, file));
    expect(fu(s).status).toBe('belum-dimulai');
    expect(fu(s).evidence.map((e) => e.name)).toContain('foto-pagar.jpg');
    expect(fu(s).history.some((h) => h.text.startsWith('Mulai dikerjakan'))).toBe(false);
  });

  it('catatan progres pertama mengubah status jadi Dikerjakan + riwayat "Mulai dikerjakan"', () => {
    const s = st(addFollowUpNote(seedState(), NO, RUDI, 'Material sudah datang.'));
    expect(fu(s).status).toBe('berjalan');
    expect(fu(s).history.at(-1)?.text).toBe('Mulai dikerjakan.');
    // catatan kedua tidak menambah riwayat "Mulai dikerjakan" lagi
    const s2 = st(addFollowUpNote(s, NO, RUDI, 'Separuh pagar selesai.'));
    expect(fu(s2).history.filter((h) => h.text.startsWith('Mulai dikerjakan'))).toHaveLength(1);
  });

  it('Ajukan selesai ditolak tanpa bukti (store)', () => {
    const r = submitDone(seedState(), NO, RUDI);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('Lampirkan minimal satu bukti untuk mengajukan selesai.');
  });

  it('Tarik pengajuan mengembalikan ke Dikerjakan dan membuka kunci bukti', () => {
    const s0 = st(addEvidence(st(addFollowUpNote(seedState(), NO, RUDI, 'Mulai.')), NO, RUDI, file));
    const s1 = st(submitDone(s0, NO, RUDI, 'Selesai dipasang.'));
    expect(fu(s1).status).toBe('menunggu-verifikasi');
    expect(addEvidence(s1, NO, RUDI, { name: 'x.jpg', sizeKb: 1 }).ok).toBe(false); // terkunci
    expect(removeEvidence(s1, NO, RUDI, file.name).ok).toBe(false);
    const s2 = st(withdrawSubmission(s1, NO, RUDI));
    expect(fu(s2).status).toBe('berjalan');
    expect(removeEvidence(s2, NO, RUDI, file.name).ok).toBe(true); // tidak terkunci lagi
    expect(addEvidence(s2, NO, RUDI, { name: 'y.jpg', sizeKb: 1 }).ok).toBe(true);
  });
});

describe('FollowUpWorkCard (PgKartu)', () => {
  const base = () => fu(seedState() as ReturnType<typeof st>);

  it('Belum dimulai tanpa bukti: Sudah mulai?, hint minimal satu bukti, Ajukan selesai nonaktif', () => {
    card(base());
    expect(screen.getByText('Sudah mulai?')).toBeTruthy();
    expect(screen.getByText('Lampirkan minimal satu bukti untuk mengajukan selesai.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Ajukan selesai' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('ada bukti: Ajukan selesai aktif dan hint pemberi tugas memeriksa', () => {
    card({ ...base(), evidence: [{ ...file, at: '2026-11-03T10:12:00' }] });
    expect((screen.getByRole('button', { name: 'Ajukan selesai' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('Andi Pratama memeriksa. Bukti terkunci setelah diajukan.')).toBeTruthy();
    expect(screen.getByText(/belum diajukan/)).toBeTruthy();
  });

  it('Menunggu pemeriksaan: 2 · Pengajuan selesai, kunci sekali, catatan sebagai kutipan, Tarik pengajuan', () => {
    const { container } = card({
      ...base(), status: 'menunggu-verifikasi', submittedAt: '2026-11-03T10:20:00', completionNote: 'Pagar sudah diganti panel beton.',
      evidence: [{ ...file, at: '2026-11-03T10:12:00' }, { name: 'b.png', sizeKb: 400, at: '2026-11-03T10:15:00' }],
    });
    const sub = container.querySelector('.pg-sub') as HTMLElement;
    expect(within(sub).getByText('2 · Pengajuan selesai')).toBeTruthy();
    expect(within(sub).getAllByText('Terkunci selama diperiksa')).toHaveLength(1);
    expect(sub.querySelector('.pg-quote p')?.textContent).toBe('Pagar sudah diganti panel beton.');
    expect(sub.querySelector('textarea')).toBeNull();
    expect(within(sub).getByRole('button', { name: 'Tarik pengajuan' })).toBeTruthy();
    expect(container.querySelector('.pg-done')).toBeNull();
    expect(screen.getByText('hanya dibaca selama diperiksa')).toBeTruthy();
  });
});
