---
name: local-first-desktop-architecture
description: Merancang arsitektur aplikasi desktop local-first berbasis Tauri v2, native Rust backend, IPC performa tinggi, dan database lokal SQLite.
---

# Local-First Desktop Architecture Skill

Keahlian ini memandu pembangunan fondasi aplikasi desktop mandiri yang memprioritaskan penyimpanan lokal, kecepatan instan, dan operasi tanpa ketergantungan cloud terus-menerus.

## 1. Arsitektur Komponen Local-First

```text
+-------------------------------------------------------+
|                 Frontend Webview (React 19)           |
|        UI State, Virtual Canvas, Audio FX, HUD        |
+-------------------------------------------------------+
                           |
                     Tauri IPC Invoke
                           |
+-------------------------------------------------------+
|               Native Rust Core (Tauri v2)             |
|   - Storage Stats (statvfs / GetDiskFreeSpaceExW)     |
|   - Native WebSocket Client / Headless Daemon         |
|   - File System Operations & OS Process Management    |
|   - SQLite Connection Pool (WAL Mode)                 |
+-------------------------------------------------------+
```

## 2. Prinsip Rekayasa Performa

1. **Zero-Latency State**: Baca dan tulis ke database lokal (SQLite dalam mode WAL) sebelum mencoba sinkronisasi jaringan.
2. **Efficient Binary IPC**: Hindari serialisasi JSON raksasa yang berulang di jalur IPC; gunakan buffer biner atau payload terstruktur ringkas.
3. **Background Daemon Ready**: Sediakan jalur eksekusi ganda (GUI windowed mode vs headless daemon mode) agar core Rust dapat berjalan sebagai background worker tanpa tampilan grafis.
