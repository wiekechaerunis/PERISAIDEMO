import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { KonfigurasiDaftarPage } from './KonfigurasiDaftarPage';
import { MatriksKeparahanPage } from './MatriksKeparahanPage';
import { TenggatPage } from './TenggatPage';
import { useDemoStore } from '@/services/mock/store';
import type { Role } from '@/lib/rbac';

const renderAt = (el: React.ReactNode, url: string) => render(<MemoryRouter initialEntries={[url]}>{el}</MemoryRouter>);
const asRole = (r: Role) => useDemoStore.getState().setRole(r);
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

describe('Konfigurasi Modul', () => {
  beforeEach(() => {
    localStorage.clear();
    useDemoStore.getState().resetDemo();
    asRole('admin');
  });

  it('Daftar: grup Insiden terbuka dengan nilai dari store, grup lain tertutup', () => {
    renderAt(<KonfigurasiDaftarPage />, '/konfigurasi');
    expect(screen.getByRole('heading', { name: 'Konfigurasi Modul' })).toBeInTheDocument();
    expect(screen.getByText('5 level · versi 2')).toBeInTheDocument();
    expect(screen.getByText('1–14 hari')).toBeInTheDocument();
    expect(screen.queryByText(/Nilai contoh/)).not.toBeInTheDocument();
    expect(screen.queryByText('Kategori anggaran')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Anggaran WP&B/ }));
    expect(screen.getByText('Kategori anggaran')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Buka' })[0]).toHaveAttribute('href', '/konfigurasi/matriks-keparahan');
  });

  it('(a) Tenggat: Kritis 1 → 2 menyimpan, menambah riwayat dan memperbarui pratinjau tanggal', () => {
    renderAt(<TenggatPage />, '/konfigurasi/tenggat');
    expect(screen.getByText('Registrasi 18 Nov, 10:42 → 19 Nov, 10:42')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
    type('Tenggat Kritis (hari)', '2');
    expect(screen.getByText('1 perubahan belum disimpan')).toBeInTheDocument();
    expect(screen.getByText('sebelumnya 1')).toBeInTheDocument();
    expect(screen.getByText('Registrasi 18 Nov, 10:42 → 20 Nov, 10:42')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(useDemoStore.getState().config.deadlines.kritis).toBe(2);
    expect(screen.getByRole('status')).toHaveTextContent('Tenggat disimpan. Berlaku untuk insiden baru.');
    const items = within(screen.getByRole('heading', { name: 'Riwayat perubahan' }).parentElement!).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Kritis 1 → 2 hari kerja oleh Rina Hapsari, Admin SKK');
    expect(items[0]).toHaveTextContent('18 Nov 2026, 14:10 WIB');
    expect(screen.getByText(/Terakhir diubah Rina Hapsari/)).toBeInTheDocument();
    expect(useDemoStore.getState().config.history![0].text).toBe('Kritis 1 → 2 hari kerja');
  });

  it('Tenggat ?state=disimpan memperagakan varian setelah simpan', () => {
    renderAt(<TenggatPage />, '/konfigurasi/tenggat?state=disimpan');
    expect(useDemoStore.getState().config.deadlines.kritis).toBe(2);
    expect(screen.getByText(/Kritis 1 → 2 hari kerja/)).toBeInTheDocument();
  });

  it('(b) Tenggat: nilai tak valid menampilkan galat dan tidak menyimpan', () => {
    renderAt(<TenggatPage />, '/konfigurasi/tenggat');
    for (const bad of ['0', '', 'abc', '2,5']) {
      type('Tenggat Tinggi (hari)', bad);
      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Isi bilangan bulat, minimal 1 hari.');
    }
    expect(useDemoStore.getState().config.deadlines.tinggi).toBe(3);
    expect(useDemoStore.getState().config.history).toHaveLength(3);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('Matriks: tampilan versi 2 dengan pratinjau Rupiah memakai kurs store', () => {
    renderAt(<MatriksKeparahanPage />, '/konfigurasi/matriks-keparahan');
    expect(screen.getByText('Versi 2 · berlaku sejak 1 Jan 2027')).toBeInTheDocument();
    expect(screen.getByText('kurs contoh 16.500')).toBeInTheDocument();
    expect(screen.getByText('Rp16,5 jt – < Rp165 jt')).toBeInTheDocument();
    expect(screen.getByText('≥ Rp16,5 M')).toBeInTheDocument();
    expect(screen.getByText('Versi 1')).toBeInTheDocument();
    expect(screen.getByText('1 Jan 2024 – 31 Des 2026')).toBeInTheDocument();
  });

  it('Matriks: versi baru disimpan, ambang berubah dan saran keparahan ikut', () => {
    renderAt(<MatriksKeparahanPage />, '/konfigurasi/matriks-keparahan');
    fireEvent.click(screen.getByRole('button', { name: /Buat versi baru/ }));
    expect(screen.getByText('Versi 3 · draf')).toBeInTheDocument();
    type('Batas bawah Rendah (USD)', '2000');
    fireEvent.change(screen.getByLabelText(/Dasar perubahan/), { target: { value: 'Keputusan rapat SKK no. 7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan versi 3' }));
    expect(useDemoStore.getState().config.lossThresholdsUsd.rendah).toBe(2000);
    expect(screen.getByRole('status')).toHaveTextContent('Versi 3 disimpan. Berlaku mulai 1 Jan 2028.');
    expect(screen.getByText('Versi 3 · berlaku sejak 1 Jan 2028')).toBeInTheDocument();
    expect(screen.getByText(/Dasar: Keputusan rapat SKK no. 7/)).toBeInTheDocument();
  });

  it('(c) Matriks: ambang tidak monoton ditolak', () => {
    renderAt(<MatriksKeparahanPage />, '/konfigurasi/matriks-keparahan?state=ubah');
    type('Batas bawah Sedang (USD)', '500');
    fireEvent.change(screen.getByLabelText(/Dasar perubahan/), { target: { value: 'Rapat SKK' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan versi 3' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Harus lebih besar dari ambang Rendah.');
    expect(useDemoStore.getState().config.lossThresholdsUsd.sedang).toBe(10_000);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('Matriks: dasar perubahan wajib', () => {
    renderAt(<MatriksKeparahanPage />, '/konfigurasi/matriks-keparahan?state=ubah');
    type('Batas bawah Rendah (USD)', '1500');
    fireEvent.click(screen.getByRole('button', { name: 'Simpan versi 3' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Dasar perubahan wajib diisi.');
    expect(useDemoStore.getState().config.lossThresholdsUsd.rendah).toBe(1000);
  });

  it('(d) peran non-admin tidak bisa mengubah: mendapat state terbatas tanpa kontrol ubah', () => {
    asRole('pelapor');
    for (const [el, url] of [
      [<TenggatPage />, '/konfigurasi/tenggat'],
      [<MatriksKeparahanPage />, '/konfigurasi/matriks-keparahan?state=ubah'],
      [<KonfigurasiDaftarPage />, '/konfigurasi'],
    ] as const) {
      const { unmount } = renderAt(el, url);
      expect(screen.getByText('Anda tidak punya akses ke Konfigurasi Modul.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Simpan/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Buat versi baru/ })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Tenggat Kritis (hari)')).not.toBeInTheDocument();
      unmount();
    }
    expect(useDemoStore.getState().config.deadlines.kritis).toBe(1);
  });

  it('migrasi: konfigurasi tersimpan lama tanpa history diisi riwayat seed', async () => {
    const mig = useDemoStore.persist.getOptions().migrate!;
    const old = { config: { deadlines: { kritis: 1, tinggi: 4, sedang: 7, rendah: 14, 'sangat-rendah': 14 }, lossThresholdsUsd: { rendah: 1, sedang: 2, tinggi: 3, kritis: 4 }, kursIdrPerUsd: 16000 } };
    const out = (await mig(old, 2)) as { config: { deadlines: { tinggi: number }; history: unknown[] } };
    expect(out.config.deadlines.tinggi).toBe(4);
    expect(out.config.history.length).toBe(3);
  });
});
