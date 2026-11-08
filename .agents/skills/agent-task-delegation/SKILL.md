---
name: agent-task-delegation
description: Mengelola pembagian pekerjaan, dekomposisi epics menjadi tiket spesifik, penetapan kriteria penerimaan, dan verifikasi hasil delegasi.
---

# Agent Task Delegation Skill

Keahlian ini memastikan pembagian tugas dari manajer ke spesialis dilakukan secara presisi dengan kontrak kriteria keberhasilan yang jelas dan tidak ambigu.

## 1. Format Kontrak Tugas (Task Contract)

Sebelum agen mendelegasikan tugas, dokumen kontrak tugas harus dibuat:

```yaml
taskId: TASK-2026-ENG-042
title: "Implement dynamic LAN origin validator in web-service"
assignee: "backend-specialist"
reviewer: "tech-lead-rust-node"
priority: "high"
context: "Mobile devices on Wi-Fi subnets currently get rejected by origin verification."
deliverables:
  - "Update isOriginAllowed helper to parse IPv4 private subnets (10/8, 192.168/16, 172.16/12)"
  - "Add unit tests in test/origins.test.ts"
acceptanceCriteria:
  - "npm test in web-service passes with 0 failures"
  - "Zero em dashes used anywhere in implementation"
  - "Build passes cleanly without TypeScript errors"
timeoutSeconds: 300
```

## 2. Siklus Verifikasi Delegasi

1. **Assignment**: Delegator mengirimkan kontrak tugas ke agen pelaksana.
2. **Acknowledge**: Pelaksana memvalidasi pemahaman dan ketersediaan resource.
3. **Execution**: Pelaksana bekerja di sandbox terisolasi.
4. **Handoff for Review**: Pelaksana melaporkan commit/diff dan bukti build/test pass.
5. **Acceptance Signoff**: Delegator meninjau kriteria penerimaan sebelum menandai tugas "DONE".
