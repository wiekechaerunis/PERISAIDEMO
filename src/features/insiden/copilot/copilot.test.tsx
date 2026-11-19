import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const extract = vi.fn();
vi.mock('@/services/ai', () => ({
  ai: { extract: (s: string) => extract(s), isOutOfScope: () => false },
  claudeActive: () => true,
  forceMockAi: vi.fn(),
}));

import { CopilotPanel } from './CopilotPanel';
import { useCopilotStore } from './copilotStore';
import { useDraftStore } from '../logic/draft';
import { extractStory } from '@/services/ai/mock';

const STORY = 'Jam 1 malam kabel listrik pompa sumur ADR-07 dipotong orang tak dikenal, sekitar 40 m hilang. Tidak ada korban.';
const renderPanel = () => render(<MemoryRouter><CopilotPanel step={1} /></MemoryRouter>);

describe('AI Copilot · state gagal (S19) dan suara', () => {
  beforeEach(() => {
    extract.mockReset();
    useCopilotStore.getState().reset(false);
    useDraftStore.getState().resetDraft();
  });

  it('AI gagal menampilkan "AI Copilot sedang tidak tersedia" dan Coba lagi memulihkan', async () => {
    extract.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(extractStory(STORY));
    renderPanel();
    fireEvent.change(screen.getByLabelText('Ceritakan kejadian'), { target: { value: STORY } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    expect(await screen.findByText('AI Copilot sedang tidak tersedia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pakai mode contoh' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    await waitFor(() => expect(screen.getByText(/Pakai semua yang tersisa/)).toBeInTheDocument());
  });

  it('tanpa dukungan suara, mikrofon menampilkan izin belum diberikan (S20)', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Rekam suara' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Izin mikrofon belum diberikan');
  });
});
