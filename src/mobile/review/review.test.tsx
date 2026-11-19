import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { MobileReviewPage } from './MobileReviewPage';

function Landing({ label }: { label: string }) {
  const loc = useLocation();
  return <div>{label}:{loc.pathname}{loc.search}|{(loc.state as { toast?: string } | null)?.toast}</div>;
}

function renderReview(no: string, query = '') {
  return render(
    <MemoryRouter initialEntries={[`/insiden/${no}/review${query}`]}>
      <Routes>
        <Route path="/insiden/:no/review" element={<MobileReviewPage />} />
        <Route path="/insiden/:no" element={<Landing label="detail" />} />
        <Route path="/insiden" element={<Landing label="daftar" />} />
      </Routes>
    </MemoryRouter>,
  );
}
const inc = (no: string) => useDemoStore.getState().incidents.find((i) => i.no === no)!;
const pick = (combo: string, option: string) => {
  fireEvent.click(screen.getByRole('button', { name: combo }));
  fireEvent.click(screen.getByRole('option', { name: new RegExp(option) }));
};

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.setState({ role: 'pejabat' });
});

describe('Review insiden mobile · Pejabat Berwenang', () => {
  it('Setujui 0007 lewat sheet: status Dalam penanganan dengan PIC dan toast', () => {
    const { container } = renderReview('INS-SEN-2026-0007');
    expect(container.querySelector('.in-m')).not.toBeNull();
    expect(screen.getByText('Butuh keputusan pemeriksaan')).toBeInTheDocument();
    pick('PIC penanganan', 'Dedi Kurniawan');
    fireEvent.click(screen.getByRole('checkbox', { name: /Lakukan patroli tambahan/ }));
    expect(screen.getByText('1 saran langkah dikirim ke Dedi Kurniawan saat Anda menyetujui')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    const sheet = screen.getByRole('dialog', { name: 'Setujui insiden ini?' });
    expect(within(sheet).getByText('Dedi Kurniawan')).toBeInTheDocument();
    expect(within(sheet).getByText(/Tenggat 2 Nov 2026/)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Setujui insiden' }));
    const i = inc('INS-SEN-2026-0007');
    expect(i.status).toBe('dalam-penanganan');
    expect(i.pic).toBe('Dedi Kurniawan');
    expect(i.forwardedSteps).toEqual(['Lakukan patroli tambahan di area sumur dan jalur akses.']);
    expect(screen.getByText(/detail:\/insiden\/INS-SEN-2026-0007\|Insiden INS-SEN-2026-0007 disetujui\. 1 saran langkah dikirim ke Dedi Kurniawan\./)).toBeInTheDocument();
  });

  it('keparahan diubah tanpa alasan ditolak: galat tampil, sheet tidak terbuka, status tetap', () => {
    renderReview('INS-SEN-2026-0007');
    expect(screen.queryByLabelText('Alasan perubahan keparahan')).not.toBeInTheDocument();
    pick('Keparahan resmi', 'Sedang');
    fireEvent.change(screen.getByLabelText('Alasan perubahan keparahan'), { target: { value: 'Turun' } });
    fireEvent.click(screen.getByRole('button', { name: 'Setujui' }));
    expect(screen.queryByRole('dialog', { name: 'Setujui insiden ini?' })).not.toBeInTheDocument();
    expect(screen.getByText('1 isian perlu dilengkapi.')).toBeInTheDocument();
    expect(screen.getByText(/Tulis alasan perubahan keparahan, minimal 10 karakter/)).toBeInTheDocument();
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
  });

  it('klik pola di layar peta menyorot titik yang cocok dan meredupkan sisanya', () => {
    const { container } = renderReview('INS-SEN-2026-0007');
    fireEvent.click(screen.getByRole('link', { name: /Buka peta sebaran \d+ insiden serupa layar penuh/ }));
    expect(screen.getByText(/Insiden serupa · \d+/)).toBeInTheDocument();
    const dots = () => container.querySelectorAll('g.pt');
    const total = dots().length;
    expect(total).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('g.pt.hit')).toHaveLength(0);
    const chip = screen.getByRole('button', { name: /^Lokasi · AI$/ });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    const hit = container.querySelectorAll('g.pt.hit').length;
    const dim = container.querySelectorAll('g.pt.dim').length;
    expect(hit).toBeGreaterThan(0);
    expect(hit + dim).toBe(total);
    expect(screen.getByText('Area sumur terpencil')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Semua' }));
    expect(container.querySelectorAll('g.pt.hit')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Review insiden' }));
    expect(screen.getByText('Butuh keputusan pemeriksaan')).toBeInTheDocument();
  });

  it('Minta revisi tanpa alasan ditolak; dengan alasan mengembalikan ke pelapor', () => {
    renderReview('INS-SEN-2026-0007');
    fireEvent.click(screen.getByRole('button', { name: 'Minta revisi dan aksi lain' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Minta revisi/ }));
    const sheet = screen.getByRole('dialog', { name: 'Minta revisi laporan' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Minta revisi' }));
    expect(within(sheet).getByText('Tulis alasan revisi.')).toBeInTheDocument();
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
    fireEvent.change(within(sheet).getByLabelText('Alasan revisi'), { target: { value: 'Perkiraan kerugian belum ada. Mohon lengkapi.' } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Minta revisi' }));
    expect(inc('INS-SEN-2026-0007').status).toBe('perlu-perbaikan');
    expect(screen.getByText(/daftar:\/insiden\|Revisi diminta\. INS-SEN-2026-0007 dikembalikan ke pelapor\./)).toBeInTheDocument();
  });

  it('Batalkan tanpa alasan ditolak', () => {
    renderReview('INS-SEN-2026-0007');
    fireEvent.click(screen.getByRole('button', { name: /Aksi lain: Jadikan kerawanan/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Batalkan insiden/ }));
    const sheet = screen.getByRole('dialog', { name: 'Batalkan insiden?' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Batalkan insiden' }));
    expect(within(sheet).getByText('Tulis alasan pembatalan.')).toBeInTheDocument();
    expect(inc('INS-SEN-2026-0007').status).toBe('review-internal');
  });

  it('kemungkinan ganda 0009: Setujui nonaktif; Gabung ke 0007 lewat sheet', () => {
    renderReview('INS-SEN-2026-0009');
    expect(screen.getByRole('button', { name: 'Setujui' })).toHaveAttribute('aria-disabled', 'true');
    const sheet = screen.getByRole('dialog', { name: 'Sepertinya sudah dilaporkan' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Gabung ke INS-SEN-2026-0007' }));
    expect(inc('INS-SEN-2026-0009')).toMatchObject({ status: 'digabung', mergedInto: 'INS-SEN-2026-0007' });
    expect(screen.getByText(/daftar:\/insiden\|INS-SEN-2026-0009 digabung ke INS-SEN-2026-0007\./)).toBeInTheDocument();
  });

  it('insiden yang sudah diputus menampilkan keadaan kosong', () => {
    renderReview('INS-SEN-2026-0002');
    expect(screen.getByText('Insiden ini tidak lagi menunggu pemeriksaan.')).toBeInTheDocument();
  });
});
