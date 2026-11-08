# Web Service (WebSocket Server)

Node.js WebSocket server untuk komunikasi real-time dengan client (`desktop-platform` dan platform lainnya).

## Fitur
- **Handshake Init**: Menerima message tipe `init` dari client dan membalas dengan `init_ack`.
- **Heartbeat (Ping/Pong)**: Otomatis mendeteksi client stale / terputus setiap 30 detik.
- **Broadcast / Chat**: Meneruskan pesan antar client yang terhubung.
- **Graceful Shutdown**: Menutup koneksi dengan aman saat server dihentikan.

## Cara Menjalankan

### Mode Pengembangan (Watch)
```bash
npm run dev
```

### Build & Menjalankan Produksi
```bash
npm run build
npm start
```

Default port WebSocket server berjalan pada: `ws://localhost:8080`
