import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { WA_ROUTES } from '../logic/draft';

/** Halaman langkah dibuka tanpa draf aktif (mis. draf sudah dihapus atau diajukan). */
export function NoDraft() {
  return (
    <AppShell nav="insiden" title="Draf dari WhatsApp" subtitle="Belum ada draf yang dipilih.">
      <section className="p-card in-sec">
        <h2 className="in-h">Draf tidak ditemukan</h2>
        <p style={{ margin: 0 }}>
          Draf ini sudah dihapus atau diajukan. Pilih pesan di <Link to={WA_ROUTES.inbox} className="lk-alink">Pemantauan WhatsApp</Link> untuk membuat draf baru.
        </p>
      </section>
    </AppShell>
  );
}
