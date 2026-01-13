# Master Tutorial: Membangun Frontend Loanova dengan Angular 19

Tutorial ini akan membimbingmu memahami setiap jengkal kode yang telah kita buat, mulai dari infrastruktur dasar hingga tampilan dashboard yang premium.

---

## BAB 1: Persiapan Infrastruktur & Keamanan (Core)

Sebelum bikin tampilan, kita harus bikin "otak" dan "kabel" aplikasinya dulu.

### 1.1 AuthService (Pusat Kendali User)
`src/app/core/services/auth.service.ts`

Ini adalah file paling penting. Tugasnya:
- **Login**: Ngobrol ke API Backend.
- **State Management**: Menyimpan data user (Username, Role) menggunakan **Signals**.
- **Persistence**: Menyimpan token ke `localStorage` supaya kalau halaman di-refresh, user tidak perlu login ulang.

**Konsep Kunci:**
- `signal<UserState>(...)`: Tempat penyimpanan data user di memori RAM yang reaktif.
- `localStorage.setItem(...)`: Tempat penyimpanan data user di Harddisk/Browser browser.

### 1.2 AuthInterceptor (Satpam Otomatis)
`src/app/core/interceptors/auth.interceptor.ts`

Setiap kali aplikasi kita memanggil API (ambil daftar user, simpan data, dll), interceptor ini akan otomatis:
1. Menempelkan **Bearer Token** di header request.
2. Jika server menjawab "401 Unauthorized" (token mati), interceptor ini akan memanggil fungsi **Refresh Token** secara diam-diam tanpa user sadar.

---

## BAB 2: Membuat "Cangkang" Aplikasi (Layouting)

Kita ingin sidebar dan header tidak hilang saat pindah menu. Kita menggunakan pola **Nested Routing**.

### 2.1 Admin Layout (The Container)
`src/app/layout/admin/admin-layout/admin-layout.component.html`

Di sini kita menyusun puzzle-nya:
```html
<div class="flex">
  <app-admin-sidebar></app-admin-sidebar> <!-- Menu Kiri -->
  <div class="flex-1">
    <app-admin-header></app-admin-header> <!-- Navbar Atas -->
    <main class="pl-72 pt-20"> <!-- Konten Tengah -->
       <router-outlet></router-outlet> <!-- SI AJAIB: Tempat Dashboard muncul -->
    </main>
  </div>
</div>
```

**Kenapa pakai `pl-72`?**
Karena sidebar kita `fixed` (nempel), kalau tidak dikasih padding kiri (`pl`), konten dashboard akan tertutup oleh sidebar.

### 2.2 Sidebar & RBAC (Hak Akses)
`src/app/layout/admin/sidebar/sidebar.component.ts`

Kita tidak ingin Staff Marketing bisa melihat menu "User Management". Caranya:
- Kita buat daftar menu yang memiliki properti `roles`.
- Kita pakai `computed` signal untuk memfilter menu: "Tampilkan menu ini HANYA JIKA role user yang sedang login ada di daftar roles menu tersebut."

---

## BAB 3: Alur Login (Gerbang Masuk)

Halaman login dibuat terpisah tanpa Sidebar.

### 3.1 Template Login yang Cantik
`src/app/features/auth/login/login.component.html`

- Kita pakai Tailwind CSS untuk membuat gradasi blur di background.
- Menggunakan `ngModel` untuk menangkap ketikan user.
- Menggunakan `@if (isLoading())` untuk menampilkan animasi "Spinning" saat tombol ditekan agar user tidak bingung.

### 3.2 Logika Pindah Halaman
`src/app/features/auth/login/login.component.ts`

Setelah `AuthService.login()` menjawab sukses, kita panggil `this.router.navigate(['/admin/dashboard'])`. Ini akan memicu Angular untuk mengganti tampilan secara instan.

---

## BAB 4: Dashboard Premium

Halaman pertama yang dilihat user setelah masuk.

### 4.1 Stats Card (Kartu Statistik)
`src/app/features/dashboard/dashboard.component.html`

Kita tidak membuat kartu satu per satu secara manual. Kita menggunakan pola **@for**:
```html
@for (stat of stats(); track stat.label) {
  <div class="card">
    <span class="icon">{{ stat.icon }}</span>
    <h2>{{ stat.value }}</h2>
  </div>
}
```
Data `stats()` didefinisikan di file `.ts` sebagai Signal. Ini memudahkan kita nantinya jika ingin mengambil data real-time dari API.

---

## BAB 5: Routing & Protection

Filenya di `src/app/app.routes.ts`.

Penting untuk dipahami:
- `path: 'admin'` adalah parent-nya.
- Semua yang ada di `children` otomatis akan menggunakan `AdminLayout`.
- Jika user mencoba akses `/admin/dashboard` tanpa login, nantinya kita akan tambahkan `AuthGuard` untuk memblokirnya (Langkah selanjutnya).

---

## Tips Belajar Frontend untuk Kamu:
1. **Pahami Tag Layout**: Selalu bayangkan kotak-kotak. Header di atas, Sidebar di kiri, Konten di tengah.
2. **Lihat Interceptor sebagai Satpam**: Kamu tidak perlu repot nempel token di setiap file, cukup tulis sekali di satpam (interceptor).
3. **Signals adalah Masa Depan**: Jangan pakai variabel biasa kalau datanya akan berubah di layar. Pakai signal agar Angular tahu kapan harus update tampilan.

Ada bagian yang kamu ingin saya buatkan kodenya lebih spesifik lagi? Misal: Cara bikin tabel user yang rapi?
