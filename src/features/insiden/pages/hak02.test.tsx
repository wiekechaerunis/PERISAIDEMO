// HAK-02: daftar Insiden menampilkan semua insiden di WK dalam cakupan pengguna; pintasan hanya filter tambahan; detail bukan PIC hanya lihat.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import type { Role } from '@/lib/rbac';
import { IncidentListPage } from './IncidentListPage';
import { IncidentDetailPage } from './IncidentDetailPage';
import { isPicOf } from '../logic/handling';
import { visibleIncidents } from '../logic/list';

const NO = 'INS-SEN-2026-0007';
const TITLE = 'Pencurian kabel listrik sumur ADR-07';
const store = () => useDemoStore.getState();

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
  // 0007 dijalankan dengan PIC Andi Pratama (seed awalnya Menunggu pemeriksaan)
  useDemoStore.setState({ incidents: store().incidents.map((i) => (i.no === NO ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama' } : i)) });
});

const renderList = (role: Role) => {
  store().setRole(role);
  return render(<MemoryRouter><IncidentListPage /></MemoryRouter>);
};
const renderDetail = (role: Role) => {
  store().setRole(role);
  return render(
    <MemoryRouter initialEntries={[`/insiden/${NO}`]}>
      <Routes><Route path="/insiden/:no" element={<IncidentDetailPage />} /></Routes>
    </MemoryRouter>,
  );
};

describe('HAK-02 · daftar Insiden per cakupan WK', () => {
  it('Rudi (PIC tindak lanjut, WK Andalas Darat): bawaan Semua dan INS-0007 tampil walau bukan laporannya', () => {
    renderList('pic-tl');
    expect(screen.getByRole('radio', { name: /^Semua/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Ditangani saya/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /Laporan saya/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(2);
  });

  it('Laporan saya dan Ditangani saya hanya menyaring tambahan', () => {
    renderList('pic-tl');
    const all = screen.getAllByRole('row').length;
    screen.getByRole('radio', { name: /Laporan saya/ }).click();
    expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(all);
  });

  it('Budi (pelapor), Hendra (SKK, semua KKKS) dan Sari (Pejabat) melihat INS-0007', () => {
    for (const role of ['pelapor', 'pengawas'] as Role[]) {
      store().setRole(role);
      expect(visibleIncidents(store().incidents, role).map((i) => i.no)).toContain(NO);
    }
    expect(visibleIncidents(store().incidents, 'pejabat').map((i) => i.no)).toContain(NO);
  });

  it('cakupan WK: insiden WK lain yang bukan laporan atau tanggungan pengguna tidak tampil', () => {
    const other = { ...store().incidents.find((i) => i.no === NO)!, no: 'INS-SEN-2026-0099', wk: 'WK Batu Ampar', reporter: 'Orang Lain', pic: 'Orang Lain' };
    const pool = [other, ...store().incidents];
    expect(visibleIncidents(pool, 'pic-tl').map((i) => i.no)).not.toContain('INS-SEN-2026-0099');
    expect(visibleIncidents(pool, 'pejabat').map((i) => i.no)).toContain('INS-SEN-2026-0099'); // Pejabat: semua WK organisasi
  });
});

describe('HAK-02 · detail untuk pengguna bukan PIC', () => {
  it('Rudi hanya melihat: tanpa Butuh penanganan, Tangani insiden, atau Aksi lain; kartu TL menandai miliknya', () => {
    store().setRole('pic-tl');
    expect(isPicOf(store().incidents.find((i) => i.no === NO)!, 'pic-tl')).toBe(false);
    renderDetail('pic-tl');
    expect(screen.queryByText(/Butuh penanganan/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Tangani insiden/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Tangani insiden/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Aksi lain/ })).toBeNull();
    const card = screen.getByRole('heading', { name: /^Tindak lanjut · 3/ }).closest('section') as HTMLElement;
    const rows = within(card).getAllByRole('link');
    const mine = rows.filter((r) => within(r).queryByText('Anda'));
    expect(mine.map((r) => r.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('TL-SEN-2026-0034'), expect.stringContaining('TL-SEN-2026-0041')]));
    expect(mine).toHaveLength(2);
    expect(rows.find((r) => r.textContent?.includes('TL-SEN-2026-0039'))).not.toHaveTextContent('Anda');
  });

  it('Budi (pelapor) melihat detail yang sama tanpa tindakan', () => {
    renderDetail('pelapor');
    expect(screen.queryByRole('button', { name: /Tangani insiden|Aksi lain/ })).toBeNull();
    expect(screen.getByRole('heading', { name: /^Tindak lanjut · 3/ })).toBeInTheDocument();
    expect(screen.queryByText('Anda')).toBeNull();
  });

  it('Andi (PIC insiden) tetap memakai halaman Tangani insiden', () => {
    expect(isPicOf(store().incidents.find((i) => i.no === NO)!, 'pic')).toBe(true);
  });
});
