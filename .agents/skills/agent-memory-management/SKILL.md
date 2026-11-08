---
name: agent-memory-management
description: Mengelola memori jangka pendek dan jangka panjang agen, memori profil pribadi, memori korporat bersama, serta kompresi konteks riwayat percakapan.
---

# Agent Memory Management Skill

Keahlian ini menyediakan struktur penyimpanan memori dua tingkat (Short-Term vs Long-Term) agar agen tidak kehilangan konteks historis tanpa membebani limit token LLM.

## 1. Tingkatan Memori Agen

1. **Working Memory (In-Context / Short-Term)**:
   - Menyimpan konteks percakapan 5-10 giliran terakhir.
   - Variabel tugas aktif dan status eksekusi command saat ini.
2. **Episodic Memory (Task Logs & Checkpoints)**:
   - Catatan ringkasan setiap tugas yang diselesaikan.
   - Disimpan di SQLite lokal dalam tabel `agent_task_history`.
3. **Semantic Memory (Corporate Knowledge Base)**:
   - Aturan arsitektur, pedoman desain UI, kamus domain, dan riwayat keputusan teknis (ADR).
   - Diindeks menggunakan vector embedding lokal atau full-text search (FTS5 SQLite).

## 2. Strategi Kompresi Memori (Compaction)

- Saat percakapan melebihi ambang batas token (misal: 70% context window):
  - Ekstrak fakta inti, keputusan arsitektur, dan blocker ke dalam dokumen ringkasan markdown.
  - Buang payload output verbose (seperti raw stack trace atau log dump panjang) dan pertahankan hanya ringkasan akar masalah serta nomor line file terkait.
