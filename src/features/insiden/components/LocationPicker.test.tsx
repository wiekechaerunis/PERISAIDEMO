import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocationPicker, type PickedLocation } from './LocationPicker';

afterEach(() => vi.restoreAllMocks());

const setup = (askWk = true) => {
  const onPick = vi.fn<(p: PickedLocation) => void>();
  render(
    <MemoryRouter>
      <LocationPicker askWk={askWk} onPick={onPick} onClose={() => {}} />
    </MemoryRouter>,
  );
  return onPick;
};
const search = (text: string) => fireEvent.change(screen.getByLabelText('Cari lokasi atau koordinat'), { target: { value: text } });
const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'Pilih lokasi ini' }));
const coordText = () => document.querySelector('.p-map .coord')!.textContent!;

describe('LocationPicker (komponen peta DS)', () => {
  it('bawaan di sumur ADR-07, dalam WK Andalas Darat, dengan pil koordinat', () => {
    const onPick = setup();
    expect(screen.getByText('Sumur ADR-07', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText(/Dalam WK Andalas Darat/)).toBeInTheDocument();
    expect(coordText()).toBe('-2.98512, 104.04213');
    confirm();
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sumur ADR-07', wk: 'WK Andalas Darat', outside: false }));
  });

  it('mencari nama tempat dan memilih hasilnya memindahkan pin', () => {
    const onPick = setup();
    search('batu ampar');
    fireEvent.click(screen.getByRole('option', { name: /Jalan akses SP Batu Ampar/ }));
    confirm();
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jalan akses SP Batu Ampar', wk: 'WK Batu Ampar', area: 'Kab. Banyuasin' }));
  });

  it('Enter di kolom cari memilih hasil teratas', () => {
    const onPick = setup();
    search('terminal');
    fireEvent.keyDown(screen.getByLabelText('Cari lokasi atau koordinat'), { key: 'Enter' });
    confirm();
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Terminal Arunika' }));
  });

  it('mengetik koordinat menawarkan pindah ke titik itu', () => {
    const onPick = setup();
    search('-2.7421, 104.3012');
    fireEvent.click(screen.getByRole('option', { name: /Koordinat -2.74210, 104.30120/ }));
    confirm();
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jalan akses SP Batu Ampar', wk: 'WK Batu Ampar' }));
  });

  it('pencarian tanpa hasil menampilkan pesan, bukan daftar kosong', () => {
    setup();
    search('zzzz');
    expect(screen.getByText(/Tidak ada tempat yang cocok/)).toBeInTheDocument();
  });

  it('tempat di luar WK mewajibkan memilih WK (board S13)', () => {
    const onPick = setup();
    search('sungai lilin');
    fireEvent.click(screen.getByRole('option', { name: /Desa Sungai Lilin/ }));
    expect(screen.getAllByText('Di luar cakupan WK').length).toBeGreaterThan(0);
    const ok = screen.getByRole('button', { name: 'Pilih lokasi ini' });
    expect(ok).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'WK Batu Ampar' }));
    expect(ok).toBeEnabled();
    fireEvent.click(ok);
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ wk: 'WK Batu Ampar', outside: true }));
  });

  it('di mobile WK ditanyakan di form, bukan di pemilih', () => {
    const onPick = setup(false);
    search('sungai lilin');
    fireEvent.click(screen.getByRole('option', { name: /Desa Sungai Lilin/ }));
    confirm();
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ outside: true, wk: '' }));
  });

  it('tombol panah menggeser pusat peta dan koordinat berubah', () => {
    setup();
    const before = coordText();
    fireEvent.keyDown(screen.getByRole('application'), { key: 'ArrowRight' });
    expect(coordText()).not.toBe(before);
  });

  it('klik peta memindahkan pusat ke titik yang diklik', () => {
    setup();
    const map = screen.getByRole('application');
    vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 600, height: 380, right: 600, bottom: 380, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.click(map, { clientX: 300 + 60, clientY: 190 }); // 60 satuan di kanan pusat, skala 1
    expect(Number(coordText().split(',')[1])).toBeCloseTo(104.04213 + (60 / 600) * 0.5, 3);
  });

  it('zoom: tombol perbesar dan perkecil dibatasi pada level awal dan akhir', () => {
    setup();
    const out = screen.getByRole('button', { name: 'Perkecil' });
    const inn = screen.getByRole('button', { name: 'Perbesar' });
    expect(out).toBeDisabled();
    fireEvent.click(inn);
    fireEvent.click(inn);
    expect(inn).toBeDisabled();
    expect(out).toBeEnabled();
  });
});
