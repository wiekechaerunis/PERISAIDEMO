import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewerSelect, REVIEWER_EMPTY, REVIEWER_HELP } from './ReviewerSelect';
import { PEJABAT_NAMES, reviewerOptions } from '@/lib/rbac';

function Host({ options = PEJABAT_NAMES, allowEmpty = false, self }: { options?: string[]; allowEmpty?: boolean; self?: string }) {
  const [v, setV] = useState<string[] | null>(null);
  return <ReviewerSelect options={options} value={v} onChange={setV} allowEmpty={allowEmpty} self={self} />;
}

// Tampilan mengikuti board I14m (B-14): combobox berisi chip per orang, daftar bercentang dengan jabatan.
describe('Diperiksa oleh (WFL-01 FR-WF-37, B-14)', () => {
  it('bawaan semua Pejabat Berwenang terpilih sebagai chip dengan teks bantu baku', () => {
    render(<Host />);
    const box = screen.getByRole('combobox', { name: /Diperiksa oleh/ });
    PEJABAT_NAMES.forEach((n) => expect(box).toHaveTextContent(n));
    expect(screen.getByText(REVIEWER_HELP)).toBeInTheDocument();
    fireEvent.click(box);
    expect(screen.getByText('3 dari 3 · Semua Pejabat Berwenang')).toBeInTheDocument();
    expect(screen.getByText('Senior Manager Security')).toBeInTheDocument();
  });

  it('boleh dikurangi tetapi minimal satu tetap terpilih', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('combobox', { name: /Diperiksa oleh/ }));
    fireEvent.click(screen.getByRole('option', { name: /Hendra Saputra/ }));
    fireEvent.click(screen.getByRole('option', { name: /Dewi Anggraini/ }));
    fireEvent.click(screen.getByRole('option', { name: /Sari Wulandari/ })); // yang terakhir tidak bisa dilepas
    expect(screen.getByRole('option', { name: /Sari Wulandari/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('mode modal Ajukan: boleh dikosongkan dan menampilkan galat', () => {
    render(<Host allowEmpty />);
    fireEvent.click(screen.getByRole('combobox', { name: /Diperiksa oleh/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pilih semua/ }));
    expect(screen.getByText(REVIEWER_EMPTY)).toBeInTheDocument();
    expect(screen.getByText('Pilih pemeriksa')).toBeInTheDocument();
  });

  it('ADJ-01: nama pengaju tetap muncul dan ditandai (Anda)', () => {
    expect(reviewerOptions('Sari Wulandari')).toEqual(PEJABAT_NAMES);
    render(<Host self="Sari Wulandari" />);
    expect(screen.getByRole('combobox', { name: /Diperiksa oleh/ })).toHaveTextContent('Sari Wulandari (Anda)');
  });
});
