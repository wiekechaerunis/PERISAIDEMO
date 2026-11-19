import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateField } from './DateField';
import { TimeField } from './TimeField';

function Harness({ initial = '', min }: { initial?: string; min?: string }) {
  const [v, setV] = useState(initial);
  return <DateField label="Tanggal" value={v} onChange={setV} min={min} />;
}

describe('DateField (komponen DS)', () => {
  it('menampilkan teks "28 Okt 2026", bukan mm/dd/yyyy', () => {
    render(<Harness initial="2026-10-28" />);
    expect(screen.getByRole('button', { name: 'Tanggal: 28 Okt 2026' })).toHaveTextContent('28 Okt 2026');
  });

  it('tanpa nilai menampilkan placeholder', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Tanggal: belum dipilih' })).toHaveTextContent('Pilih tanggal');
  });

  it('memilih hari di kalender mengubah nilai dan menutup popover', () => {
    render(<Harness initial="2026-10-28" />);
    fireEvent.click(screen.getByRole('button', { name: /^Tanggal/ }));
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('gridcell', { name: '15 Okt 2026' }));
    expect(screen.getByRole('button', { name: 'Tanggal: 15 Okt 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigasi bulan dan tanggal sebelum batas minimum tidak bisa dipilih', () => {
    render(<Harness initial="2026-10-28" min="2026-10-20" />);
    fireEvent.click(screen.getByRole('button', { name: /^Tanggal/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Bulan berikutnya' }));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }));
    fireEvent.click(screen.getByRole('gridcell', { name: '10 Okt 2026' }));
    expect(screen.getByRole('button', { name: 'Tanggal: 28 Okt 2026' })).toBeInTheDocument(); // tidak berubah
  });

  it('Esc menutup popover', () => {
    render(<Harness initial="2026-10-28" />);
    fireEvent.click(screen.getByRole('button', { name: /^Tanggal/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('TimeField (komponen DS)', () => {
  it('mengetik angka otomatis diberi titik dua dan hanya jam valid yang dikirim', () => {
    const onChange = vi.fn();
    render(<TimeField label="Jam" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Jam');
    fireEvent.change(input, { target: { value: '0100' } });
    expect(input).toHaveValue('01:00');
    expect(onChange).toHaveBeenLastCalledWith('01:00');
    fireEvent.change(input, { target: { value: '2575' } });
    expect(onChange).not.toHaveBeenCalledWith('25:75');
  });

  it('jam tak lengkap dikembalikan ke nilai valid terakhir saat blur', () => {
    render(<TimeField label="Jam" value="01:00" onChange={() => {}} />);
    const input = screen.getByLabelText('Jam');
    fireEvent.change(input, { target: { value: '13' } });
    fireEvent.change(input, { target: { value: '134' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('01:00');
  });
});
