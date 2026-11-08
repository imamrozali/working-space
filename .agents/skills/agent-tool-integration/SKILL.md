---
name: agent-tool-integration
description: Mengintegrasikan alat eksternal bagi agen seperti Git VCS, eksekusi terminal/shell, filesystem I/O, REST/WebSocket API, dan SQLite.
---

# Agent Tool Integration Skill

Keahlian ini mengatur konektivitas antara agen AI dengan lingkungan sistem operasi, memastikan pemanggilan tool dilakukan secara deterministik dan aman.

## 1. Katalog Tool Utama

1. **Filesystem Tools**:
   - `read_file`: Membaca baris kode spesifik tanpa membanjiri konteks.
   - `edit_file`: Modifikasi potongan kode berbasis string matching yang presisi.
   - `write_file`: Menulis file baru atau menimpa secara terkontrol.
2. **Terminal / Execution Tools**:
   - `run_command`: Menjalankan CLI terisolasi (npm, cargo, git).
3. **VCS / Git Tools**:
   - Status, diff, commit, branch check, dan stash.
4. **State & Database Tools**:
   - Query SQLite lokal untuk task tracker dan key-value storage.

## 2. Praktik Aman Integrasi Tool

- **Non-Destructive Principle**: Utamakan modifikasi non-destruktif dan buat checkpoint sebelum operasi skala besar.
- **Atomic Operations**: Pastikan perubahan multi-file saling konsisten dan selalu verifikasi hasil build sebelum menandai operasi selesai.
- **Sanitized Execution**: Hindari eksekusi command shell dinamis dengan interpolasi string berbahaya.
