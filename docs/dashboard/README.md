# Prototype · Dashboard insiden PERISAI

Prototype klik 1:1 dengan desain `design/Dashboard.dc.html`. Tanpa backend. Data demo fiktif (Semester I 2026).

## Menjalankan

```
npm i && npm run dev
```

Build produksi: `npm run build` (menjalankan `tsc --noEmit` lalu `vite build`).

## Rute

| Rute | Isi |
|---|---|
| `/` | Dashboard insiden. Query: `peran=skk\|kkks`, `zoom=nat\|sbs\|sbu\|pst\|jbn\|loc`, `dtt=1`, `unduh=1`, `status=0\|1\|2\|3` |
| `/laporan` | Laporan PDF 5 halaman A4 (794×1123), tombol cetak |
| `/insiden`, `/insiden/:id` | Placeholder (di luar lingkup) |

Pill "Prototype" di kanan bawah mengganti peran SKK / KKKS.

## Struktur

- `src/features/dashboard/useDashboard.ts` logika dan rumus (state, filter, zoom, `alloc()` largest remainder).
- `src/data/dashboard.ts` konstanta data demo (SEN, LV, W, A0, DTT, CAT, MO, INC).
- `src/features/dashboard/components/` satu komponen per bagian, tiap file diberi komentar `// S<n>` sesuai PRD §6a.
- `src/features/laporan/Pdf1..5.tsx` halaman laporan; `src/components/Sidebar.tsx` (S18).
- `src/styles/ds/` CSS design system apa adanya; `src/styles/dashboard.css`, `laporan.css` dari desain.

## Catatan penting: kode dihasilkan

Markup, gaya, dan logika dibawa dari `design/*.dc.html` oleh `scripts/dc-to-tsx.mjs` (`npm run convert`), agar teks dan rumus identik dengan desain. File di `src/generated/`, `src/features/*/components/`, `src/features/laporan/`, `src/components/Sidebar.tsx`, `src/data/dashboard.ts` dan dua CSS turunan ditimpa saat convert. Ubah desain atau skrip, lalu jalankan ulang. Lihat `DEVIATIONS.md`.
