---
name: agent-to-agent-communication
description: Mengelola protokol percakapan terstruktur, pertukaran pesan asinkron, format request-response, dan negosiasi teknis antar AI agent.
---

# Agent-to-Agent Communication Skill

Keahlian ini mendefinisikan protokol pesan antar-agen agar komunikasi tetap efisien, padat informasi, dan tidak terjebak dalam basa-basi berulang.

## 1. Protokol Komunikasi (Structured Messaging Format)

Semua pesan antar-agen dikemas dalam format JSON terstruktur:

```typescript
interface AgentMessageEnvelope {
  messageId: string;
  correlationId: string; // Menyambungkan alur percakapan / task
  senderId: string;
  senderRole: string;
  recipientId: string; // Bisa spesifik agen atau nama room/channel
  messageType: 'TASK_REQUEST' | 'TASK_RESPONSE' | 'QUERY' | 'CLARIFICATION' | 'STATUS_UPDATE';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  summary: string; // Ringkasan satu kalimat
  body: string;    // Isi teknis lengkap (markdown)
  actionItems?: string[];
  attachments?: string[]; // Path file atau diff hash
  timestamp: string;
}
```

## 2. Aturan Komunikasi Bebas Slop

- **Tanpa Basa-Basi Formalitas**: Agen tidak perlu menulis salam pembuka panjang ("Semoga Anda dalam keadaan baik") atau penutup dekoratif. Langsung sampaikan konteks dan inti teknis.
- **Actionable Call-to-Action**: Setiap pertanyaan atau permintaan harus menyertakan opsi solusi atau pertanyaan biner yang jelas.
- **Penolakan Sopan Berdasar Bukti**: Jika suatu permintaan melanggar arsitektur atau keamanan, tolak dengan menyertakan dalil aturan spesifik.

