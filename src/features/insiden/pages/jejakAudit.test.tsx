// B-21 (P34): "Jejak audit lengkap" membuka halaman Jejak audit tersaring nomor insiden.
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { JejakAuditPage } from './JejakAuditPage';

const NO = 'INS-SEN-2026-0010';
beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDemoStore.getState().setRole('pejabat');
});

describe('Jejak audit (B-21)', () => {
  it('crumb, pil Objek, kolom, dan panel Detail jejak audit', () => {
    render(
      <MemoryRouter initialEntries={[`/insiden/${NO}/jejak-audit`]}>
        <Routes><Route path="/insiden/:no/jejak-audit" element={<JejakAuditPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Jejak audit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Hapus filter Objek: ${NO}` })).toBeInTheDocument();
    const table = screen.getByRole('table');
    ['Waktu', 'Pelaku', 'Sebagai', 'Modul', 'Aksi', 'Objek', 'Hasil'].forEach((h) => expect(within(table).getByRole('columnheader', { name: h })).toBeInTheDocument());
    expect(screen.getAllByText('Menyetujui insiden').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Menyetujui insiden' })[0]);
    expect(screen.getByRole('dialog', { name: 'Detail jejak audit' })).toBeInTheDocument();
  });
});
