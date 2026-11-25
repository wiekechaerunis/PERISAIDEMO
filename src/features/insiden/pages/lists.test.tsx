import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IncidentListPage } from './IncidentListPage';
import { TasksPage } from './TasksPage';
import { useDemoStore } from '@/services/mock/store';
import { taskCount } from '../logic/list';
import type { Role } from '@/lib/rbac';

const renderList = (url = '/insiden') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <IncidentListPage />
    </MemoryRouter>,
  );

const asRole = (r: Role) => useDemoStore.getState().setRole(r);
const quick = (name: RegExp) => screen.getByRole('radio', { name });
const bodyRows = () => within(screen.getAllByRole('table')[0]).getAllByRole('row').slice(1);

describe('daftar insiden dan Tugas saya per peran', () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.getState().resetDemo();
  });

  it('Pejabat: pintasan menunggu pemeriksaan punya hitungan benar dan kolom Batas pemeriksaan', () => {
    asRole('pejabat');
    renderList();
    // V11: pintasan tindakan Pejabat = insiden Menunggu pemeriksaan (0007, 0009) + eskalasi (0005)
    expect(quick(/Perlu tindakan saya/)).toHaveTextContent('3');
    expect(quick(/Perlu tindakan saya/)).toHaveAttribute('aria-checked', 'true');
    // board V11 (canvas 24 Nov): label pintasan "Terlambat" dan "Dieskalasi ke saya"
    expect(quick(/Terlambat/)).toHaveTextContent('2');
    expect(quick(/Dieskalasi ke saya/)).toHaveTextContent('1');
    expect(screen.getByText('Batas pemeriksaan')).toBeInTheDocument();
    expect(screen.getByText('Lewat 5 jam')).toBeInTheDocument();
    expect(screen.getByText('sisa 20 jam')).toBeInTheDocument();
    expect(screen.getByText('3 insiden')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pencurian kabel listrik sumur ADR-07' })).toHaveAttribute(
      'href',
      '/insiden/INS-SEN-2026-0007',
    );
  });

  it('SKK: pintasan Tinggi & Kritis menyaring benar', () => {
    asRole('pengawas');
    renderList();
    expect(screen.getByRole('link', { name: 'Penembakan pos jaga oleh OTK' })).toBeInTheDocument();
    fireEvent.click(quick(/Tinggi & Kritis/));
    const titles = bodyRows().map((r) => within(r).getAllByRole('link')[0].textContent);
    expect(titles.sort()).toEqual(
      [
        'Kabel pompa ADR-07 dipotong',
        'Pencurian kabel listrik sumur ADR-07',
        'Penembakan pos jaga oleh OTK',
        'Penghadangan truk logistik oleh warga',
      ].sort(),
    );
    expect(screen.queryByText('Pencurian solar di tangki T-02')).not.toBeInTheDocument();
    // status SKK untuk Menunggu pemeriksaan
    expect(screen.getAllByText('Belum diperiksa').length).toBeGreaterThan(0);
  });

  it('SKK: filter terbuka memuat 19 kategori di dropdown Kategori (Main-Filter, B-16)', () => {
    asRole('pengawas');
    renderList();
    fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
    const dlg = screen.getByRole('dialog', { name: 'Filter insiden' });
    expect(within(dlg).getByText('Kategori')).toBeInTheDocument();
    // B-16: Kategori kini dropdown pilih-banyak, bukan 19 chip
    fireEvent.click(within(dlg).getByRole('button', { name: 'Kategori: Semua kategori' }));
    expect(within(dlg).getAllByRole('checkbox').filter((c) => /Serangan data/.test(c.textContent ?? ''))).toHaveLength(1);
    expect(within(dlg).getByText('Periode kejadian')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Blokade area' }));
    expect(screen.getByText('Kategori: Blokade area')).toBeInTheDocument();
    expect(within(dlg).getByRole('button', { name: /Tampilkan 1 insiden/ })).toBeInTheDocument();
  });

  it('?state=kosong menampilkan empty state', () => {
    renderList('/insiden?state=kosong');
    expect(screen.getByText('Belum ada insiden yang dilaporkan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buat laporan/ })).toBeInTheDocument();
  });

  it('state daftar lain: memuat, filter-kosong, gagal, terbatas', () => {
    const { unmount } = renderList('/insiden?state=memuat');
    expect(screen.getByLabelText('Memuat daftar insiden')).toHaveAttribute('aria-busy', 'true');
    unmount();
    const b = renderList('/insiden?state=filter-kosong');
    expect(screen.getByText('Tidak ada insiden yang cocok dengan filter.')).toBeInTheDocument();
    expect(screen.getByText('Keparahan: Kritis')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus filter' }));
    expect(screen.queryByText('Tidak ada insiden yang cocok dengan filter.')).not.toBeInTheDocument();
    b.unmount();
    const c = renderList('/insiden?state=gagal');
    expect(screen.getByRole('alert')).toHaveTextContent('Daftar insiden tidak dapat dimuat.');
    fireEvent.click(screen.getByRole('button', { name: /Muat ulang/ }));
    expect(screen.queryByText('Daftar insiden tidak dapat dimuat.')).not.toBeInTheDocument();
    c.unmount();
    renderList('/insiden?state=terbatas');
    expect(screen.getByText('Anda tidak punya akses ke insiden ini.')).toBeInTheDocument();
  });

  it('PIC: kolom Tenggat dengan indikator lewat/sisa', () => {
    asRole('pic');
    renderList();
    expect(screen.getByText('Tenggat')).toBeInTheDocument();
    expect(screen.getByText('lewat 2 hari')).toBeInTheDocument();
  });

  it('Kerawanan: kolom, pintasan, dan tag Makin rawan sesuai K.1', () => {
    asRole('pejabat');
    renderList('/insiden?tab=kerawanan');
    expect(screen.getByText('Jenis · lokasi')).toBeInTheDocument();
    expect(screen.getByText('Dilaporkan oleh')).toBeInTheDocument();
    expect(quick(/Makin rawan/)).toHaveTextContent('1');
    expect(screen.getAllByText('Makin rawan').length).toBeGreaterThan(1);
    fireEvent.click(quick(/Makin rawan/));
    expect(screen.getByText('Pagar sisi barat sumur ADR-07 roboh')).toBeInTheDocument();
    expect(screen.getByText('1 dari 8 kerawanan')).toBeInTheDocument();
  });

  it('Tugas saya Pejabat memuat insiden review-internal dan konsisten dengan hitungan sidebar', () => {
    asRole('pejabat');
    render(
      <MemoryRouter initialEntries={['/tugas']}>
        <TasksPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Tugas saya' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pencurian kabel listrik sumur ADR-07' })).toHaveAttribute(
      'href',
      '/insiden/INS-SEN-2026-0007',
    );
    expect(screen.getByRole('link', { name: 'Kabel pompa ADR-07 dipotong' })).toBeInTheDocument();
    expect(screen.getByText('Kemungkinan ganda')).toBeInTheDocument();
    expect(screen.getByText('Lewat batas')).toBeInTheDocument();
    const { incidents, role } = useDemoStore.getState();
    const n = taskCount(incidents, role);
    expect(n).toBe(3);
    expect(screen.getByText(`${n} tugas · urut dari yang paling lama menunggu`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tugas saya/ })).toHaveTextContent(String(n));
  });

  it('Tugas saya: PIC melihat tugas tangani, PIC tindak lanjut melihat tugas tindak lanjut', () => {
    asRole('pic');
    const { unmount } = render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Lewat tenggat')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Tangani' }).length).toBeGreaterThan(0);
    unmount();
    // TL sebuah insiden baru ada setelah insiden disetujui (B11)
    useDemoStore.setState({ incidents: useDemoStore.getState().incidents.map((i) => (i.no === 'INS-SEN-2026-0007' ? { ...i, status: 'dalam-penanganan' as const, pic: 'Andi Pratama' } : i)) });
    asRole('pic-tl');
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    );
    // fase 6: PIC tindak lanjut (Rudi Hartono) kini punya tugas TL (T4b), bukan empty state
    expect(screen.getByText('Dikembalikan')).toBeInTheDocument();
    expect(screen.getAllByText('Perlu dikerjakan').length).toBeGreaterThan(0);
  });
});
