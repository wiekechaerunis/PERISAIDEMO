import { TindakLanjutListPage } from '@/features/tindak-lanjut/pages/TindakLanjutListPage';
import { TindakLanjutDetailPage } from '@/features/tindak-lanjut/pages/TindakLanjutDetailPage';
import { TindakLanjutBaruPage } from '@/features/tindak-lanjut/pages/TindakLanjutBaruPage';
import { AnalitikPage } from '@/features/analitik/pages/AnalitikPage';
import { LaporanPage } from '@/features/laporan/LaporanPage';
import { createBrowserRouter, RouterProvider, Navigate, useLocation, useParams } from 'react-router-dom';
import { useDemoStore } from '@/services/mock/store';
import { IncidentDetailPage } from '@/features/insiden/pages/IncidentDetailPage';
import { IncidentReviewPage } from '@/features/insiden/pages/IncidentReviewPage';
import { PicHandlingPage } from '@/features/insiden/pages/PicHandlingPage';
import { PejabatHandlingPage } from '@/features/insiden/pages/PejabatHandlingPage';
import { SkkIncidentPage } from '@/features/insiden/pages/SkkIncidentPage';
import { isSkk } from '@/lib/rbac';
import { isPicOf } from '@/features/insiden/logic/handling';
import { KerawananDetailPage } from '@/features/insiden/pages/KerawananDetailPage';
import { KerawananRingkasanPage } from '@/features/insiden/pages/KerawananRingkasanPage';
import { Responsive } from '@/mobile/Responsive';
import { TasksPage } from '@/features/insiden/pages/TasksPage';
import { AppShell } from '@/components/layout/AppShell';
import { IncidentListPage } from '@/features/insiden/pages/IncidentListPage';
import { BoardIndex } from '@/dev/BoardIndex';
import { EmailCatalogPage, EmailPreviewPage } from '@/dev/email/EmailPages';
import { ReportStep1Page } from '@/features/insiden/pages/ReportStep1Page';
import { ReportStep3Page } from '@/features/insiden/pages/ReportStep3Page';
import { ReportStep4Page } from '@/features/insiden/pages/ReportStep4Page';
import { ReportKerawananDetailPage } from '@/features/insiden/pages/ReportKerawananDetailPage';
import { ReportStep2Page } from '@/features/insiden/pages/ReportStep2Page';
import { DraftEditRoute } from '@/features/insiden/pages/DraftEditRoute';
import { KonfigurasiDaftarPage } from '@/features/konfigurasi/pages/KonfigurasiDaftarPage';
import { MatriksKeparahanPage } from '@/features/konfigurasi/pages/MatriksKeparahanPage';
import { TenggatPage } from '@/features/konfigurasi/pages/TenggatPage';
import { WaSimPanel } from '@/features/whatsapp/sim/WaSimPanel';
import { WaInboxPage } from '@/features/whatsapp/pages/WaInboxPage';
import { WaStep1Page } from '@/features/whatsapp/pages/WaStep1Page';
import { WaStep2Page } from '@/features/whatsapp/pages/WaStep2Page';
import { WaStep3Page } from '@/features/whatsapp/pages/WaStep3Page';
import { WaStep4Page } from '@/features/whatsapp/pages/WaStep4Page';
import { WaMessagePage } from '@/features/whatsapp/pages/WaMessagePage';
import { WaLinksPage } from '@/features/whatsapp/pages/WaLinksPage';
import { WaDetailPage } from '@/features/whatsapp/pages/WaDetailPage';

/** Halaman yang belum dibangun: tetap di dalam shell, menunjuk ke board padanannya. */
function Pending() {
  const { pathname } = useLocation();
  return (
    <AppShell nav="insiden" title="Belum dibangun" subtitle="Layar ini dijadwalkan di fase berikutnya.">
      <section className="p-card">
        <p>
          Rute <span className="data-id">{pathname}</span> belum punya padanan React. Lihat daftar board di{' '}
          <a href="/dev/boards">/dev/boards</a>.
        </p>
      </section>
    </AppShell>
  );
}

/** Pejabat membuka insiden Menunggu pemeriksaan di layar review; peran lain di layar detail. */
function IncidentRoute() {
  const { no } = useParams();
  const role = useDemoStore((s) => s.role);
  const inc = useDemoStore((s) => s.incidents.find((i) => i.no === no));
  const location = useLocation();
  const status = inc?.status;
  const running = status === 'dalam-penanganan' || status === 'minta-ditutup' || status === 'ditutup';
  if (role === 'pejabat' && status === 'review-internal') return <Navigate to={`/insiden/${no}/review`} replace state={location.state} />;
  if (inc && isPicOf(inc, role) && running) return <PicHandlingPage />;
  if (role === 'pejabat' && running) return <PejabatHandlingPage />;
  if (isSkk(role) && running) return <SkkIncidentPage />;
  return <IncidentDetailPage />;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/insiden" replace /> },
  { path: '/insiden', element: <Responsive routeKey="/insiden" desktop={<IncidentListPage />} /> },
  { path: '/insiden/baru', element: <Navigate to="/insiden/baru/temuan" replace /> },
  { path: '/insiden/baru/temuan', element: <Responsive routeKey="/insiden/baru/temuan" desktop={<ReportStep1Page />} /> },
  { path: '/insiden/baru/kejadian', element: <Responsive routeKey="/insiden/baru/kejadian" desktop={<ReportStep2Page />} /> },
  { path: '/insiden/baru/lampiran', element: <Responsive routeKey="/insiden/baru/lampiran" desktop={<ReportStep3Page />} /> },
  { path: '/insiden/baru/ringkasan', element: <Responsive routeKey="/insiden/baru/ringkasan" desktop={<ReportStep4Page />} /> },
  { path: '/insiden/baru/detail', element: <Responsive routeKey="/insiden/baru/detail" desktop={<ReportKerawananDetailPage />} /> },
  { path: '/insiden/wa', element: <WaInboxPage /> },
  { path: '/insiden/wa/temuan', element: <Responsive routeKey="/insiden/wa/temuan" desktop={<WaStep1Page />} /> },
  { path: '/insiden/wa/kejadian', element: <Responsive routeKey="/insiden/wa/kejadian" desktop={<WaStep2Page />} /> },
  { path: '/insiden/wa/lampiran', element: <WaStep3Page /> },
  { path: '/insiden/wa/ringkasan', element: <WaStep4Page /> },
  { path: '/pemantauan-whatsapp', element: <WaInboxPage /> },
  { path: '/pemantauan-whatsapp/pesan/:id', element: <WaMessagePage /> },
  { path: '/insiden/wa/pesan/:id', element: <WaMessagePage /> },
  { path: '/insiden/wa/tautan/:no', element: <WaLinksPage /> },
  { path: '/insiden/wa/:no', element: <Responsive routeKey="/insiden/wa/:no" desktop={<WaDetailPage />} /> },
  { path: '/insiden/:no', element: <Responsive routeKey="/insiden/:no" desktop={<IncidentRoute />} /> },
  { path: '/insiden/:no/review', element: <Responsive routeKey="/insiden/:no/review" desktop={<IncidentReviewPage />} /> },
  { path: '/insiden/:no/tangani', element: <PicHandlingPage mode="tangani" /> },
  { path: '/insiden/:no/ubah', element: <DraftEditRoute /> },
  { path: '/kerawanan/ringkasan', element: <KerawananRingkasanPage /> },
  { path: '/kerawanan/:no', element: <KerawananDetailPage /> },
  { path: '/analitik', element: <AnalitikPage /> },
  { path: '/laporan', element: <LaporanPage /> },
  { path: '/tugas', element: <TasksPage /> },
  { path: '/tindak-lanjut', element: <TindakLanjutListPage /> },
  { path: '/tindak-lanjut/baru', element: <TindakLanjutBaruPage /> },
  { path: '/tindak-lanjut/:no', element: <TindakLanjutDetailPage /> },
  { path: '/konfigurasi', element: <KonfigurasiDaftarPage /> },
  { path: '/konfigurasi/matriks-keparahan', element: <MatriksKeparahanPage /> },
  { path: '/konfigurasi/tenggat', element: <TenggatPage /> },
  { path: '/dev/boards', element: <BoardIndex /> },
  { path: '/dev/email', element: <EmailCatalogPage /> },
  { path: '/dev/email/:id', element: <EmailPreviewPage /> },
  { path: '*', element: <Pending /> },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <WaSimPanel />
    </>
  );
}
