import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EmailCatalogPage, EmailPreviewPage } from './EmailPages';

const IDS = ['ei1', 'ei2', 'ei3', 'ei4', 'ei5', 'ei6', 'ei7', 'ei8', 'ei8b', 'ei10', 'ei11', 'ei12', 'ei13', 'ei14', 'ei15', 'ei16', 'ei17', 'ei18', 'ek1'];

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dev/email" element={<EmailCatalogPage />} />
        <Route path="/dev/email/:id" element={<EmailPreviewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('pratinjau email', () => {
  it('katalog memuat semua id kecuali EI9', () => {
    at('/dev/email');
    for (const id of IDS) expect(screen.getByTestId(`row-${id}`).getAttribute('href')).toBe(`/dev/email/${id}`);
    expect(screen.queryByTestId('row-ei9')).toBeNull();
  });

  it('/dev/email/ei4 menampilkan subjek dan nomor insiden', () => {
    at('/dev/email/ei4');
    expect(screen.getAllByText('Insiden INS-SEN-2026-0007 disetujui').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/INS-SEN-2026-0007/).length).toBeGreaterThan(1);
  });

  it('id tak dikenal menampilkan state tidak ditemukan', () => {
    at('/dev/email/ei99');
    expect(screen.getByText('Email tidak ditemukan')).toBeTruthy();
  });
});
