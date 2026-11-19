import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { useDraftStore } from '../logic/draft';
import { ImpactAxes } from './ImpactAxes';
import { SeverityAuto } from './SeverityAuto';
import type { Severity } from '@/lib/severity';

function Axes() {
  const { draft, patch } = useDraftStore();
  return <ImpactAxes draft={draft} onPatch={patch} aiFilled={[]} errors={{}} />;
}
function Sev() {
  const [level, setLevel] = useState<Severity>('tinggi');
  const [reason, setReason] = useState('');
  return <SeverityAuto suggested="tinggi" level={level} parts={[]} reason={reason} onPick={setLevel} onReason={setReason} />;
}

beforeEach(() => useDraftStore.getState().resetDraft());

describe('langkah 2', () => {
  it('memilih sumbu Manusia menampilkan grup korban dan menyembunyikan yang lain', () => {
    render(<Axes />);
    expect(screen.queryByText('Kondisi korban')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Manusia' }));
    expect(screen.getByText('Kondisi korban')).toBeInTheDocument();
    expect(screen.queryByText('Kondisi operasi')).toBeNull();
    expect(screen.queryByText('Sebaran dampak')).toBeNull();
  });

  it('"Belum diketahui" menghapus pilihan korban lain, dan sebaliknya', () => {
    render(<Axes />);
    fireEvent.click(screen.getByRole('button', { name: 'Manusia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Luka ringan (P3K)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Meninggal' }));
    expect(Object.keys(useDraftStore.getState().draft.casualties).sort()).toEqual(['meninggal', 'p3k']);
    fireEvent.click(screen.getByRole('button', { name: 'Belum diketahui' }));
    expect(Object.keys(useDraftStore.getState().draft.casualties)).toEqual(['belum']);
    fireEvent.click(screen.getByRole('button', { name: 'Luka ringan (P3K)' }));
    expect(Object.keys(useDraftStore.getState().draft.casualties)).toEqual(['p3k']);
  });

  it('level beda dari saran mewajibkan alasan', () => {
    render(<Sev />);
    expect(screen.queryByText('Kenapa berbeda dari saran?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ubah' }));
    fireEvent.click(screen.getByRole('radio', { name: /Kritis/ }));
    expect(screen.getByText('Kenapa berbeda dari saran?')).toBeInTheDocument();
    expect(screen.getByText('Diubah pelapor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Tinggi/ }));
    expect(screen.queryByText('Kenapa berbeda dari saran?')).toBeNull();
  });
});
