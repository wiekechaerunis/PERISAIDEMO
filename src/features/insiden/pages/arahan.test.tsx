// Board P31-DetailSKK ("Diminta arahan dari Anda") dan P33-ArahanMasuk ("Arahan baru dari SKK").
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { giveDirective } from '@/services/mock/workflow.skk';
import { escalate } from '@/services/mock/workflow.handling';
import { SkkIncidentPage } from './SkkIncidentPage';
import { PejabatHandlingPage } from './PejabatHandlingPage';

const NO = 'INS-SEN-2026-0005';
const renderAt = (el: React.ReactElement) =>
  render(
    <MemoryRouter initialEntries={[`/insiden/${NO}`]}>
      <Routes><Route path="/insiden/:no" element={el} /></Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
});

describe('Arahan SKK', () => {
  const toSkk = () => {
    const pic = useDemoStore.getState().incidents.find((x) => x.no === NO)!.pic!;
    const r = useDemoStore.getState().decide((s) => escalate(s, NO, pic, { to: 'skk', name: 'Hendra Wijaya', reason: 'Butuh dukungan koordinasi dengan Polres.' }));
    expect(r.ok).toBe(true);
  };

  it('P31: SKK melihat kartu "Diminta arahan dari Anda" berisi alasan PIC, Tenggat, Penanganan, lalu Info laporan', () => {
    toSkk();
    useDemoStore.getState().setRole('pengawas');
    renderAt(<SkkIncidentPage />);
    const card = screen.getByRole('region', { name: 'Diminta arahan dari Anda' });
    expect(within(card).getByText('Tenggat')).toBeInTheDocument();
    expect(within(card).getByText('Tetap di KKKS')).toBeInTheDocument();
    expect(within(card).getByText(/\(PIC\) · .* WIB/)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Beri arahan/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Info laporan' })).toBeInTheDocument();
    expect(screen.getByText(/keparahan resmi Kritis/)).toBeInTheDocument();
  });

  it('P33: Pejabat melihat kartu "Arahan baru dari SKK" dan Jadikan tindak lanjut menandai arahan', () => {
    useDemoStore.getState().decide((s) => giveDirective(s, NO, 'Hendra Wijaya', 'Koordinasikan patroli gabungan dengan Polres.'));
    useDemoStore.getState().setRole('pejabat');
    renderAt(<PejabatHandlingPage />);
    expect(screen.getAllByText('Dieskalasi').length).toBeGreaterThan(0);
    const card = screen.getByRole('region', { name: 'Arahan baru dari SKK' });
    expect(within(card).getByText('“Koordinasikan patroli gabungan dengan Polres.”')).toBeInTheDocument();
    expect(within(card).getByText(/Hendra Wijaya, Pengawas SKK · .* WIB/)).toBeInTheDocument();
    expect(within(card).getByText('Atas eskalasi')).toBeInTheDocument();
    expect(within(card).getByText('Tenggat')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: /Jadikan tindak lanjut/ }));
    const i = useDemoStore.getState().incidents.find((x) => x.no === NO)!;
    expect(i.handling?.directives.at(-1)?.followUp).toBe(true);
    expect(screen.queryByRole('region', { name: 'Arahan baru dari SKK' })).toBeNull();
  });
});
