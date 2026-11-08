---
name: multi-agent-orchestration
description: Mengatur koordinasi, scheduling, sinkronisasi state, dan penyelesaian konflik antar banyak AI agent dalam satu alur kerja terpadu.
---

# Multi-Agent Orchestration Skill

Keahlian ini mengatur bagaimana sekumpulan agen otonom bekerja bersama tanpa deadlock, duplikasi tugas, atau loop percakapan tak berujung.

## 1. Pola Topologi Orkestrasi

1. **Hierarchical (Supervisor/Worker)**: Agen atasan (Supervisor) menerima brief tingkat tinggi, memecah pekerjaan, membagikan sub-tugas ke bawahan, lalu menggabungkan hasil evaluasi.
2. **Pipeline (Sequential Assembly)**: Output dari Agen A langsung menjadi input terverifikasi bagi Agen B (misal: Architect -> Developer -> Code Reviewer -> QA).
3. **Blackboard Pattern**: Agen berkolaborasi di satu papan data bersama (Shared Workspace State). Agen mengambil item kerja sesuai spesialisasi saat status dependensi terpenuhi.
4. **Peer Review & Debate**: Dua agen dengan persona berbeda (misal: Creator vs Critic) saling meninjau untuk mencapai konsensus berkualitas sebelum output diserahkan ke pengguna.

## 2. Mitigasi Loop & Deadlock

- **Max Round Trips Guard**: Setiap sesi diskusi antar-agen dibatasi maksimal 5 hingga 8 putaran pesan.
- **Circuit Breaker**: Jika terjadi kegagalan eksekusi tugas 3 kali berturut-turut, eskalasikan ke agen setingkat di atasnya atau mintakan klarifikasi ke pengguna.
- **Idempotency Token**: Setiap pesan tugas membawa `taskId` dan `idempotencyKey` unik guna mencegah eksekusi ganda.

## 3. Struktur Event Orkestrasi

```typescript
interface AgentTaskEvent {
  eventId: string;
  taskId: string;
  sourceAgentId: string;
  targetAgentId: string;
  action: 'ASSIGN' | 'ACK' | 'PROGRESS' | 'REVIEW' | 'COMPLETE' | 'FAILED';
  payload: Record<string, unknown>;
  timestamp: string;
}
```

