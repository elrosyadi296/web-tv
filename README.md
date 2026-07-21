# 296 LIVE TV

Website IPTV modern, 100% static (HTML + Tailwind + Vanilla JS ES Module + hls.js), siap deploy ke **GitHub Pages** atau **Cloudflare Pages** tanpa backend.

## ⚠️ Penting soal data channel

File di `/data/*.json` pada paket ini berisi **data contoh (placeholder)** — nama channel fiktif dan stream memakai *test stream* publik milik Apple (`bipbop`) dan Mux (`x36xhzz`), yang memang disediakan untuk keperluan uji coba player HLS. **Ganti nilai `stream` dengan URL siaran resmi/legal milik Anda sendiri** sebelum situs dipakai secara nyata. Struktur field tidak perlu diubah.

## Menjalankan secara lokal

Karena situs memakai ES Module (`fetch` ke file JSON), buka lewat server lokal, bukan `file://`:

```bash
# opsi 1
npx serve .

# opsi 2
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Menambah channel / kategori baru

1. Tambahkan channel ke `data/all.json` (sumber utama — dipakai untuk search, filter, kategori, dan negara otomatis).
2. Jika ingin membuat file kategori terpisah (opsional, untuk pre-filtering), buat `data/nama-kategori.json` dan daftarkan di `assets/js/config.js` → `CONFIG.dataSources`.
3. Tidak perlu mengubah kode apa pun — kategori & negara baru otomatis muncul karena dibangun dari isi data.

Format satu channel:

```json
{
  "id": "cartoon-network",
  "name": "Cartoon Network",
  "logo": "https://.../logo.png",
  "country": "US",
  "language": "English",
  "category": "Animation",
  "stream": "https://.../index.m3u8",
  "website": "",
  "resolution": "HD",
  "status": "live"
}
```

- `id` harus unik.
- `logo` boleh dikosongkan (`""`) — kartu channel otomatis menampilkan inisial dengan warna gradien sebagai fallback.
- `status`: `"live"` atau `"offline"`.

## Struktur proyek

```
/
├── index.html          # Shell SPA (Beranda, Semua Channel, Kategori, Negara, Favorit, Riwayat, Pengaturan)
├── player.html          # Halaman pemutar channel
├── assets/
│   ├── css/style.css    # Design tokens + tema dark glassmorphism
│   ├── js/
│   │   ├── config.js    # Satu-satunya tempat konfigurasi situs
│   │   ├── utils.js      # Sanitasi, debounce, toast, dll.
│   │   ├── storage.js    # LocalStorage: favorit, riwayat, continue watching, pengaturan
│   │   ├── store.js      # Fetch + cache + index kategori/negara dari JSON
│   │   ├── main.js       # Router hash + render semua halaman
│   │   └── player-page.js
│   └── icons/
├── components/
│   ├── sidebar.js
│   ├── header.js
│   ├── card.js
│   ├── player.js         # Kontrol video berbasis hls.js
│   ├── modal.js           # Share/QR/Filter
│   └── skeleton.js
├── data/*.json
├── manifest.json
├── service-worker.js
├── robots.txt
└── sitemap.xml
```

## Deploy

**GitHub Pages**: push ke repo, aktifkan Pages dari branch `main` (folder root). Tidak perlu build step.

**Cloudflare Pages**: hubungkan repo, kosongkan build command, set output directory ke `/`.

Ganti seluruh URL `https://example.com` di `sitemap.xml` dan `robots.txt` dengan domain asli Anda setelah deploy.

## Catatan performa & keamanan

- Semua teks dari JSON di-escape sebelum dirender (`escapeHTML`) untuk mencegah XSS.
- URL logo/stream divalidasi (`isSafeUrl`) — hanya `http`/`https` yang diizinkan.
- Data JSON di-fetch sekali lalu di-cache di `sessionStorage` agar navigasi antar halaman instan.
- Infinite scroll + skeleton loading dipakai di halaman Semua Channel/Kategori/Negara untuk daftar channel yang besar.
