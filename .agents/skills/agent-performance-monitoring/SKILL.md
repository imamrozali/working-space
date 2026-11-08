---
name: agent-performance-monitoring
description: Mengukur dan menganalisis performa kerja AI agent, metrik keberhasilan tugas, waktu respons, rasio error kompilasi, dan efisiensi penyelesaian.
---

# Agent Performance Monitoring Skill

Keahlian ini menyediakan framework observabilitas bagi ekosistem AI Office untuk mengevaluasi efektivitas, kecepatan, dan akurasi setiap agen.

## 1. Key Performance Indicators (KPI) Agen

1. **Task Completion Rate (TCR)**: Persentase tugas yang selesai tanpa eskalasi darurat.
2. **First-Pass Build Success (FPBS)**: Frekuensi kode yang ditulis lolos kompilasi dan lint pada percobaan pertama.
3. **Turn Efficiency**: Jumlah giliran (turn/round trip) yang dibutuhkan untuk menyelesaikan satu tiket tugas.
4. **Token Cost per Task**: Rata-rata token LLM yang dikonsumsi untuk menghasilkan solusi yang valid.
5. **Quality Lock Violations**: Jumlah pelanggaran aturan kode (misal: penggunaan tipe `any`, divider banner, atau karakter em dash).

## 2. Struktur Event Log Metrik

```json
{
  "metric": "AGENT_TASK_METRIC",
  "agentId": "frontend-specialist",
  "taskId": "TASK-2026-ENG-042",
  "durationSeconds": 48.2,
  "turnsCount": 3,
  "buildPassed": true,
  "testPassed": true,
  "promptTokens": 14200,
  "completionTokens": 1850,
  "estimatedCostUsd": 0.042
}
```
