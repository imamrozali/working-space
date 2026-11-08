---
name: agent-cost-management
description: Memonitor, mengaudit, membatasi kuota token, dan mengoptimalkan efisiensi biaya pemanggilan API model AI dalam ekosistem kantor virtual.
---

# Agent Cost Management Skill

Keahlian ini memastikan seluruh operasi multi-agen berjalan hemat biaya dengan melakukan tracking token real-time, caching prompt terstruktur, dan penegakan batas kuota (budget guardrails).

## 1. Mekanisme Pengendalian Biaya (Cost Controls)

1. **Model Tiering Strategy**:
   - Gunakan model cepat dan hemat biaya (Flash / Mini tier) untuk tugas rutin seperti routing pesan, ekstraksi entitas, pembuatan notula, atau parsing format JSON.
   - Gunakan model berdaya komputasi tinggi (Pro / Reasoning tier) hanya untuk perancangan arsitektur kompleks, debugging logika rumit, atau audit keamanan.
2. **Context Pruning & Caching**:
   - Manfaatkan prompt caching untuk instruksi sistem statis dan file referensi dokumen panjang.
   - Buang log build usang dari konteks sebelum memanggil API inference.
3. **Budget Guardrails**:
   - Tetapkan batas maksimal token per tugas (misal: 50.000 token per tiket).
   - Berikan peringatan dini saat total pengeluaran sesi mendekati batas plafon harian.
