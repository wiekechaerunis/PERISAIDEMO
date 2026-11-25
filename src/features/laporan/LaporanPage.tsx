import { Pdf1 } from '@/features/laporan/Pdf1';
import { Pdf2 } from '@/features/laporan/Pdf2';
import { Pdf3 } from '@/features/laporan/Pdf3';
import { Pdf4 } from '@/features/laporan/Pdf4';
import { Pdf5 } from '@/features/laporan/Pdf5';

// S19
/** Laporan PDF 5 halaman A4 (794 x 1123), siap cetak (PRD §12). */
export function LaporanPage() {
  return (
    <div className="laporan-root laporan-sheet">
      <div className="laporan-bar no-print">
        <b>Laporan PDF · 5 halaman A4</b>
        <button type="button" className="p-btn p-btn-primary p-btn-sm" onClick={() => window.print()}>Cetak / simpan PDF</button>
      </div>
      {[Pdf1, Pdf2, Pdf3, Pdf4, Pdf5].map((P, i) => (
        <div className="laporan-page" key={i}>
          <P />
        </div>
      ))}
    </div>
  );
}
