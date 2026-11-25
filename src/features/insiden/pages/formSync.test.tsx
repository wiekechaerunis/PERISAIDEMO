// Form Lapor setelah sinkron INS-ADJ + Desain v2: B-1 (judul), B-2 (stepper), B-4 (tanpa kartu Pengajuan), B-9 (Simpan draf), B-11.
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { isDirty, unknownImpacts, useDraftStore } from '../logic/draft';
import { useCopilotStore } from '../copilot/copilotStore';
import { suggestedSeverityOf } from '../logic/submit';
import { ReportStep1Page } from './ReportStep1Page';
import { ReportStep2Page } from './ReportStep2Page';

const renderIn = (el: JSX.Element) => render(<MemoryRouter>{el}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDraftStore.getState().resetDraft();
  useCopilotStore.getState().reset(false);
});

describe('langkah 1 (B-1..B-4)', () => {
  it('sebelum tersimpan: "Buat laporan", crumb Insiden › Baru, tanpa badge Draf dan tanpa kartu Pengajuan', () => {
    renderIn(<ReportStep1Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Buat laporan' })).toBeInTheDocument();
    expect(screen.getByText('Baru')).toBeInTheDocument();
    expect(screen.queryByText('Pengajuan')).not.toBeInTheDocument();
    const steps = screen.getByRole('list', { name: 'Langkah' }).textContent ?? '';
    expect(steps).toContain('Waktu & lokasi');
    expect(steps).toContain('Dampak');
    // B-3: urutan isian Kejadian
    expect(screen.getByLabelText('Apa yang terjadi?')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Sumber informasi/ })).toBeInTheDocument();
  });

  it('Simpan draf memberi nomor, menyimpan insiden Draf, dan judul jadi "Ubah insiden" (B-1, B-9)', () => {
    useDraftStore.getState().patch({ title: 'Kabel panel ADR-02 hilang' });
    expect(isDirty(useDraftStore.getState())).toBe(true);
    renderIn(<ReportStep1Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }));
    const { draft } = useDraftStore.getState();
    expect(draft.no).toMatch(/^INS-SEN-2026-\d{4}$/);
    expect(isDirty(useDraftStore.getState())).toBe(false);
    const stored = useDemoStore.getState().incidents.find((i) => i.no === draft.no);
    expect(stored?.status).toBe('draf');
    expect(stored?.reporter).toBe('Budi Santoso');
    expect(screen.getByRole('heading', { level: 1, name: 'Ubah insiden' })).toBeInTheDocument();
    // B-8: pembuat draf melihat Hapus draf di header
    expect(screen.getByRole('button', { name: 'Hapus draf' })).toBeInTheDocument();
  });

  it('PA-09: memilih lokasi tidak mengisi Patokan otomatis', () => {
    renderIn(<ReportStep1Page />);
    expect(screen.getByText('Keterangan yang memudahkan petugas menemukan titik.')).toBeInTheDocument();
  });
});

describe('Dampak belum diketahui (B-11, ADJ-07)', () => {
  const base = { title: 'x', axes: ['prop' as const, 'man' as const], securityImpact: 'Kabel hilang.', category: 'Pencurian/Perampokan' };

  it('semua dampak belum diketahui: "Belum bisa disarankan", "Wajib dipilih", Berikutnya menahan dengan galat', () => {
    useDraftStore.getState().patch({ ...base, opsUnknown: true, lossUnknown: true, casualties: { belum: 0 } });
    const d = useDraftStore.getState().draft;
    expect(unknownImpacts(d)).toEqual(['kerugian', 'kondisi operasi', 'kondisi korban']);
    expect(suggestedSeverityOf(d, useDemoStore.getState().config)).toBeNull();
    renderIn(<ReportStep2Page />);
    expect(screen.getByText('Belum bisa disarankan')).toBeInTheDocument();
    expect(screen.getByText('Wajib dipilih')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(screen.getByText('Pilih tingkat keparahan dulu sebelum lanjut.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Sedang/ }));
    expect(screen.getByText('Dipilih pelapor')).toBeInTheDocument();
    expect(screen.queryByText('Pilih tingkat keparahan dulu sebelum lanjut.')).not.toBeInTheDocument();
  });

  it('sebagian belum diketahui: saran dari yang diketahui, tag "Otomatis · sementara" + kalimat saran sementara', () => {
    useDraftStore.getState().patch({ ...base, ops: 'berhenti', opsHours: 6, lossUnknown: true, casualties: { belum: 0 } });
    renderIn(<ReportStep2Page />);
    expect(screen.getByText('Otomatis · sementara')).toBeInTheDocument();
    expect(screen.getByText(/Saran sementara: bisa naik setelah dampak yang belum diketahui diperbarui selama penanganan\./)).toBeInTheDocument();
    expect(screen.queryByText(/setara/)).not.toBeInTheDocument();
  });

  it('keempat isian punya pilihan Belum diketahui', () => {
    useDraftStore.getState().patch({ ...base, axes: ['prop', 'man', 'ling', 'data'] });
    renderIn(<ReportStep2Page />);
    expect(screen.getByRole('checkbox', { name: 'Belum diketahui, masih dihitung' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: 'Belum diketahui' })).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Belum diketahui' })).toBeInTheDocument();
  });
});
