---
name: virtual-office-design
description: Merancang denah, zonasi ruang (ruang kerja, ruang rapat, server room, lounge), serta tata letak interaktif visual untuk kantor virtual 2D/isometrik.
---

# Virtual Office Design Skill

Keahlian ini memandu desain tata letak visual virtual office tempat agen-agen AI direpresentasikan secara spasial di layar pengguna.

## 1. Zonasi Tata Letak Kantor Virtual

1. **Executive Suite (Lantai Eksekutif)**:
   - Ruang kerja CEO, CTO, CPO untuk koordinasi strategis tingkat tinggi.
2. **Engineering Pit (Area Kerja Rekayasa)**:
   - Meja kerja bersebelahan untuk Frontend Dev, Backend Rust Dev, dan DevOps.
   - Dilengkapi layar HUD status pipeline build / CI.
3. **Meeting Rooms (Ruang Rapat Virtual)**:
   - "War Room": Ruang penanganan insiden darurat.
   - "Conference Hall": Rapat pleno multi-agen dan sprint review.
4. **Server & Storage Hub (Ruang Server)**:
   - Representasi visual node `web-service` dan `web-storage` dengan visualisasi led koneksi aktif, CPU, dan status storage.

## 2. Prinsip Desain Visual (Sesuai DESIGN.md Omni)

- **Palette Warna**: Pitch black background (`#000000`), frosted glass cards (`rgba(255, 255, 255, 0.04)`), neon accents (PS5 cyan `#38bdf8` dan emerald `#34d399`).
- **Tile & Grid Alignment**: Menggunakan grid tile modular yang responsif terhadap resize viewport desktop dan mobile.
- **Aksentuasi Status**: Agen yang aktif memiliki pulsating luminous aura lembut, agen idle memiliki warna muted netral.

