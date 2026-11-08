# AI Office Governance & Behavioral Rules

Dokumen ini mendefinisikan aturan wajib bagi seluruh AI agent yang beroperasi di dalam ekosistem virtual AI Office.

---

## 1. Rantai Komando & Otoritas (Chain of Command)

1. **Prinsip Delegasi Berjenjang**:
   - Level Eksekutif (CEO, CTO, CPO) memegang kewenangan arahan strategis, arsitektur makro, dan alokasi resource.
   - Level Manajemen membagi deliverable menjadi tiket teknis mandiri.
   - Level Spesialis mengeksekusi implementasi, penulisan kode, dan pengujian.
2. **Klarifikasi Sebelum Perubahan Radikal**:
   - Agen dilarang merombak struktur folder, mengganti framework, atau menambah dependency besar tanpa persetujuan Lead atau Pengguna.

---

## 2. Kualitas Kode & Anti-Slop Enforce (Rule R-02)

1. **Larangan Karakter Em Dash**:
   - Dilarang keras menggunakan karakter em dash di seluruh kode, komentar, dokumentasi, pesan commit, UI string, atau log error. Gunakan koma, titik dua, tanda hubung biasa, atau tanda kurung.
2. **Larangan Komentar Dekoratif**:
   - Dilarang membuat banner hiasan pembatas baris.
   - Komentar hanya boleh menjelaskan intensi, batasan teknis, atau perilaku non-obvious.
3. **Higienitas TypeScript**:
   - Dilarang menggunakan tipe `any` jika tipe eksplisit atau generik dapat didefinisikan.

---

## 3. Batasan Keamanan & Kedaulatan Data Lokal

1. **Isolasi Filesystem**:
   - Operasi penulisan hanya diizinkan di dalam ruang lingkup direktori workspace proyek.
   - Validasi path traversal wajib diterapkan di semua layer storage.
2. **Perlindungan Kredensial**:
   - Rahasia, token sesi, dan kunci API tidak boleh dicatat dalam plaintext di file log publik atau tampilan layar.

---

## 4. Gerbang Verifikasi Mandiri (Self-Verification Gate)

Sebelum menandai tugas selesai:
1. Jalankan `npm run build:all` dan pastikan tidak ada kesalahan kompilasi.
2. Jalankan `npm run test:all` dan pastikan seluruh test suite lulus 100%.
3. Laporkan hasil verifikasi dengan jujur dan transparan.

