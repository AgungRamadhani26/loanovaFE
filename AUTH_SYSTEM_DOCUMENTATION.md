# Dokumentasi Sistem Autentikasi Frontend (Angular)

Dokumen ini menjelaskan implementasi fitur Login, Logout, dan Refresh Token otomatis yang telah diterapkan pada aplikasi Frontend (Angular). Kode ini dirancang untuk keamanan data (enkripsi), kenyamanan pengguna (tidak perlu login berulang kali), dan kompatibilitas dengan Server-Side Rendering (SSR).

## 1. Fitur Utama

1.  **Login Terenkripsi**: Menyimpan token di Browser Storage secara terenkripsi.
2.  **Auto Login**: Pengguna tetap login saat browser di-refresh.
3.  **Silent Refresh Token**: Jika Access Token kadaluarsa (misal setelah 15 menit), aplikasi otomatis meminta token baru ke server tanpa logout user.
4.  **Concurrent Request Handling**: Mencegah request ganda (bentrok) saat beberapa API dipanggil bersamaan ketika token habis.
5.  **SSR Compatible**: Aplikasi tidak akan crash saat dirender di sisi server (Node.js).
6.  **Permission Management**: Menyimpan daftar hak akses (Permissions) untuk keperluan logika tampilan (hide/show button).

---

## 2. Penjelasan Kode

### A. Auth Service (`src/app/core/services/auth.service.ts`)

Ini adalah "otak" dari sistem autentikasi.

- **Penyimpanan State**: Menggunakan Angular Signals (`userState`) untuk menyimpan data user (token, username, role, permissions) di memori aplikasi agar reaktif.
- **Persistensi Data**: Saat login berhasil, data disimpan ke `localStorage` menggunakan `StorageUtil` yang mengenkripsi data. Saat aplikasi direfresh, constructor service ini akan membaca kembali data tersebut untuk mengembalikan status login.
- **Login Flow**:
  1.  Mengirim kredensial ke API backend.
  2.  Jika akses diterima, simpan Access Token, Refresh Token, dan Permissions.
- **Refresh Token Flow**:
  1.  Mengirim Refresh Token lama ke API.
  2.  Mendapatkan Access Token baru.
  3.  Mengupdate state dan storage.
- **Logout Flow**:
  1.  Memanggil API logout backend (untuk invalidasi di server).
  2.  Membersihkan data di `localStorage` dan memory.
  3.  Redirect paksa ke halaman login.

### B. Auth Interceptor (`src/app/core/interceptors/auth.interceptor.ts`)

Ini adalah "satpam" pintu gerbang jaringan (HTTP Interceptor).

- **Menyisipkan Token**: Setiap request API (kecuali login/refresh) otomatis ditempeli header `Authorization: Bearer <token>`.
- **Menangani Error 401 (Unauthorized)**:
  - Jika backend menolak request karena token expired, interceptor ini **menahan** request tersebut.
  - **Mutex Mechanism (`isRefreshing`)**: Jika ada banyak request gagal bersamaan (misal dashboard memuat data User, Branch, dan Loan sekaligus), sistem akan memastikan hanya **SATU** request refresh token yang dikirim ke server. Request lainnya akan mengantri (queue).
  - Setelah token baru didapat, semua request yang tertahan tadi akan dikirim ulang secara otomatis denga token baru.
  - Jika refresh token juga gagal (expired), user akan otomatis di-logout.

### C. Auth Guard (`src/app/core/guards/auth.guard.ts`)

Ini adalah "palang pintu" routing/navigasi.

- **Proteksi Halaman**: Mencegah user mengakses halaman `/admin/*` tanpa login.
- **SSR Bypass**: Menambahkan logika `!isPlatformBrowser` agar saat server melakukan rendering awal (SSR), guard ini memperbolehkan lewat sementara (karena server tidak punya `localStorage`). Pengecekan real dilakukan setelah halaman sampai di browser.
- **Redirect**: Jika tidak login, user dilempar ke `/auth/login`.

---

## 3. Alur Kerja (Flowchart Sederhana)

**Skenario: Token Expired**

1.  User membuka Dashboard -> Interceptor kirim Request A (Token Lama).
2.  Backend balas: **401 Unauthorized**.
3.  Interceptor tangkap error 401.
4.  Cek: Apakah sedang refresh?
    - **Tidak**: Set status `isRefreshing = true`. Panggil API `/api/auth/refresh`.
    - **Ya**: Masukkan Request A ke antrian tunggu (`refreshTokenSubject`).
5.  API Refresh sukses -> Dapat Token Baru.
6.  Simpan Token Baru di Service & Storage.
7.  Kabari semua request yang mengantri.
8.  Kirim ulang Request A dengan Token Baru.
9.  User menerima data Dashboard tanpa sadar proses ini terjadi.

---

## 4. Cara Penggunaan

Fitur ini sudah aktif secara otomatis. Anda hanya perlu memastikan:

1.  **Daftarkan Interceptor**: Pastikan `authInterceptor` terdaftar di `app.config.ts`.
2.  **Pasang Guard**: Pastikan route yang ingin dilindungi dipasangi `canActivate: [authGuard]` di `app.routes.ts`.
3.  **Gunakan Permission**: Di komponen UI, Anda bisa mengecek permission via `authService.user().permissions.includes('LOAN:Create')` untuk menyembunyikan tombol.
