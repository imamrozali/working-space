---
name: ai-office-architect
description: Merancang keseluruhan sistem dan arsitektur AI Office, mencakup struktur platform, topologi agen, layer komunikasi, penyimpanan lokal, dan orkestrasi virtual office.
---

# AI Office Architect Skill

Keahlian ini memandu perancangan arsitektur enterprise untuk ekosistem AI Office multi-agen, menjamin skalabilitas, isolasi keamanan, dan efisiensi koordinasi.

## 1. Prinsip Utama Arsitektur

1. **Local-First & Kedaulatan Data**: Semua data esensial, memori korporat, log percakapan, dan kredensial tersimpan di mesin lokal (Tauri + SQLite / embedded KV).
2. **Event-Driven Reactive Fabric**: Komunikasi real-time berbasis WebSocket event hub dengan payload JSON berformat ketat.
3. **Pemisahan Layer (Layered Topology)**:
   - Presentation Layer: Virtual office 2D/isometric view (Canvas/React 19), status tracker, HUD.
   - Coordination Layer: Message broker, task router, and conflict resolution engine.
   - Execution Layer: Agen spesialis dengan runtime sandbox, CLI tool runner, and LLM inference bridge.
   - Storage Layer: Vector DB lokal, relational task store, and static asset CDN.

## 2. Diagram Arsitektur Sistem

```text
[ Virtual Office UI ] <---> [ WebSocket Hub (web-service) ]
                                   ^
                                   | (Event Bus)
   +-------------------------------+-------------------------------+
   |                               |                               |
[ Executive Agents ]      [ Management Agents ]          [ Specialist Agents ]
  CEO, CTO, CPO             Engineering Manager            Frontend Dev, Rust Dev,
                            Product Manager                QA Tester, DevOps
```

## 3. Checklist Perancangan AI Office

- Definisikan bagan organisasi dan rantai komando (hierarchy tree).
- Tentukan channel komunikasi antar agen (direct message, room meeting, broadcast notice).
- Tetapkan batasan akses filesystem, terminal, dan API pihak ketiga per agen.
- Rancang skema penyimpanan sesi dan checkpoint recovery saat daemon restart.

