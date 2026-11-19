// Tab Aturan (board V2-30..32): daftar, panel editor, Coba (uji aturan).
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useDemoStore } from '@/services/mock/store';
import { AturanTab } from './components/monitor/AturanTab';

const store = () => useDemoStore.getState();
beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
  render(<AturanTab />);
});

describe('Aturan: daftar', () => {
  it('menampilkan kolom papan dan aturan bawaan', () => {
    for (const h of ['Nama aturan', 'Sumber', 'Abaikan bila', 'Tangkap bila', 'Aktif']) expect(screen.getByRole('columnheader', { name: h })).toBeInTheDocument();
    expect(screen.getByText('Aturan bawaan · tidak bisa dihapus')).toBeInTheDocument();
    expect(screen.getAllByText('Semua grup').length).toBeGreaterThan(0);
  });
  it('aturan bawaan hanya dimatikan, tidak ada tombol hapus', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Ubah Semua pesan' }));
    const panel = screen.getByRole('dialog');
    expect(within(panel).queryByRole('button', { name: 'Hapus aturan' })).toBeNull();
    expect(within(panel).getByLabelText(/^Nama aturan/)).toBeDisabled();
    expect(within(panel).getByRole('switch', { name: 'Prioritas' })).toBeDisabled();
    fireEvent.click(within(panel).getByRole('button', { name: 'Batal' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Aktif: Semua pesan' }));
    expect(store().waRules.find((r) => r.id === 'R-ALL')?.enabled).toBe(false);
  });
});

describe('Aturan: editor dan Coba', () => {
  const open = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Tambah aturan' }));
    return screen.getByRole('dialog');
  };
  it('aturan baru: nama wajib, simpan menambah aturan', () => {
    const p = open();
    fireEvent.click(within(p).getByRole('button', { name: 'Simpan aturan' }));
    expect(within(p).getByRole('alert')).toHaveTextContent('Isi nama aturan');
    fireEvent.change(within(p).getByLabelText(/^Nama aturan/), { target: { value: 'Banjir' } });
    fireEvent.click(within(p).getByRole('button', { name: 'Simpan aturan' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(store().waRules.some((r) => r.name === 'Banjir' && r.followUp?.count === 3 && r.followUp.minutes === 5)).toBe(true);
  });
  it('Coba: cocok dan tidak cocok beserta alasan', () => {
    const p = open();
    const kw = within(p).getAllByRole('textbox').find((e) => e.getAttribute('placeholder') === 'Ketik lalu Enter')!;
    // kolom pertama = Abaikan, kedua = Tangkap; gunakan yang kedua (Tangkap bila)
    const caps = within(p).getAllByPlaceholderText('Ketik lalu Enter');
    expect(kw).toBeTruthy();
    fireEvent.change(caps[1], { target: { value: 'banjir' } });
    fireEvent.keyDown(caps[1], { key: 'Enter' });
    const area = within(p).getByLabelText('Coba');
    fireEvent.change(area, { target: { value: 'Banjir di Pos 2' } });
    expect(within(p).getByRole('status')).toHaveTextContent('Cocok');
    fireEvent.change(area, { target: { value: 'Aman terkendali' } });
    expect(within(p).getByRole('status')).toHaveTextContent('Tidak cocok');
  });
  it('bagian Abaikan bila dan Tangkap bila bisa diciutkan', () => {
    const p = open();
    const secs = p.querySelectorAll('details.wa-sec');
    expect(secs).toHaveLength(2);
    const d = secs[0] as HTMLDetailsElement;
    expect(d.open).toBe(true);
    fireEvent.click(d.querySelector('summary')!);
    d.open = false;
    expect(d.open).toBe(false);
  });
  it('preset mengisi syarat Tangkap bila', () => {
    const p = open();
    fireEvent.click(within(p).getByRole('button', { name: 'Preset: LAPSIT rutin' }));
    expect((within(p).getByLabelText(/^Nama aturan/) as HTMLInputElement).value).toBe('LAPSIT rutin');
    expect(within(p).getByLabelText('Coba')).toBeInTheDocument();
    fireEvent.change(within(p).getByLabelText('Coba'), { target: { value: 'LAPSIT Pos 3 aman' } });
    expect(within(p).getByRole('status')).toHaveTextContent('Cocok');
  });
});
