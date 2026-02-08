# Instruksi Penggunaan Template Word

Aplikasi ini membutuhkan file template Microsoft Word dengan nama `template.docx` yang diletakkan di dalam folder `public/`.

## Cara Menyiapkan Template

1. Buka file dokumen LKH Word Anda.
2. Pastikan tabel Agenda Harian Anda memiliki tanda-tanda (placeholders) berikut:

   | Kolom | Isi dengan Tanda Ini |
   | :--- | :--- |
   | **No** | `{#harian}` `{{no}}` |
   | **Hari/Tanggal** | `{{hari_tgl}}` |
   | **Tatap Muka** | `{{tatap_muka}}` |
   | **Non Tatap Muka** | `{{non_tatap}}` |
   | **Dokumentasi** | `{{dok}}` |
   | **Volume** | `{{vol}}` |
   | **Ket** | `{{ket}}` `{/harian}` |

3. Pastikan Header Laporan juga memiliki tanda ini:
   - Kelas/Semester : `{{kelas}}`
   - Tahun Ajaran   : `{{tapel}}`
   - Bulan          : `{{bulan}}`

4. Simpan file sebagai `template.docx`.
5. Upload file tersebut ke folder `public/` di proyek Cloudflare Pages Anda.

## Catatan Penting
- Tanda `{#harian}` harus berada di awal baris data (misal di kolom No).
- Tanda `{/harian}` harus berada di akhir baris data (misal di kolom Ket atau setelahnya).
- Kolom **Tatap Muka** di aplikasi akan otomatis menggabungkan CP, TP, dan KLS menjadi beberapa baris. Di Word, Anda cukup menaruh `{{tatap_muka}}` saja.
