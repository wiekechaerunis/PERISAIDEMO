import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewerSelect, REVIEWER_HELP } from './ReviewerSelect';
import { PEJABAT_NAMES, reviewerOptions } from '@/lib/rbac';

function Host({ options = PEJABAT_NAMES }: { options?: string[] }) {
  const [v, setV] = useState<string[] | null>(null);
  return <ReviewerSelect options={options} value={v} onChange={setV} />;
}

describe('Diperiksa oleh (WFL-01 FR-WF-37)', () => {
  it('bawaan semua Pejabat Berwenang terpilih dengan teks bantu baku', () => {
    render(<Host />);
    expect(screen.getByRole('button', { name: /Diperiksa oleh/ })).toHaveTextContent('Semua Pejabat Berwenang (3)');
    expect(screen.getByText(REVIEWER_HELP)).toBeInTheDocument();
  });

  it('boleh dikurangi tetapi minimal satu tetap terpilih', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: /Diperiksa oleh/ }));
    fireEvent.click(screen.getByRole('option', { name: /Hendra Saputra/ }));
    fireEvent.click(screen.getByRole('option', { name: /Dewi Anggraini/ }));
    expect(screen.getByRole('button', { name: /Diperiksa oleh/ })).toHaveTextContent('Sari Wulandari');
    fireEvent.click(screen.getByRole('option', { name: /Sari Wulandari/ })); // yang terakhir tidak bisa dilepas
    expect(screen.getByRole('option', { name: /Sari Wulandari/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('nama pengaju tidak muncul, kecuali dia satu-satunya Pejabat', () => {
    expect(reviewerOptions('Sari Wulandari')).toEqual(['Hendra Saputra', 'Dewi Anggraini']);
    expect(reviewerOptions('Budi Santoso')).toEqual(PEJABAT_NAMES);
  });
});
