// Teks ketentuan pemakaian WhatsApp (papan V2-24): dipakai di layar persetujuan dan dialog "Lihat teks persetujuan".
export function RiskText() {
  return (
    <div className="wa-risk">
      <b>PERISAI tersambung ke WhatsApp sebagai perangkat tertaut tidak resmi.</b>
      <ul>
        <li>Ketentuan layanan WhatsApp tidak mengizinkan aplikasi tidak resmi. WhatsApp dapat memblokir nomor yang Anda tautkan, kapan saja dan tanpa pemberitahuan.</li>
        <li>Pakai nomor khusus organisasi, bukan nomor pribadi. Nomor yang diblokir tidak bisa dipakai lagi di WhatsApp mana pun.</li>
        <li>PERISAI hanya membaca. PERISAI tidak mengirim pesan, tidak membaca status, dan tidak mengubah grup.</li>
        <li>Anggota grup yang dipantau harus diberi tahu bahwa pesannya dapat direkam.</li>
        <li>Pesan disimpan bila cocok dengan aturan yang aktif. Aturan bawaan &quot;Semua pesan&quot; menyimpan hampir semua pesan di grup yang dipantau, kecuali yang cocok dengan syarat &quot;Abaikan bila&quot;. Pesan lain hanya dihitung.</li>
      </ul>
    </div>
  );
}
