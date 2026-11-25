# PERISAI · Prototype Insiden (demo)

Prototype UI klik-able modul Insiden PERISAI untuk demo stakeholder. Hanya UI: tanpa backend, data dari mock in-memory
yang disimpan di `localStorage` (tombol **Reset data** di pojok kiri bawah, atau hapus kunci `perisai-insiden-demo/v1`).

## Menjalankan

```bash
npm install
npm run dev
```

Skrip lain: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

- Ganti peran lewat kontrol **Peran demo** (hanya untuk demo).
- `/dev/boards` menampilkan semua board dari `canvas.json` beserta rute React padanannya.
- `ANTHROPIC_API_KEY` (opsional) baru dipakai di fase AI `claude`; tanpa key, AI memakai mock deterministik.

## Sumber kebenaran

`design-ref/project/*` adalah salinan artifact "PERISAI · Security Incident Management · Desain v2".
CSS di `src/styles/` (`bundle.css`, `lk.css`, `ins.css`) disalin **tanpa diubah**; `tokens.css` hanya kehilangan baris
`@import` Google Fonts (font di-self-host lewat `@fontsource`). Komponen merender class yang sama dengan board
(`p-*`, `lk-*`, `in-*`).

## Penyimpangan dari skill FE standar

Skill `perisai-fe-prototype` memetakan token ke Tailwind dan memakai IBM Plex Sans + Storybook. Di sini tidak:
tujuan demo adalah paritas visual 1:1 dengan artifact desain (DS v2 Lime, Plus Jakarta Sans), sehingga CSS DS dipakai
apa adanya. Stack masih perlu dikonfirmasi Tech Lead bila prototype dilanjutkan jadi produk.

## Catatan lingkungan

Di mesin dengan kebijakan Windows Application Control, binary native Rollup diblokir. `package.json` memakai
`overrides: { rollup: "npm:@rollup/wasm-node" }`. Hapus override itu di mesin yang tidak memblokirnya.

## AI Copilot: mock dan `claude`

- **Bawaan (tanpa key):** mock deterministik (`src/services/ai/mock.ts`). Cerita demo kabel ADR-07 menghasilkan isian yang sama dengan desain.
- **Claude (opsional):** isi `ANTHROPIC_API_KEY` (salin `.env.example` ke `.env.local`, atau variabel lingkungan di Vercel). Browser memanggil `/api/copilot`
  (`api/copilot.ts` di Vercel, middleware di `vite.config.ts` saat dev); key hanya dibaca di server. Inti panggilan ada di `server/copilotCore.ts`
  (SDK `@anthropic-ai/sdk`, model `claude-opus-5-5`, `effort: low`, keluaran terstruktur divalidasi Zod, timeout 8 detik).
- **Gagal atau timeout:** UI menampilkan state "AI Copilot sedang tidak tersedia" (board S19) dengan tombol **Coba lagi** dan **Pakai mode contoh** (beralih ke mock).
- Copilot hanya menyarankan: yang masuk ke form hanya saran yang di-**Pakai**. Keparahan tidak diisi AI.
- **Suara:** Web Speech API `id-ID`. Tidak didukung atau izin ditolak → S20; teks nyaris kosong → S21 "Suara kurang jelas"; batas 3 menit → S22.

## Dashboard insiden (Analitik)

`/analitik` memakai Dashboard insiden dari `design/dashboard/Dashboard.dc.html` (PRD dan prompt iterasi di `docs/dashboard/`, riwayat di `CHANGELOG.md`).
Kode markup, logika, dan data dihasilkan oleh `node scripts/dc-to-tsx.mjs`; data provinsi oleh `node scripts/build-provinsi.mjs`.

**Catatan produksi (belum dibangun di prototype):**
- Bentuk WK dan area (fasilitas, jalur pipa, anjungan) di produk diambil dari modul Wilayah kerja ("Pilih wilayah" + "Buat area sendiri"), bukan SVG statis di `public/peta/`.
- Bentuk wilayah SKK diambil dari pemetaan provinsi → wilayah yang dikonfirmasi SKK. Di prototype, Sumatera Barat dan Kepulauan Riau dianggap masuk Sumbagut (asumsi).
