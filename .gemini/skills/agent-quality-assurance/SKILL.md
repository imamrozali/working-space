---
name: agent-quality-assurance
description: Menguji kebenaran fungsional kode, memverifikasi kepatuhan arsitektur, menjalankan automated tests, dan mengaudit kode terhadap aturan anti-slop.
---

# Agent Quality Assurance Skill

Keahlian ini bertindak sebagai gerbang pengujian kualitas (quality gatekeeper) mandiri sebelum kode diserahkan atau dimasukkan ke dalam branch produksi.

## 1. Lima Gerbang Kualitas (The 5 Quality Gates)

Setiap implementasi kode wajib melewati 5 gerbang pengujian:

1. **Compilation Gate**:
   - `npm run build` berhasil 100% tanpa error TypeScript.
   - `cargo check` dan `cargo test` di Rust berhasil tanpa peringatan kritis.
2. **Behavioral Test Gate**:
   - Unit test fungsional lulus 100%.
   - Skenario edge case (input null, batas nilai ekstrim, pemutusan koneksi) tertangani secara elegan.
3. **Security Gate**:
   - Tidak ada celah path traversal, query injection, atau memory leak.
   - Parameter dan kredensial terisolasi dalam konfigurasi terpusat.
4. **Anti-Slop Compliance Gate**:
   - Tidak ada komentar hiasan atau divider banners.
   - Tidak ada tipe `any` yang tidak perlu.
   - **Kepatuhan Rule R-02**: Nol karakter em dash di seluruh kode, komentar, dokumen, atau UI.
5. **Design System Alignment**:
   - Mengikuti token warna, kontras teks, dan spacing pada root DESIGN.md.

