import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileIncidentListPage } from './MobileIncidentListPage';
import { useDemoStore } from '@/services/mock/store';
import type { Role } from '@/lib/rbac';

const renderList = (url = '/insiden') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileIncidentListPage />
    </MemoryRouter>,
  );
const asRole = (r: Role) => useDemoStore.getState().setRole(r);

describe('daftar insiden mobile per peran', () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.getState().resetDemo();
  });

  it('Pelapor melihat kartu, tab, dan FAB Buat laporan', () => {
    asRole('pelapor');
    renderList();
    expect(screen.getByRole('radio', { name: /^Insiden/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('link', { name: /Pencurian kabel listrik sumur ADR-07/ })).toHaveAttribute('href', '/insiden/INS-SEN-2026-0007');
    expect(screen.getByRole('link', { name: 'Buat laporan' })).toHaveAttribute('href', '/insiden/baru/temuan');
    expect(screen.getByRole('button', { name: 'Muat lebih banyak' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Kerawanan/ })).toHaveAttribute('href', '/insiden?tab=kerawanan');
  });

  it('Filter sheet menyaring dan menghitung', () => {
    asRole('pelapor');
    renderList();
    const total = screen.getAllByRole('link').filter((a) => a.classList.contains('card')).length;
    fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
    const sheet = screen.getByRole('dialog', { name: 'Filter' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Ditutup' }));
    expect(within(sheet).getByRole('button', { name: /^Tampilkan \d+ insiden$/ })).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole('button', { name: /^Tampilkan/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const cards = screen.getAllByRole('link').filter((a) => a.classList.contains('card'));
    expect(cards.length).toBeLessThan(total);
    expect(screen.getByRole('button', { name: 'Filter · 1' })).toBeInTheDocument();
    expect(screen.getByText(`${cards.length} dari ${total}`)).toBeInTheDocument();
    cards.forEach((c) => expect(within(c).getByText('Ditutup')).toBeInTheDocument());
  });

  it('Filter tanpa hasil menampilkan state filter kosong dan bisa dihapus', () => {
    asRole('pelapor');
    renderList();
    fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
    const sheet = screen.getByRole('dialog', { name: 'Filter' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Kritis' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Ditutup' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Tampilkan 0 insiden' }));
    expect(screen.getByText('Tidak ada insiden yang cocok dengan filter.')).toBeInTheDocument();
    expect(screen.getByText('Filter aktif: Keparahan Kritis, Status Ditutup.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
    expect(screen.queryByText('Tidak ada insiden yang cocok dengan filter.')).not.toBeInTheDocument();
  });

  it('Pejabat melihat varian MV1 (menunggu pemeriksaan, batas pemeriksaan, FAB)', () => {
    asRole('pejabat');
    renderList();
    expect(screen.getByRole('button', { name: 'Filter · 1' })).toBeInTheDocument();
    expect(screen.getByText('2 menunggu pemeriksaan')).toBeInTheDocument();
    expect(screen.getAllByText('Tinggi · awal')).toHaveLength(2);
    expect(screen.getByText('Batas 29 Okt, 08:34 · sisa 20 jam')).toBeInTheDocument();
    expect(screen.getByText('Lewat batas · 5 jam')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buat laporan' })).toBeInTheDocument();
  });

  it('PIC melihat varian MP1 tanpa FAB, dengan pintasan dan indikator tenggat', () => {
    asRole('pic');
    renderList();
    expect(screen.getByRole('button', { name: /Ditangani saya/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/insiden yang Anda tangani · tenggat terdekat dulu/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buat laporan' })).not.toBeInTheDocument();
    expect(document.querySelector('.in-due')).not.toBeNull();
  });

  it('?state=kosong menampilkan empty state', () => {
    asRole('pelapor');
    renderList('/insiden?state=kosong');
    expect(screen.getByText('Belum ada insiden yang dilaporkan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buat laporan' })).toBeInTheDocument();
  });

  it('state lain: memuat, gagal, terbatas, filter-kosong', () => {
    asRole('pelapor');
    const a = renderList('/insiden?state=memuat');
    expect(screen.getByRole('status', { name: 'Memuat daftar insiden' })).toBeInTheDocument();
    a.unmount();
    const b = renderList('/insiden?state=gagal');
    expect(screen.getByText('Daftar insiden tidak dapat dimuat.')).toBeInTheDocument();
    b.unmount();
    const c = renderList('/insiden?state=terbatas');
    expect(screen.getByText('Anda tidak punya akses ke insiden ini.')).toBeInTheDocument();
    c.unmount();
    renderList('/insiden?state=filter-kosong');
    expect(screen.getByRole('button', { name: 'Filter · 2' })).toBeInTheDocument();
  });

  it('SKK tanpa FAB, kartu menampilkan KKKS', () => {
    asRole('pengawas');
    renderList();
    expect(screen.queryByRole('link', { name: 'Buat laporan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter · 1' })).toBeInTheDocument();
    expect(screen.getAllByText('Belum diperiksa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PT Samudra Energi Nusantara').length).toBeGreaterThan(0);
  });

  it('tab Kerawanan menautkan kartu ke /kerawanan/{no}', () => {
    asRole('pelapor');
    renderList('/insiden?tab=kerawanan');
    expect(screen.getByRole('radio', { name: /Kerawanan/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('link', { name: /Pagar sisi barat sumur ADR-07 roboh/ })).toHaveAttribute('href', '/kerawanan/KRW-SEN-2026-0047');
    expect(screen.getByRole('radio', { name: /^Insiden/ })).toHaveAttribute('href', '/insiden');
  });
});
