---
name: agent-skill-management
description: Menambah, memperbarui, mengevaluasi, dan mendistribusikan keahlian (skills) kepada setiap agen secara modular dan on-demand.
---

# Agent Skill Management Skill

Keahlian ini mengelola katalog keahlian modular, memastikan agen hanya memuat skill yang relevan dengan tugas aktif guna menghemat context window dan mencegah halusinasi.

## 1. Standar Format Skill

Setiap skill disimpan dalam struktur folder mandiri:
```text
skills/<skill-name>/
├── SKILL.md       # Wajib: Metadata frontmatter (YAML) + instruksi mendalam
├── scripts/       # Opsional: Script automasi atau validator pendukung
└── references/    # Opsional: Panduan API, schema, atau panduan sintaks
```

## 2. Dynamic Skill Binding

- **Manifest Profil**: Setiap agen memiliki daftar referensi `requiredSkills` dan `optionalSkills`.
- **Just-In-Time Injection**: Agen memuat metadata (nama dan deskripsi) saat inisialisasi, dan hanya membaca isi `SKILL.md` saat mendeteksi kata kunci atau kondisi pemicu tugas yang cocok.
- **Skill Deprecation**: Jika ada skill versi baru, update dilakukan di repositori pusat dan agen otomatis menerima versi terbaru tanpa perlu re-training.

