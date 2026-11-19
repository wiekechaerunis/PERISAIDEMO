import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TidyBar } from './TidyBar';

function Host({ initial }: { initial: string }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <textarea aria-label="isian" value={v} onChange={(e) => setV(e.target.value)} />
      <TidyBar label="Ringkasan penanganan" value={v} counter={String(v.length)} onApply={setV} />
    </>
  );
}
const RAW = 'kabel 40m diganti, pompa nyala lg 29 okt jam 16.10. udh lapor polisi. gembok panel ganti yg anti potong';
const TIDY = 'Kabel 40 m diganti dan pompa menyala lagi pada 29 Okt pukul 16.10. Laporan polisi sudah dibuat. Gembok panel diganti dengan tipe anti potong.';

describe('Rapikan dengan AI', () => {
  it('nonaktif di bawah 20 karakter dengan tooltip', () => {
    render(<Host initial="pendek" />);
    expect(screen.getByRole('button', { name: /Rapikan dengan AI/ })).toBeDisabled();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tulis minimal 20 karakter untuk dirapikan.');
  });
  it('usulan inline → Pakai mengganti teks dan muncul Kembalikan → teks asli kembali', () => {
    render(<Host initial={RAW} />);
    fireEvent.click(screen.getByRole('button', { name: /Rapikan dengan AI/ }));
    expect(screen.getByText('Usulan tulisan rapi')).toBeInTheDocument();
    expect(screen.getByLabelText('isian')).toHaveValue(RAW);
    fireEvent.click(screen.getByRole('button', { name: 'Pakai' }));
    expect(screen.getByLabelText('isian')).toHaveValue(TIDY);
    expect(screen.getByText('Ringkasan penanganan dirapikan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kembalikan' }));
    expect(screen.getByLabelText('isian')).toHaveValue(RAW);
  });
  it('Batal menutup usulan dan teks asli tetap', () => {
    render(<Host initial={RAW} />);
    fireEvent.click(screen.getByRole('button', { name: /Rapikan dengan AI/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByText('Usulan tulisan rapi')).toBeNull();
    expect(screen.getByLabelText('isian')).toHaveValue(RAW);
  });
  it('fakta berubah: usulan tidak ditampilkan, banner caution muncul', () => {
    render(<Host initial="pagar sisi panel cuma 1,5 m" />);
    fireEvent.click(screen.getByRole('button', { name: /Rapikan dengan AI/ }));
    expect(screen.queryByText('Usulan tulisan rapi')).toBeNull();
    expect(screen.getByText('Usulan tidak ditampilkan karena ada angka atau nama yang berubah. Periksa tulisan Anda secara manual.')).toBeInTheDocument();
  });
});

describe('Rapikan dengan AI · contoh dari uji pengguna', () => {
  it('typo "dkernakain" dirapikan menjadi "karena" dan Pakai mengganti teks', () => {
    render(<Host initial="Memperbaiki kabel yang rusak dkernakain digigit tikus." />);
    fireEvent.click(screen.getByRole('button', { name: /Rapikan dengan AI/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Pakai' }));
    expect(screen.getByLabelText('isian')).toHaveValue('Memperbaiki kabel yang rusak karena digigit tikus.');
  });
  it('tulisan yang sudah rapi: tidak ada usulan, ada keterangan', () => {
    render(<Host initial="Kabel yang rusak sudah diperbaiki hari ini." />);
    fireEvent.click(screen.getByRole('button', { name: /Rapikan dengan AI/ }));
    expect(screen.queryByText('Usulan tulisan rapi')).toBeNull();
    expect(screen.getByText('Tulisan Anda sudah rapi. Tidak ada usulan.')).toBeInTheDocument();
  });
});
