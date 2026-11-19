import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { useDraftStore } from '@/features/insiden/logic/draft';
import { extractStory } from '@/services/ai/mock';
import { createWaDraft, draftIdOf, activeLink } from '@/services/mock/workflow.wa';
import type { ReportDraft } from '@/features/insiden/logic/draft';
import { WaInboxPage } from './pages/WaInboxPage';
import { WaStep1Page } from './pages/WaStep1Page';
import { WaStep4Page } from './pages/WaStep4Page';
import { WaMessagePage } from './pages/WaMessagePage';
import { buildSuggestion } from './logic/extract';
import { WaStep2Page } from './pages/WaStep2Page';
import { WaStep3Page } from './pages/WaStep3Page';
import { MobileWaStep1 } from '@/mobile/whatsapp/MobileWaStep1';
import { MobileWaStep2 } from '@/mobile/whatsapp/MobileWaStep2';

// ai.extract mock menunda 1,4 detik; tes memakai ekstraksi yang sama tanpa jeda.
vi.mock('@/services/ai', async () => {
  const m = await import('@/services/ai/mock');
  return { ai: { extract: async (s: string) => m.extractStory(s), isOutOfScope: () => false } };
});

const store = () => useDemoStore.getState();
const msg = (id: string) => store().waMessages.find((m) => m.id === id)!;

/** Draf dari pesan seed, dilengkapi isian wajib seperti setelah Pelapor mengisi langkah 1–2. */
function makeDraft(messageId: string, patch: Partial<ReportDraft> = {}) {
  const s = buildSuggestion(msg(messageId), extractStory(msg(messageId).text));
  const form: ReportDraft = {
    ...s.form, locationName: 'Sumur ADR-07', lat: -2.98512, lng: 104.04213, wk: 'WK Andalas Darat', patokan: 'Pompa sumur ADR-07',
    title: s.form.title || 'Kabel pompa ADR-07 dipotong', category: s.form.category ?? 'Pencurian/Perampokan',
    securityImpact: s.form.securityImpact || 'Kabel listrik pompa ADR-07 dipotong.', axes: ['prop'], ops: 'berhenti', opsHours: 3,
    handledBy: ['bujp'], ...patch,
  };
  const r = store().decide((st) => createWaDraft(st, { messageId, by: 'Budi Santoso', form, ai: s.ai, aiState: 'ok' }));
  expect(r.ok).toBe(true);
  return draftIdOf(messageId);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/insiden/wa" element={<WaInboxPage />} />
        <Route path="/insiden/wa/temuan" element={<WaStep1Page />} />
        <Route path="/insiden/wa/kejadian" element={<WaStep2Page />} />
        <Route path="/insiden/wa/lampiran" element={<WaStep3Page />} />
        <Route path="/insiden/wa/m-temuan" element={<MobileWaStep1 />} />
        <Route path="/insiden/wa/m-kejadian" element={<MobileWaStep2 />} />
        <Route path="/insiden/wa/ringkasan" element={<WaStep4Page />} />
        <Route path="/insiden/wa/pesan/:id" element={<WaMessagePage />} />
        <Route path="/insiden/:no" element={<div>detail insiden</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDemoStore.getState().resetDemo();
  useDraftStore.getState().resetDraft();
});

describe('Insiden dari WhatsApp (INS-05)', () => {
  it('(a) memilih pesan membuat draf dengan saran AI bertanda "Perlu dicek"', async () => {
    renderAt('/insiden/wa');
    fireEvent.click(screen.getByRole('button', { name: 'Jadikan draf laporan: Joko, 03:05' }));
    expect(await screen.findByDisplayValue('Kabel pompa ADR-07 dipotong')).toBeInTheDocument();

    expect(store().waDrafts).toHaveLength(1);
    const d = store().waDrafts[0];
    expect(d.messageId).toBe('WAM-003');
    expect(msg('WAM-003').status).toBe('draf');
    expect(d.ai.kind).toMatchObject({ confidence: 'md', needsCheck: true });
    expect(d.ai.title).toMatchObject({ confidence: 'hi', needsCheck: false });
    // chip AI di label + tanda Perlu dicek di isian keyakinan sedang
    expect(screen.getAllByText('AI').length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText('Perlu dicek').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('1 isian perlu dicek:')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sudah sesuai/ }));
    expect(screen.getByText('Semua saran sudah dicek.')).toBeInTheDocument();
    expect(store().waDrafts[0].ai.kind.checked).toBe(true);
  });

  it('(b) Ajukan menambah insiden source wa berstatus review-internal', () => {
    // 10:15 jauh dari insiden lain (> 6 jam), jadi tidak ada kemungkinan ganda
    const id = makeDraft('WAM-002', { date: '2026-10-28', time: '10:15' });
    const before = store().incidents.length;
    renderAt(`/insiden/wa/ringkasan?d=${id}`);
    expect(screen.queryByRole('region', { name: 'Kemungkinan laporan ganda' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));

    expect(store().incidents).toHaveLength(before + 1);
    expect(store().incidents[0]).toMatchObject({ source: 'wa', status: 'review-internal', reporter: 'Budi Santoso', possibleDuplicate: false });
    expect(store().waDrafts).toHaveLength(0);
    expect(activeLink(msg('WAM-002'))).toMatchObject({ incidentNo: store().incidents[0].no, kind: 'laporan' });
    expect(screen.getByText('detail insiden')).toBeInTheDocument();
  });

  it('(c) kemungkinan ganda menonaktifkan Ajukan sampai ada pilihan', () => {
    const id = makeDraft('WAM-003');
    renderAt(`/insiden/wa/ringkasan?d=${id}`);
    const banner = screen.getByRole('region', { name: 'Kemungkinan laporan ganda' });
    expect(within(banner).getByText(/2 insiden berkategori sama/)).toBeInTheDocument();
    const ajukan = screen.getByRole('button', { name: 'Ajukan' });
    expect(ajukan).toBeDisabled();
    fireEvent.click(ajukan);
    expect(store().waDrafts).toHaveLength(1);
    // "Tautkan pesan" juga menunggu pilihan insiden
    expect(within(banner).getByRole('button', { name: 'Tautkan pesan' })).toBeDisabled();

    fireEvent.click(within(banner).getByRole('button', { name: 'Tetap ajukan sebagai insiden baru' }));
    expect(screen.getByText(/kemungkinan sama dengan 2 insiden/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajukan' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Ajukan' }));
    expect(store().incidents[0]).toMatchObject({ source: 'wa', possibleDuplicate: true });
  });

  it('(c2) memilih insiden mirip lalu Tautkan pesan: draf dihapus, pesan masuk Riwayat insiden itu', () => {
    const id = makeDraft('WAM-003');
    renderAt(`/insiden/wa/ringkasan?d=${id}`);
    const banner = screen.getByRole('region', { name: 'Kemungkinan laporan ganda' });
    fireEvent.click(within(banner).getAllByRole('radio')[0]);
    fireEvent.click(within(banner).getByRole('button', { name: /^Tautkan pesan ke INS-SEN-2026-/ }));
    expect(store().waDrafts).toHaveLength(0);
    expect(msg('WAM-003').status).toBe('diproses');
    const link = activeLink(msg('WAM-003'))!;
    expect(link.kind).toBe('tautan');
    expect(store().incidents.find((i) => i.no === link.incidentNo)!.timeline!.at(-1)!.text).toMatch(/^Pesan ditautkan: Joko/);
  });

  it('(d) Tautkan menautkan pesan ke insiden dan Lepas tautan membatalkannya', () => {
    renderAt('/insiden/wa/pesan/WAM-002');
    fireEvent.click(screen.getByRole('button', { name: 'Tautkan ke insiden' }));
    const dlg = screen.getByRole('dialog', { name: 'Tautkan ke insiden' });
    expect(within(dlg).getByRole('button', { name: 'Tautkan' })).toBeDisabled();
    // insiden Ditutup tidak muncul
    expect(within(dlg).queryByText('INS-SEN-2026-0004')).not.toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('option', { name: /INS-SEN-2026-0007/ }));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Tautkan' }));

    expect(msg('WAM-002').status).toBe('diproses');
    expect(activeLink(msg('WAM-002'))).toMatchObject({ incidentNo: 'INS-SEN-2026-0007', kind: 'tautan', by: 'Budi Santoso' });
    expect(screen.getByText('Pesan ditautkan ke INS-SEN-2026-0007.')).toBeInTheDocument();

    // Lepas tautan hanya untuk Pejabat
    expect(screen.queryByRole('button', { name: 'Lepas tautan' })).not.toBeInTheDocument();
    act(() => store().setRole('pejabat'));
    fireEvent.click(screen.getByRole('button', { name: 'Lepas tautan' }));
    const lt = screen.getByRole('dialog', { name: 'Lepas tautan pesan?' });
    const confirm = within(lt).getByRole('button', { name: 'Lepas tautan' });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(lt).getByLabelText(/Alasan/), { target: { value: 'Salah' } });
    expect(confirm).toBeDisabled();
    expect(within(lt).getByText('Tulis alasan minimal 10 karakter.')).toBeInTheDocument();
    fireEvent.change(within(lt).getByLabelText(/Alasan/), { target: { value: 'Pesan ini tentang pompa ADR-09, bukan ADR-07.' } });
    fireEvent.click(confirm);

    expect(msg('WAM-002').status).toBe('baru');
    expect(activeLink(msg('WAM-002'))).toBeUndefined();
    expect(msg('WAM-002').links[0].releasedBy).toBe('Sari Wulandari');
    expect(screen.getByText('Tautan pesan dilepas. Pesan kembali ke kotak masuk.')).toBeInTheDocument();
    const inc = store().incidents.find((i) => i.no === 'INS-SEN-2026-0007')!;
    expect(inc.timeline!.at(-1)!.text).toMatch(/^Tautan pesan WhatsApp dilepas/);
  });

  it('(e) Hapus draf menghapus draf WA dan pesan sumbernya tetap ada', () => {
    const id = makeDraft('WAM-003');
    renderAt(`/insiden/wa/ringkasan?d=${id}`);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus draf ini' }));
    const dlg = screen.getByRole('dialog', { name: 'Hapus draf ini?' });
    expect(within(dlg).getByText(/Pesan WhatsApp sumbernya tetap ada/)).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Hapus draf' }));

    expect(store().waDrafts).toHaveLength(0);
    expect(msg('WAM-003')).toMatchObject({ status: 'baru', draftId: undefined });
    expect(screen.getByRole('heading', { name: 'Pemantauan WhatsApp' })).toBeInTheDocument();
  });

  it('(f) langkah 2 dan 3: Perlu dicek, foto dari pesan terlampir, dan keparahan dari sistem', () => {
    const id = makeDraft('WAM-003');
    const r = renderAt(`/insiden/wa/kejadian?d=${id}`);
    expect(screen.getByText('3 isian perlu dicek:')).toBeInTheDocument();
    expect(screen.getByText('Kategori, Dampak keamanan, Sudah menangani')).toBeInTheDocument();
    expect(screen.getByText('Tinggi')).toBeInTheDocument();
    r.unmount();
    renderAt(`/insiden/wa/lampiran?d=${id}`);
    expect(screen.getByText('IMG-20261028-WA0021.jpg')).toBeInTheDocument();
    expect(screen.getByText('Dari WhatsApp')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pakai' }));
    expect(store().waDrafts[0].form.attachments[0].caption).toBe('Ujung kabel terpotong di dekat pompa');
    fireEvent.click(screen.getByRole('button', { name: 'Lepas dari laporan' }));
    expect(store().waDrafts[0].form.attachments).toHaveLength(0);
  });

  it('(g) mobile M9/M10 dan saran AI gagal (MS04)', () => {
    const id = makeDraft('WAM-003');
    const a = renderAt(`/insiden/wa/m-temuan?d=${id}`);
    expect(screen.getByText('Draf dari WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sudah sesuai/ })).toBeInTheDocument();
    a.unmount();
    const b = renderAt(`/insiden/wa/m-kejadian?d=${id}&state=ai-gagal`);
    expect(screen.getByText('Saran otomatis tidak tersedia.')).toBeInTheDocument();
    b.unmount();
    renderAt(`/insiden/wa/m-kejadian?d=${id}&state=memuat`);
    expect(screen.getByText('Membaca pesan…')).toBeInTheDocument();
  });
});
