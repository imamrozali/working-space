---
name: agent-visualization
description: Menampilkan visualisasi avatar, badge status real-time (idle, thinking, coding, testing, meeting), indikator mood, dan animasi aktivitas AI.
---

# Agent Visualization Skill

Keahlian ini mendefinisikan sistem representasi visual avatar agen, animasi status aktif, dan indikator aktivitas secara real-time pada antarmuka pengguna.

## 1. Status Mesin Status Agen (Agent State Matrix)

| Status | Warna Glow | Indikator Visual | Aktivitas di Balik Layar |
|---|---|---|---|
| `IDLE` | Abu-abu Muted (`#94a3b8`) | Ikon statis, low opacity | Menunggu penugasan tugas baru |
| `THINKING` | Ungu Elektrik (`#a855f7`) | Animasi pulsing pelan | Menganalisis file atau merancang plan |
| `CODING` | Biru Cyan (`#38bdf8`) | Indikator typing cepat | Menulis kode atau mengedit file proyek |
| `TESTING` | Kuning Amber (`#fbbf24`) | Putaran loader akselerasi | Menjalankan build atau cargo/npm test |
| `SUCCESS` | Hijau Emerald (`#34d399`) | Checkmark bersinar sesaat | Tugas selesai dan terverifikasi 100% |
| `BLOCKED` | Merah Crimson (`#f87171`) | Pulsing peringatan | Menghadapi error atau membutuhkan izin user |

## 2. Struktur Komponen Visual Avatar

Setiap kartu atau avatar agen harus memuat:
1. **Avatar Icon / Sprite**: Simbol visual representatif.
2. **Name & Role Pill**: Identitas nama dan jabatan.
3. **Live Status Bubble**: Tooltip ringkas aksi saat ini (contoh: *"Compiling Rust lib.rs..."*).
4. **Activity Sparkline**: Bar mini yang menunjukkan intensitas konsumsi CPU/token.
