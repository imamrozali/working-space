# Web Storage (CDN Service)

Service terdedikasi untuk penyimpanan dan penyajian static asset / CDN.
Menyimpan file ke dalam folder penyimpanan yang namanya dapat diatur dari luar (default: `cdn-global`).

## Konfigurasi Lingkungan (Environment Variables)

| Variable | Default | Deskripsi |
| :--- | :--- | :--- |
| `PORT` | `9000` | Port HTTP server |
| `HOST` | `0.0.0.0` | Host binding |
| `CDN_FOLDER` | `cdn-global` | Nama folder CDN (bisa diset dari luar) |
| `CDN_STORAGE_PATH` | *(Otomatis)* | Custom path absolut untuk folder CDN |

## Endpoint API CDN

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/cdn/:filename` | Mengambil file dari folder CDN (streaming, auto-MIME, HTTP caching) |
| `POST` | `/cdn/upload` | Upload file (via query `?filename=...`, header `X-Filename`, atau JSON) |
| `GET` | `/cdn` atau `/files` | Melihat daftar semua file di folder CDN |
| `DELETE` | `/cdn/:filename` | Menghapus file dari folder CDN |
| `GET` | `/` atau `/health` | Metadata service, status, dan lokasi folder CDN |

## Cara Menjalankan

### Mode Pengembangan (Watch)
```bash
# Menjalankan dengan folder default (cdn-global)
npm run dev

# Menjalankan dengan nama folder kustom dari luar
CDN_FOLDER=my-cdn-folder npm run dev
```

### Build & Produksi
```bash
npm run build
npm start
```

