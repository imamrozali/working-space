---
name: agent-hierarchy-management
description: Mengatur struktur organisasi virtual, rantai komando dari level C-suite (CEO, CTO, CPO) hingga Manager, Lead, dan Specialist Staff.
---

# Agent Hierarchy Management Skill

Keahlian ini menetapkan tata kelola hierarkis, wewenang persetujuan (approval authority), dan jalur eskalasi antar-level jabatan AI.

## 1. Tingkatan Jabatan & Tanggung Jawab

| Level | Jabatan Contoh | Tanggung Jawab Utama | Wewenang Khusus |
|---|---|---|---|
| **L1: Executive (C-Suite)** | CEO, CTO, CPO | Menyelaraskan visi bisnis, arsitektur makro, strategi produk | Otorisasi rilis akhir, alokasi anggaran token API |
| **L2: Management** | Engineering Manager, Product Lead | Merumuskan sprint, memecah epics menjadi tasks, evaluasi output | Menyetujui merge PR, mengatur prioritas tim |
| **L3: Leads** | Tech Lead, Architecture Lead | Membimbing teknis, penegakan standar kode, security audit | Menentukan pattern desain dan dependensi |
| **L4: Specialist Staff** | Frontend Dev, Rust Backend Dev, QA, Writer | Eksekusi implementasi, penulisan kode, unit testing | Menulis file workspace, menjalankan build/test |

## 2. Aturan Jalur Eskalasi (Escalation Protocol)

1. **Downstream Delegation**: Perintah hanya mengalir dari level atas ke level bawah atau setara.
2. **Upstream Escalation**: Jika staf menghadapi blocker teknis atau konflik instruksi, isu diedit menjadi ringkasan blocker lalu dieskalasikan ke Lead atau Manager langsung.
3. **Cross-Department Communication**: Komunikasi lintas departemen (misal: Marketing Staff ke Rust Dev) harus melalui Manager masing-masing kecuali dalam channel rapat lintas divisi yang sudah diotorisasi.
