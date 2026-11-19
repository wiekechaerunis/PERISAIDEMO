import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { markRestricted } from '@/services/mock/workflow';
import { IncidentDetailPage } from './IncidentDetailPage';

const renderDetail = (no: string, search = '') =>
  render(
    <MemoryRouter initialEntries={[`/insiden/${no}${search}`]}>
      <Routes>
        <Route path="/insiden/:no" element={<IncidentDetailPage />} />
        <Route path="/insiden" element={<div>daftar</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
});

describe('Detail insiden', () => {
  it('Pelapor melihat INS-SEN-2026-0007: Tinggi dan Menunggu pemeriksaan dari data store', () => {
    renderDetail('INS-SEN-2026-0007');
    expect(screen.getByRole('heading', { name: 'Pencurian kabel listrik sumur ADR-07' })).toBeInTheDocument();
    expect(screen.getAllByText('Menunggu pemeriksaan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tinggi').length).toBeGreaterThan(0);
    expect(screen.getByText('Lampiran · 2 file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tarik kembali/ })).toBeInTheDocument();
  });

  it('Tarik kembali: dialog konfirmasi lalu status jadi Draf', () => {
    renderDetail('INS-SEN-2026-0007');
    fireEvent.click(screen.getByRole('button', { name: /Tarik kembali/ }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Tarik kembali jadi draf?')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tarik kembali' }));
    expect(useDemoStore.getState().incidents.find((i) => i.no === 'INS-SEN-2026-0007')?.status).toBe('draf');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getAllByText('Draf').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Lanjutkan draf' })).toBeInTheDocument();
  });

  it('insiden restricted menampilkan state Terbatas', () => {
    useDemoStore.getState().decide((s) => markRestricted(s, 'INS-SEN-2026-0007', 'Sari Wulandari'));
    renderDetail('INS-SEN-2026-0007');
    expect(screen.getByText('Anda tidak punya akses ke insiden ini.')).toBeInTheDocument();
    expect(screen.queryByText('Pencurian kabel listrik sumur ADR-07')).toBeNull();
  });

  it('SKK melihat banner belum diperiksa tanpa tombol Tarik kembali', () => {
    useDemoStore.getState().setRole('pengawas');
    renderDetail('INS-SEN-2026-0007');
    expect(screen.getByText('Belum diperiksa Pejabat Berwenang KKKS.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tarik kembali/ })).toBeNull();
  });

  it('?state=gagal dan ?state=memuat', () => {
    const { unmount } = renderDetail('INS-SEN-2026-0007', '?state=gagal');
    expect(screen.getByText('Detail insiden tidak dapat dimuat.')).toBeInTheDocument();
    unmount();
    renderDetail('INS-SEN-2026-0007', '?state=memuat');
    expect(document.querySelector('main[aria-busy="true"]')).not.toBeNull();
  });
});
