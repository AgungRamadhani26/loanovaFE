# Dokumentasi Alur Pembuatan Landing Page Loanova

Dokumen ini menjelaskan langkah-langkah teknis dan alur kerja dalam membangun Landing Page Loanova yang modern dan profesional menggunakan Angular v21.

## 1. Tahap Persiapan & Riset
- **Analisis Kebutuhan**: Mengidentifikasi fitur utama (Simulasi, Plafon, Keamanan) dan target audiens (nasabah pinjaman).
- **Penentuan Tech Stack**: Memilih Angular v21 untuk performa terbaik dan Tailwind CSS v4 untuk styling yang cepat dan konsisten.
- **Riset Visual**: Menentukan palet warna (Navy, Blue, White) yang memberikan kesan terpercaya dan profesional.

## 2. Inisialisasi Fondasi Proyek
- **Konfigurasi Project**: Memastikan Tailwind CSS sudah terinstal dan terkonfigurasi di `styles.css`.
- **Pembuatan Best Practice**: Menyusun file `ANGULAR_V21_BEST_PRACTICES.md` dan `IMPLEMENTATION_PLAN.md` sebagai kompas pengembangan.
- **Setup Asset**: Membuat ilustrasi Hero Banner menggunakan AI yang mencerminkan kecanggihan teknologi visual finansial.

## 3. Implementasi Layout & Global Components
- **Navbar**: Membangun navigasi yang responsif dengan efek glassmorphism (`backdrop-blur`).
- **Footer**: Menyediakan informasi perusahaan, link penting, dan elemen kepercayaan (OJK).
- **Root App**: Menyatukan Navbar, RouterOutlet, dan Footer di `app.html` agar muncul di setiap halaman.

## 4. Pembangunan Landing Page (Feature Section)
Proses ini dilakukan dengan membangun beberapa section utama:

### a. Hero Section
- Menggunakan animasi `fade-in` dan `slide-in` untuk memberikan kesan dinamis.
- Menempatkan Call-to-Action (CTA) yang jelas untuk "Ajukan Pinjaman".

### b. Section Keunggulan & Layanan
- Menggunakan grid layout untuk menampilkan manfaat produk (100% Online, Cepat, Aman).
- Penekanan pada ikonografi yang menarik dan teks yang mudah dibaca.

### c. Daftar Plafon Pinjaman
- Implementasi kartu (card) produk Bronze, Silver, dan Gold.
- Menampilkan detail plafon maksimal, bunga, dan tenor dengan visual yang kontras.

### d. Simulasi Kredit (Interaktif)
- **Logika Reaktif**: Menggunakan **Angular Signals** (`signal` dan `computed`) untuk menghitung angsuran secara instan saat slider digeser.
- **UI Slider**: Menggunakan input range yang di-styling agar sesuai dengan tema Loanova.

### e. Trust & Security Section
- Menambahkan elemen bukti sosial dan keamanan sertifikasi ISO/OJK.

## 5. Refaktorisasi & Standarisasi
- **Pemisahan File**: Memindahkan template inline ke file `.html` dan style ke `.css`.
- **Modularitas**: Mengatur setiap komponen ke dalam folder spesifik (`layout/navbar`, `features/landing-page`).
- **Komentarisasi**: Menambahkan penjelasan di setiap bagian kode untuk kemudahan pemeliharaan (maintenance).

## 6. Verifikasi & Finishing
- Pengujian responsivitas di layar mobile dan desktop.
- Pembersihan file-file lama yang sudah didegradasi (sampah file refactor).

## 7. Implementasi Modul Autentikasi (Login)
- **Manajemen Role**: Pendefinisian 5 Role utama (Customer, Super Admin, Branch Manager, Marketing, Backoffice).
- **Pembatasan Platform**: Penambahan logika di `AuthService` untuk membatasi role CUSTOMER agar hanya bisa login melalui Android (sesuai kebutuhan bisnis).
- **UI Login Premium**: Desain form login yang konsisten dengan tema warna Landing Page (Navy/Blue) lengkap dengan fitur *show/hide password* dan state loading.
- **Modern State Management**: Menggunakan Angular Signals untuk mengelola state user di seluruh aplikasi secara reaktif dan ringan.

---
**Dokumentasi ini dibuat untuk memudahkan tim memahami cara kerja aplikasi Loanova dari nol.**
