import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReportStep1Page } from './ReportStep1Page';
import { useDraftStore } from '../logic/draft';
import { useCopilotStore } from '../copilot/copilotStore';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportStep1Page />
    </MemoryRouter>,
  );

describe('langkah 1 · pengaman jenis laporan', () => {
  beforeEach(() => {
    useDraftStore.getState().resetDraft();
    useCopilotStore.getState().reset(false);
  });

  it('jawaban Ya mengunci kartu Kerawanan', () => {
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'Ya' }));
    expect(screen.getByRole('radio', { name: /Kerawanan/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('radio', { name: /Insiden/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('jawaban Tidak menandai Kerawanan sebagai Saran tanpa mengunci', () => {
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'Tidak' }));
    expect(screen.getByText('Saran')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Kerawanan/ })).toHaveAttribute('aria-disabled', 'false');
  });

  it('Berikutnya tanpa isian wajib menampilkan galat dan tidak berpindah halaman', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(screen.getByText('Judul wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Pilih lokasi kejadian.')).toBeInTheDocument();
  });
});
