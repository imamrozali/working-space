---
name: agent-meeting-management
description: Memfasilitasi rapat virtual multi-agen, standup harian, sesi brainstorming, perdebatan arsitektur, dan pembuatan notula rapat otomatis.
---

# Agent Meeting Management Skill

Keahlian ini mengorganisasi sesi sinkronisasi multi-agen secara terstruktur dengan agenda yang ketat, moderator yang tegas, dan output notula rapat yang langsung dapat ditindaklanjuti.

## 1. Jenis Rapat Virtual AI

- **Daily Sync / Standup**: Durasi ringkas (maksimal 3 putaran). Masing-masing agen menjawab:
  1. Apa yang selesai kemarin?
  2. Apa fokus hari ini?
  3. Adakah blocker teknis?
- **Architecture Review (RFC Meeting)**: CTO / Tech Lead memimpin review usulan perubahan struktur sistem. Peserta memberikan kritik konstruktif berbasis data.
- **Post-Mortem Incident Meeting**: Analisis insiden kegagalan sistem, mencari akar masalah (Root Cause), dan menetapkan action item pencegahan berulang.

## 2. Struktur Notula Rapat Otomatis (Meeting Minutes)

```markdown
# Meeting Minutes: Sprint Planning 2026-W45
- **Moderator**: Product Manager Agent
- **Peserta**: CTO, Frontend Lead, Rust Core Dev, QA Lead
- **Keputusan Disepakati**:
  1. Mengadopsi headless Rust daemon untuk server VPS.
  2. Port default dipatenkan di web-service (8080) dan web-storage (9000).
- **Action Items**:
  - [ ] Rust Dev: Buat binary omni-daemon (--headless) sebelum Kamis.
  - [ ] Frontend Lead: Update koneksi host di mobile client.
```
