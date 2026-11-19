import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { analitik } from '../logic/analitik';
import { AnalitikPage } from './AnalitikPage';

const base = { skk: true, measure: 'n' as const, sort: 'cnt' as const, dir: 'desc' as const };
const renderPage = () => render(<MemoryRouter><AnalitikPage /></MemoryRouter>);

describe('Analitik · logika angka per periode', () => {
  it('Bulan ini memakai 4 minggu (Mg 1–4), periode lain memakai bulan', () => {
    expect(analitik({ ...base, period: 'm1' }).trend.map((b) => b.m)).toEqual(['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4']);
    expect(analitik({ ...base, period: 'm1' }).trendTitle).toBe('Tren per minggu');
    expect(analitik({ ...base, period: 'ytd' }).trend).toHaveLength(10);
    expect(analitik({ ...base, period: 'l12' }).trend).toHaveLength(12);
    expect(analitik({ ...base, period: 'y25' }).trend).toHaveLength(12);
  });

  it('semua angka ikut berubah saat periode diganti', () => {
    const ytd = analitik({ ...base, period: 'ytd' });
    const m3 = analitik({ ...base, period: 'm3' });
    expect(m3.kpis[0].val).not.toBe(ytd.kpis[0].val);
    expect(m3.kpis[1].val).not.toBe(ytd.kpis[1].val);
    expect(m3.perLabel).toBe('Agt–Okt 2026');
    expect(ytd.kpis[0].val).toBe('156');
  });

  it('SKK per KKKS dengan KPI "KKKS mengirim laporan"; KKKS per wilayah kerja tanpa kolom bulan', () => {
    const skk = analitik({ ...base, period: 'ytd' });
    expect(skk.kpis[3].label).toBe('KKKS mengirim laporan');
    expect(skk.tblTitle).toBe('Per KKKS');
    expect(skk.rows[0].kepW).not.toBeNull();
    const kk = analitik({ ...base, skk: false, period: 'ytd' });
    expect(kk.tblTitle).toBe('Per wilayah kerja');
    expect(kk.rows.map((r) => r.n)).toEqual(['WK Andalas Darat', 'WK Batu Ampar']);
    expect(kk.rows[0].kepW).toBeNull();
  });

  it('tanpa "laporan nihil" dan tanpa jam 06:00 di teks', () => {
    const v = JSON.stringify(analitik({ ...base, period: 'ytd' }));
    expect(v).not.toMatch(/nihil|06:00/i);
  });
});

describe('Analitik · halaman', () => {
  beforeEach(() => useDemoStore.setState({ role: 'pengawas' }));

  it('urutan kartu: KPI, peta + Butuh perhatian, tren + per kategori, per keparahan, kerawanan, tabel', () => {
    renderPage();
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toEqual(expect.arrayContaining(['Peta sebaran', 'Butuh perhatian', 'Tren per bulan', 'Per kategori', 'Per keparahan', 'Kerawanan (indikator awal)', 'Per KKKS']));
    expect(heads.indexOf('Peta sebaran')).toBeLessThan(heads.indexOf('Butuh perhatian'));
    expect(heads.indexOf('Tren per bulan')).toBeLessThan(heads.indexOf('Per kategori'));
    expect(heads.indexOf('Per kategori')).toBeLessThan(heads.indexOf('Per keparahan'));
  });

  it('pemilih periode mengganti angka dan judul tren', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Periode' }));
    fireEvent.click(screen.getByRole('option', { name: /Bulan ini/ }));
    expect(screen.getByRole('heading', { name: 'Tren per minggu' })).toBeInTheDocument();
    expect(screen.getAllByText(/Okt 2026/).length).toBeGreaterThan(0);
  });

  it('rentang khusus: Dari, Sampai, Terapkan', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Periode' }));
    fireEvent.click(screen.getByRole('option', { name: /Rentang khusus/ }));
    const list = screen.getByRole('listbox', { name: 'Periode' });
    expect(within(list).getByRole('button', { name: 'Terapkan' })).toBeEnabled();
    fireEvent.click(within(list).getByRole('button', { name: 'Terapkan' }));
    expect(screen.getAllByText(/1 Jul–15 Okt 2026/).length).toBeGreaterThan(0);
  });

  it('ukuran grafik Kerugian mengganti label bar', () => {
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: 'Kerugian (Rp)' }));
    expect(screen.getAllByText(/Kerugian \(Rp\)/).length).toBeGreaterThan(0);
  });
});
