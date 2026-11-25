# PRD Prototype · Dashboard Insiden PERISAI

| | |
|---|---|
| Versi | 0.1 · 25 Nov 2026 |
| Pemilik | Mino (PM / Product Designer) |
| Status | Prototype klik-able untuk review SKK/KKKS dan tim dev. **Bukan** spesifikasi produksi. |
| Desain acuan | [Canvas Desain v2 Insiden](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy), halaman **Dashboard insiden (usulan 25 Nov)** · [coba interaktif](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#play-Dashboard) |
| Design System | PERISAI DS v2 · Lime (masih usulan, keputusan K1–K6 belum di Decision Log) |

---

## 0. Isi paket

```
docs/
  PRD-Prototype-Dashboard-Insiden.md   ← dokumen ini
  PROMPT-Claude-Code.md                ← prompt untuk Claude Code
design/
  Dashboard.dc.html                    ← SUMBER KEBENARAN layar + logika (markup, CSS, state, rumus)
  Sidebar.dc.html                      ← komponen sidebar yang di-import Dashboard
  Dashboard-PDF1..5.dc.html            ← 5 halaman laporan PDF (A4, statis)
  css/tokens.css                       ← token DS v2 Lime (CSS variables)
  css/bundle.css                       ← komponen DS v2 (p-card, p-kpi, p-btn, p-chip, p-switch, p-pop, p-appbar, p-sb, …)
  css/lk.css                           ← pola layar (lk-app, lk-grid, c12/c7/…)
  css/ins.css                          ← pola modul Insiden
public/peta/
  id-prov.svg                          ← peta Indonesia, batas provinsi (1000×400)
  z-<wilayah>.svg                      ← detail kabupaten untuk zoom wilayah (sbu, sbs, pst, jbn, own)
  l-<area>.svg                         ← detail kecamatan untuk zoom titik (12 area)
data/
  incidents.json                       ← 106 insiden demo (sumber daftar & status)
  contoh-unduhan.xlsx                  ← contoh file Excel unduhan
```

## 1. Masalah dan tujuan

**Masalah.** SKK saat ini membaca keamanan hulu migas dari rekap Excel bulanan yang hanya berisi jumlah kasus dan kerugian per KKKS. Tidak ada lokasi, level keparahan, status penanganan, atau kelengkapan laporan. Angka antar-sheet bisa tidak cocok (rekap 523 vs 528 kasus).

**Untuk siapa.** Pengawas/pimpinan SKK (melihat semua KKKS) dan Pejabat KKKS (hanya organisasinya).

**Tujuan prototype.** Memperlihatkan dashboard yang **jelas, mudah dibaca, interaktif, dan cepat untuk keputusan**, supaya bisa diuji ke SKK/KKKS sebelum dibangun di produk.

Ukuran yang dipakai desain (dipertahankan di prototype):
- Layar pertama (1366 px, tanpa scroll) menjawab: berapa insiden dan kerugian, apa yang perlu ditindak, pola apa yang terjadi.
- Maksimal 4 angka utama.
- Setiap elemen yang mewakili sekumpulan insiden bisa diklik.
- Dari dashboard ke detail insiden maksimal 2 klik.

## 2. Lingkup

**Masuk:**
- Halaman Dashboard insiden, peran SKK dan KKKS (role switcher khusus prototype).
- Semua interaksi di tabel §9.
- Menu Unduh: Laporan PDF (rute cetak 5 halaman) dan Data Excel (unduh file contoh).
- Data demo statis dari `Dashboard.dc.html` dan `data/incidents.json`.

**Tidak masuk:**
- Backend, autentikasi, API, penyimpanan.
- Halaman Daftar insiden dan Detail insiden. Tautannya cukup ke rute placeholder `/insiden` dan `/insiden/:id` yang berisi judul + tombol kembali.
- Tanya AI / kolom tanya data yang benar-benar menjawab. Cukup tampilan statis.
- Menu periode berfungsi. Tombol "Semester I 2026" tampil statis.
- Filter Wilayah/KKKS/Kategori sebagai dropdown berfungsi. Tombolnya statis; nilainya mengikuti state (lihat §9).
- Tema gelap, mobile, unit test, Storybook.

## 3. Sumber kebenaran dan aturan 1:1

| Aspek | Yang menang |
|---|---|
| Tata letak, ukuran, warna, teks, urutan, state, rumus angka | `design/Dashboard.dc.html` (markup + `<helmet><style>` + `renderVals()`) |
| Kelas komponen DS | `design/css/*.css` dipakai **apa adanya** |
| Maksud, lingkup, perilaku yang tidak tertulis di desain | Dokumen ini |

Aturan:
1. **Jangan mendesain ulang.** Semua kelas CSS (`db-*`, `p-*`, `lk-*`) dan inline style dari `.dc.html` dipindahkan apa adanya ke JSX. CSS di `<helmet><style>` Dashboard dipindah ke `src/styles/dashboard.css` tanpa diubah.
2. **Jangan menulis ulang rumus.** Logika `renderVals()` dipindah ke modul TypeScript (mis. `useDashboard.ts`) dengan perilaku identik. Konstanta data (`W`, `A0`, `DTT`, `CAT`, `INC`, `LV`, `MO`, dsb.) dipindah ke `src/data/` tanpa perubahan nilai.
3. **Teks persis.** Semua copy UI diambil dari `.dc.html`, termasuk tanda baca dan huruf besar/kecil.
4. Kalau ada yang tidak bisa diterjemahkan 1:1, tulis di `DEVIATIONS.md` (apa, kenapa, dampak).

### Cara membaca `.dc.html` → React

| Di `.dc.html` | Di React |
|---|---|
| `<x-dc> … </x-dc>` | JSX komponen |
| `{{nama}}` | nilai dari hasil `renderVals()` |
| `<sc-for list="{{xs}}" as="x">…</sc-for>` | `xs.map((x, i) => …)` dengan `key` |
| `<sc-if value="{{cond}}">…</sc-if>` | `{cond && …}` |
| `onClick="{{fn}}"` | `onClick={fn}` |
| `style="left: {{h.x}}; …"` | `style={{ left: h.x, … }}` |
| `class="…"` | `className="…"` |
| `this.state`, `this.setState` | `useState` / `useReducer` |
| `this.props.peran`, `zoom`, `dtt`, `menuUnduh`, `statusTerbuka` | query string / state awal (lihat §5) |
| `<dc-import name="Sidebar" …>` | `<Sidebar active="analitik" user role taskCount />` dari `Sidebar.dc.html` |
| `hint-placeholder-*` | abaikan |
| `<script src="./support.js">` | abaikan |

## 4. Stack prototype

Sengaja sederhana:
- Vite + React + TypeScript.
- React Router: `/`, `/laporan`, `/insiden`, `/insiden/:id`.
- CSS biasa: import `tokens.css`, `bundle.css`, `lk.css`, `ins.css`, lalu `dashboard.css`. **Tanpa Tailwind/shadcn**, supaya tampilan sama persis.
- Font: Plus Jakarta Sans + IBM Plex Mono dari Google Fonts (sudah di-import `tokens.css`).
- Tanpa library chart dan tanpa library peta. Semua grafik di desain adalah div/CSS, dan peta adalah SVG + div yang di-transform.
- Quality gate cukup: `npm run build` lolos dan tidak ada error di console.

## 5. Rute, peran, dan state awal

| Rute | Isi |
|---|---|
| `/` | Dashboard. Query opsional: `peran=skk\|kkks`, `zoom=nat\|sbs\|sbu\|pst\|jbn\|loc`, `dtt=1`, `unduh=1`, `status=0\|1\|2\|3` (sama dengan props `.dc.html`) |
| `/laporan` | 5 halaman PDF berurutan, siap cetak (§10) |
| `/insiden`, `/insiden/:id` | Placeholder |

**Role switcher (khusus prototype):** pill kecil di pojok kanan bawah layar: "SKK · KKKS". Mengganti `peran` dan me-reset state. Tidak ada di desain, jadi beri label "Prototype" dan catat di `DEVIATIONS.md`.

| | SKK (Pengawas SKK, "Hendra Wijaya") | KKKS (Pejabat Berwenang KKKS, "Sari Wulandari") |
|---|---|---|
| Cakupan data | Semua KKKS | Hanya PT Samudra Energi Nusantara |
| Peta awal | Indonesia (nat) | Wilayah kerja sendiri (`own`) |
| Bisa naik ke nasional/wilayah | Ya | Tidak (tombol rumah tidak tampil) |
| Banner "Hanya data organisasi Anda" | Tidak | Ya |
| Filter KKKS, sakelar Hitung DTT | Ya | Tidak |
| Tabel per wilayah di bawah peta | Ya (tingkat nasional) | Tidak |
| Kartu angka ke-4 | KKKS melapor (Jun 2026) | Median lama penanganan |
| Matriks | Kategori × wilayah | Kategori × wilayah kerja |

## 6. Struktur halaman (urutan dari atas)

Lebar acuan 1366 px. Sidebar 240 px, konten `padding 24px`, grid 12 kolom gap 16.

1. **App bar:** tombol perkecil sidebar · judul "Dashboard insiden" + subjudul · tombol Periode (statis) · tombol **Unduh** (menu) · pemisah · "Tanya AI" · lonceng.
2. Banner KKKS (khusus KKKS).
3. **Bar filter** (satu baris, tidak boleh wrap): Wilayah · KKKS · Kategori · Level (dropdown checkbox) · spacer · sakelar Hitung DTT. Di bawahnya chip **Filter aktif** + "Hapus semua" bila ada filter.
4. **4 kartu angka** (`c12`, grid 4).
5. **Temuan AI** (`c7`) dan **Perlu tindakan** (`c5`), tinggi sama.
6. **Peta insiden** (`c12`): header + breadcrumb · peta (rasio 1000:400) · strip di bawah peta yang isinya berganti menurut tingkat zoom.
7. **Jenis insiden terbanyak** (`c6`) dan **Insiden dan kerawanan** (`c6`), tinggi sama.
8. **Tren per bulan** (`c7`) dan **Status penanganan** (`c5`), tinggi sama.
9. **Kategori × wilayah** (`c12`).
10. Catatan kaki.

Kartu berpasangan selalu sama tinggi (`align-self: stretch` + elemen bawah `db-push` menempel ke dasar kartu).

## 6a. Peta ke desain (artifact)

Setiap bagian layar dipetakan ke artboard di canvas (untuk dilihat) dan ke file `design/Dashboard.dc.html` (untuk dibangun). Nomor baris mengacu ke file di paket ini.

**Artboard di canvas:**

| Artboard | Kondisi yang ditampilkan |
|---|---|
| [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | SKK, tingkat nasional, semua filter default (**acuan utama**) |
| [Dashboard-KKKS](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-KKKS) | KKKS, peta terbuka di wilayah kerja sendiri |
| [Dashboard-Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) | SKK, zoom wilayah Sumbagsel |
| [Dashboard-Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) | SKK, zoom titik Musi Banyuasin (WK Andalas Darat) |
| [Dashboard-DTT](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-DTT) | SKK, sakelar Hitung DTT menyala |
| [Dashboard-Unduh](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Unduh) | SKK, menu Unduh terbuka |
| [PDF1](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF1) · [PDF2](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF2) · [PDF3](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF3) · [PDF4](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF4) · [PDF5](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF5) | Laporan PDF halaman 1–5 (A4) |

**Bagian layar → desain → kode:**

| # | Bagian | Lihat di canvas | Markup (`Dashboard.dc.html`) | Logika (`renderVals`) | CSS kunci |
|---|---|---|---|---|---|
| S1 | App bar + tombol Unduh | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard), menu: [Dashboard-Unduh](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Unduh) | baris 222–237 | `dlOpen`, `dlScope` (bagian return) | `.db-dl` |
| S2 | Banner KKKS | [Dashboard-KKKS](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-KKKS) | baris 238 | `isKkks` | `.p-note` |
| S3 | Bar filter + popover Level | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 240–251 | `filters`, `lvChips`, `lvSum`, `lvDots`, `toggleDtt` | `.db-filters`, `.db-sel`, `.db-lvpop`, `.db-tg` |
| S4 | Chip filter aktif | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) (klik jenis apa pun) | baris 252 | `// ===== filter aktif =====` | `.db-af`, `.db-clr` |
| S5 | 4 kartu angka | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard), versi KKKS: [Dashboard-KKKS](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-KKKS) | baris 254–260 | `// ===== KPI =====` | `.p-kpi` (bundle.css) |
| S6 | Temuan AI | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 262–270 | `// ===== temuan AI =====` | `.db-ai`, `.db-ins` |
| S7 | Perlu tindakan | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 272–279 | `// ===== perlu perhatian =====` | `.db-attc`, `.db-ins` |
| S8 | Peta: header, stage, pill, kontrol, legenda | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) · [Dashboard-Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) · [Dashboard-Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) | baris 281–309 | `// ===== zoom =====`, `// ===== crumb =====` | `.db-map`, `.db-stage`, `.db-heat`, `.db-pill`, `.db-ctl`, `.db-leg` |
| S9 | Strip bawah peta: tabel per wilayah | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 311–323 | `// ===== strip =====` (`wRows`) | `.db-wt`, `.db-mc` |
| S10 | Strip: ringkasan wilayah + tabel area | [Dashboard-Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) | baris 324–342 | `// ===== strip =====` (`subRows`) | `.db-sum`, `.db-wt` |
| S11 | Strip: ringkasan titik + daftar insiden | [Dashboard-Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) | baris 343–361 | `// ===== strip =====` (`incs`) | `.db-inc` |
| S12 | Jenis insiden terbanyak | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard), dengan DTT: [Dashboard-DTT](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-DTT) | baris 363–370 | `// ===== jenis terbanyak =====` | `.db-tc` |
| S13 | Insiden dan kerawanan | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 371–381 | `// ===== insiden vs kerawanan =====` | `.db-ik`, `.db-gb` |
| S14 | Tren per bulan + penanda AI | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard), DTT (segmen abu): [Dashboard-DTT](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-DTT) | baris 383–389 | `// ===== tren =====` | `.db-bars`, `.db-col`, `.db-trn` |
| S15 | Status penanganan + daftar | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) (klik baris status) | baris 390–401 | `const INC` (baris 570) dan `const st` (baris 702) | `.db-stw`, `.db-str`, `.db-sti`, `.db-kv` |
| S16 | Kategori × wilayah | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard), versi KKKS: [Dashboard-KKKS](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-KKKS) | baris 403–410 | `// ===== matriks =====` | `.db-mx` |
| S17 | Catatan kaki | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | baris 411 | `foot` | `.db-foot` |
| S18 | Sidebar | [Dashboard](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) | `design/Sidebar.dc.html` | `renderVals` di file itu | `.p-sb` (bundle.css) |
| S19 | Laporan PDF | [PDF1](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF1) s.d. [PDF5](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-PDF5) | `design/Dashboard-PDF1..5.dc.html` | statis | `<helmet><style>` di tiap file |

## 7. Data

Semua konstanta ada di `renderVals()`/konstruktor `Dashboard.dc.html`. Pindahkan ke `src/data/` tanpa mengubah nilai.

| Konstanta | Isi |
|---|---|
| `W` | 6 wilayah SKK: nama, kotak zoom `bb` (koordinat peta 1000×400), posisi pill, jumlah KKKS, KKKS melapor (Jun), penanda `none` (nihil) / `nr` (belum lapor) |
| `A0` | 12 area insiden: `[id, wilayah, kabupaten, x, y, [level SR,R,S,T,K], kerugian jt, KKKS, WK]` |
| `DTT` | Tambahan kasus DTT per area (`bjn` 300, `grs` 122) bila sakelar menyala |
| `CAT` | 7 jenis insiden: jumlah per wilayah (SKK) dan per area milik KKKS |
| `INC` | 106 insiden: `[id, area, idx kategori, level, status 0/1/2, lewat tenggat 0/1, tgl lapor, judul, lama hari, bulan]` (sama dengan `data/incidents.json`) |
| `LV` | 5 level + token warnanya |
| `MO` | Jan–Jun |

Angka kerawanan per bulan, Semester II 2025, dan porsi demo lain tertulis langsung di `renderVals()` dan diberi komentar sebagai angka demo.

Semua angka **wajib konsisten** satu sama lain. Pakai `alloc()` (largest remainder) seperti di desain, jangan `Math.round` per bagian.

## 8. Logika turunan (ringkas)

Ikuti kode di `renderVals()`. Ringkasan:

- **Filter berlapis:** level (`s.lv[5]`), kategori (`s.kat`), DTT (`s.dtt`, SKK saja), dan **zoom = filter wilayah** untuk seluruh halaman.
- **Scope (`SC`):** semua area (nasional) → area dalam wilayah yang di-zoom → satu area (zoom titik). Angka utama, Temuan AI, jenis terbanyak, insiden & kerawanan, tren, dan status mengikuti scope. Tabel per wilayah dan Perlu tindakan selalu nasional.
- **Level tertinggi area:** level tertinggi dengan jumlah > 0 setelah filter.
- **Heat:** warna = level tertinggi, pekat (alpha 30–90%) dan ukuran = √(n / n_max).
- **Temuan AI:** 3–4 temuan, berbeda untuk nasional / wilayah / titik / KKKS. Tidak boleh mengulang angka di kartu angka utama.
- **Status penanganan:** dihitung dari `INC` dalam scope + filter. Urutan daftar: lewat tenggat dulu, lalu level tertinggi.
- **Penanda tren:** di tingkat nasional/KKKS memakai teks kurasi; di zoom lain memakai kenaikan bulan-ke-bulan terbesar.

## 9. Peta

**Proyeksi** (sama dengan aset SVG): `x = (lon − 94.6) × 1000/46.8`, `y = (6.4 − lat) × 1000/46.8`. Kanvas peta 1000 × 400 unit.

**Lapisan di dalam `.db-stage`** (urutan bawah → atas):
1. `peta/id-prov.svg` memenuhi stage.
2. Detail zoom (`peta/z-<z>.svg` atau `peta/l-<area>.svg`) diletakkan di kotak terlihat: `left = (cx − 500/k)/10 %`, `top = (cy − 200/k)/4 %`, `width = height = 100/k %`.
3. Heat (`.db-heat`, tombol bulat dengan radial-gradient).
4. Label area (font-size `12/k px`).
5. Titik insiden (zoom titik saja), diameter `0.9/k %` dari lebar stage.

**Transform stage:** `scale(k) translate(tx%, ty%)` dengan `k = min(1000/bw, 400/bh)`, `tx = (500/k − cx)/10`, `ty = (200/k − cy)/4`. Transisi `transform .45s cubic-bezier(.2,.7,.2,1)`.

**Di luar stage** (tidak ikut di-scale): pill wilayah (nasional SKK saja), tombol perkecil & rumah (kanan atas), petunjuk (atas tengah), legenda (kiri bawah).

| Tingkat | Kotak (bb) | Detail SVG |
|---|---|---|
| Nasional | 0,0,1000,400 | – |
| Sumbagut `sbu` | 30,15,185,140 | z-sbu |
| Sumbagsel `sbs` | 160,145,250,235 | z-sbs |
| Pusat `pst` | 245,250,320,295 | z-pst |
| Jabanusa `jbn` | 330,262,470,330 | z-jbn |
| WK KKKS `own` | 172,172,242,214 | z-own |
| Titik (area) | x±16, y±9 | l-<area> |

Kalsul dan Pamalu tidak bisa di-zoom (tidak ada insiden): pill-nya redup / arsir.

## 10. Peta interaksi (UI behavior)

| # | Elemen | Aksi | Hasil | State | Bagian · desain |
|---|---|---|---|---|---|
| I1 | Tombol **Unduh** | Klik | Buka/tutup menu (lebar 340, kanan bawah tombol). Baris atas menyebut cakupan filter | `dl` | S1 · [Unduh](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Unduh) |
| I2 | Menu → **Laporan PDF** | Klik | Tutup menu, buka `/laporan` di tab baru | – | S1 · [Unduh](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Unduh) |
| I3 | Menu → **Data Excel** | Klik | Tutup menu, unduh `contoh-unduhan.xlsx` | – | S1 · [Unduh](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Unduh) |
| I4 | Dropdown **Level** | Klik | Popover checkbox 5 level + jumlah, tombol "Semua level" dan "Selesai" | `lvOpen` | S3 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I5 | Checkbox level / legenda peta | Klik | Toggle level (minimal 1 tetap aktif); seluruh halaman dihitung ulang | `lv` | S3/S8 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I6 | Sakelar **Hitung DTT** (SKK) | Klik | Tambah 422 kasus DTT; kartu, peta Jabanusa, jenis, tren (segmen abu), matriks ikut | `dtt`, reset `kat` | S3 · [DTT](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-DTT) |
| I7 | Chip filter aktif | Klik × | Hapus filter itu. "Hapus semua" me-reset level, kategori, zoom | `kat`, `lv`, `z`, `loc` | S4 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I8 | Baris **Temuan AI** | Klik | Zoom/saring sesuai temuan (mis. "Kerugian Sumbagsel melonjak" → zoom `sbs`; jenis → filter kategori). Temuan tanpa tujuan tidak melakukan apa-apa | `z`, `loc`, `kat` | S6 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I9 | Baris **Perlu tindakan** | Klik | Zoom ke lokasi, atau buka daftar "Lewat tenggat" di kartu Status | `z`, `loc`, `stOpen` | S7 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I10 | Heat di peta nasional | Klik | Zoom ke wilayahnya | `z` | S8 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I11 | Pill wilayah | Klik | Zoom ke wilayah (Kalsul/Pamalu tidak aktif) | `z` | S8 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I12 | Heat di zoom wilayah | Klik | Zoom ke titik area itu | `loc` | S8 · [Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) |
| I13 | Tombol perkecil (−) | Klik | Naik satu tingkat (titik → wilayah → nasional). KKKS berhenti di `own` | `loc`, `z` | S8 · [Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) |
| I14 | Tombol rumah (SKK) | Klik | Kembali ke nasional | `z`, `loc` | S8 · [Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) |
| I15 | Breadcrumb | Klik | Kembali ke tingkat itu | `z`, `loc` | S8 · [Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) |
| I16 | Nama wilayah di tabel per wilayah | Klik | Zoom ke wilayah | `z` | S9 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I17 | Tombol "Zoom" di tabel area | Klik | Zoom ke titik | `loc` | S10 · [Wilayah](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Wilayah) |
| I18 | "Lihat N insiden" / "Buka" di strip | Klik | Ke `/insiden` / `/insiden/:id` | – | S10/S11 · [Titik](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard-Titik) |
| I19 | Baris **Jenis insiden terbanyak** | Klik | Toggle filter kategori seluruh halaman | `kat` | S12 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I20 | Toggle **Jumlah/Kerugian** di Tren | Klik | Ganti ukuran grafik dan teks penanda | `m` | S14 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I21 | Baris status (**Dalam penanganan / Menunggu penutupan / Ditutup**) | Klik | Buka/tutup daftar ≤5 insiden di dalam kartu + tautan "Lihat semua N di Daftar insiden". Chevron berputar 90° | `stOpen` 0–2 | S15 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I22 | Angka **Lewat tenggat** | Klik | Buka daftar insiden lewat tenggat di kartu Status | `stOpen` 3 | S15 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I23 | Item insiden dalam daftar status | Klik | Ke `/insiden/:id` | – | S15 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I24 | Sel matriks kategori × wilayah (bernilai) | Klik | Filter kategori + zoom wilayah (KKKS: zoom titik WK). Sel terpilih diberi ring | `kat`, `z`/`loc` | S16 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I25 | Tautan kartu angka ("Lihat daftar →", dll.) | Klik | Ke `/insiden` | – | S5 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |
| I26 | Hover heat / titik | Hover | Tooltip native (`title`) berisi nama, jumlah, level, kerugian | – | S8 · [Utama](https://claude.ai/artifact/AxCr55XPx96uGm3mLYpuwy#artboard-Dashboard) |

Klik di luar popover Level/Unduh menutup popover (tambahan prototype, wajar). `Esc` juga menutup.

## 11. State per kondisi (wajib bisa dicapai)

| Kondisi | Cara mencapai | Yang terlihat |
|---|---|---|
| SKK nasional | `/` | Pill 6 wilayah, tabel per wilayah, 12 area panas |
| SKK zoom wilayah | Klik Sumbagsel | Batas kabupaten, 4 area berlabel, strip ringkasan wilayah + tabel area |
| SKK zoom titik | Klik Musi Banyuasin | Batas kecamatan, 15 titik berwarna level, daftar 4 insiden |
| DTT menyala | Sakelar | Insiden 528, area panas Jabanusa membesar dan pekat, baris DTT di jenis dan matriks |
| Filter kategori | Klik "Pencurian/Perampokan" | Chip filter aktif, semua angka menyusut |
| Level disaring | Matikan Sangat rendah & Rendah | Peta hanya Sedang ke atas |
| Status terbuka | Klik "Dalam penanganan" | Daftar 5 insiden, lewat tenggat paling atas |
| Menu unduh | Klik Unduh | Dua pilihan PDF dan Excel |
| KKKS | Role switcher | Banner, peta WK sendiri, tanpa tabel wilayah |

## 12. Unduh

**Laporan PDF (`/laporan`):**
- Render `Dashboard-PDF1..5.dc.html` berurutan. Masing-masing berupa satu halaman `794 × 1123 px` (A4 @96dpi).
- CSS cetak: `@page { size: A4; margin: 0 }`, setiap halaman `page-break-after: always`, latar abu di layar dan putih saat cetak.
- Tombol "Cetak / simpan PDF" (hanya di layar) memanggil `window.print()`.
- Isi statis sesuai file desain (angka demo SKK nasional). Penyesuaian dengan filter aktif belum diperlukan di prototype; catat di `DEVIATIONS.md`.

**Data Excel:** unduh `data/contoh-unduhan.xlsx` apa adanya (salin ke `public/`). Pembuatan Excel dari filter aktif di luar lingkup prototype.

## 13. Kriteria terima (cek manual)

**Visual:**
- [ ] Di 1366 px, tata letak, jarak, ukuran huruf, warna, dan teks sama dengan canvas (bandingkan berdampingan dengan screenshot dari canvas di `design/screenshots/` bila disediakan).
- [ ] Kartu berpasangan sama tinggi; bar filter satu baris; legenda tren dan nama bulan tidak bertumpuk.

**Angka (SKK nasional, semua filter default):**
- [ ] Kartu: **106** insiden (▲ 15% vs 92) · **Rp1,41 M** (▲ 28%) · **16** Tinggi & Kritis (5 masih terbuka) · **14** dari 131 KKKS.
- [ ] Status: 14 / 8 / 84 · lewat tenggat **4** · median **7 hari**.
- [ ] Jenis: Pencurian/Perampokan 80 · Penghentian kegiatan/operasi 7 · Unjuk rasa 6 · Illegal tapping 4 · Perusakan material 4 · Illegal drilling 3.
- [ ] Zoom Sumbagsel: 38 insiden · Rp891 jt.
- [ ] DTT menyala: 528 insiden.
- [ ] KKKS: 24 insiden · Rp730 jt · median 7 hari.

**Interaksi:**
- [ ] Semua baris tabel §10 berjalan.
- [ ] Zoom memakai animasi 0,45 detik. Batas wilayah tetap tajam di setiap tingkat.

**Teknis:**
- [ ] `npm run build` lolos, console bersih.

## 14. Asumsi dan celah (bawa ke review)

- [ASUMSI] Level di peta = level keparahan; warna = level tertinggi, pekat = jumlah. Belum dikonfirmasi Mino/SKK.
- [ASUMSI] DTT dihitung sebagai insiden hanya bila sakelar menyala (keputusan terbuka).
- [ASUMSI] "Melapor" = mengirim laporan insiden atau nihil. PERISAI belum punya laporan nihil; perlu keputusan.
- Batas WK resmi belum ada (Q-272). Prototype memakai batas kabupaten/kecamatan Kemendagri 2025 (cahyadsn/wilayah_boundaries, MIT).
- Pemetaan KKKS/WK ke wilayah SKK belum ada (Q-271). Prototype memakai data demo.
- Cakupan kontrak fitur AI masih menunggu konfirmasi (DL-104, DL-107). Teks AI di prototype adalah teks tetap.
- Warna gradasi kartu Temuan AI (biru muda `#8DB8EE`) belum ada di token DS v2.
- Skill FE PERISAI lama memakai DS v1 (IBM Plex Sans). Prototype ini memakai **DS v2 Lime** (Plus Jakarta Sans) sesuai desain.
- Logo PERISAI di sidebar perlu disediakan sebagai `public/logo-perisai.png`; kalau belum ada, pakai wordmark teks.
- Semua nama KKKS/WK dan angka adalah fiktif/demo.
