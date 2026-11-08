---
name: agent-autonomous-workflow
description: Menjalankan rangkaian alur kerja otonom, integrasi CI/CD lokal, penjadwalan cron background, dan penanganan loop otomatis tanpa intervensi manual.
---

# Agent Autonomous Workflow Skill

Keahlian ini memandu eksekusi alur kerja mandiri dari inisiasi hingga penyelesaian akhir, mencakup self-healing saat terjadi error kompilasi dan pelaporan berkala.

## 1. Siklus Kerja Otonom (Autonomous Loop)

1. **Trigger Phase**: Menerima pemicu (event webhook, cron timer, atau input user).
2. **Analysis & Plan**: Membaca konteks file, mendefinisikan perubahan terkecil yang aman.
3. **Execution Phase**: Menulis atau memodifikasi kode.
4. **Verification Phase (Self-Audit)**:
   - Menjalankan build (`npm run build`, `cargo check`).
   - Menjalankan unit tests (`npm test`, `cargo test`).
5. **Self-Healing Loop**: Jika verifikasi gagal:
   - Analisis error compiler / test failure.
   - Perbaiki penyebab error (maksimal 3 kali percobaan ulang mandiri).
   - Jika tetap gagal setelah 3 kali, hentikan eksekusi dan minta bantuan user.
6. **Delivery Phase**: Buat ringkasan pencapaian dan notifikasi hasil.

## 2. Batasan Keamanan Kerja Mandiri

- Dilarang menjalankan perintah yang merusak data (`rm -rf /`, `git reset --hard` tanpa backup).
- Dilarang memodifikasi file di luar direktori workspace yang diizinkan.
- Wajib mematuhi aturan Anti-Slop (khususnya R-02: nol karakter em dash).

