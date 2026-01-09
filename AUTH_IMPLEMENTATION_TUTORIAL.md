# Tutorial Implementasi Autentikasi JWT (Angular v21)

Hai! Dokumen ini dibuat spesial buat kamu biar paham **setiap baris kode** yang kita tulis buat fitur Login. Kita pakai pola modern: **Angular Signals** (buat state) dan **RxJS Observable** (buat API).

---

## 1. Alur Kerja Autentikasi (Story)

1.  **User mengetik**: Data ditampung di `signal` (username & password).
2.  **User Klik Tombol**: Fungsi `onSubmit()` di komponen jalan.
3.  **Kirim ke Service**: Komponen manggil `AuthService.login()`.
4.  **Aksi Service**: Service ngirim paket POST ke backend lewat **Proxy**.
5.  **Simpan Sesi**: Sambil data lewat, Service pake operator `tap` buat nangkep token dan nyimpen di **LocalStorage** (biar pas di refresh gak logout).
6.  **Izin Akses**: `AuthInterceptor` bakal otomatis nempelin token tadi ke setiap request selanjutnya biar server kenal siapa kita.

---

## 2. Bedah Kode: Jantung Aplikasi (`AuthService`)

File: `src/app/core/services/auth.service.ts`

```typescript
// Signal: 'Kotak reaktif' buat nyimpen data user yang lagi login
private readonly userState = signal<UserState>({ ... });

// Method login: Ngirim data ke backend dan pake .pipe(tap(...))
// tap() itu kayak 'singgah sebentar' buat nyimpen data tanpa ngerubah jalannya data.
login(credentials: LoginRequestDTO) {
    return this.http.post(...).pipe(
        tap(response => {
           // Simpen ke RAM (Signal) & Simpen ke Storage (LocalStorage)
           this.saveState(response.data);
        })
    );
}
```

---

## 3. Bedah Kode: Si Satpam (`AuthInterceptor`)

File: `src/app/core/interceptors/auth.interceptor.ts`

Tugasnya cuma dua:
1.  **Nempelin Label**: Pas mau kirim data, dia pasang `Authorization: Bearer <token>`.
2.  **Tuker Kunci**: Kalo server bilang "Token Basi" (Error 401), dia otomatis manggil `refreshToken()` buat minta kunci baru tanpa ganggu user.

---

## 4. Bedah Kode: Si Tampilan (`LoginComponent`)

File: `src/app/features/auth/login/login.component.ts`

Di sini kita pake pola **Subscribe**:
```typescript
onSubmit() {
    this.authService.login(...).subscribe({
        next: (result) => { 
           // Kalo sukses, pindah halaman pake router.navigate
        },
        error: (err) => {
           // Kalo error, tampilin pesan error dari backend
        }
    });
}
```

## 5. Kenapa Gak Pakai Validasi Manual di Frontend?
Karena kita mau **API-Driven UI**. 
- Kalo backend nambah aturan (misal: password harus ada angka), kita gak perlu ngerubah kode frontend. 
- Pesan errornya langsung ditarik dari jawaban server. Lebih efisien dan sinkron!

---

### Tips Buat Developer:
- Selalu **restart `ng serve`** kalo kamu ngerubah file `angular.json` atau `proxy.conf.json`.
- Pake **Angular DevTools** di Chrome buat ngeliat isi `Signals` secara visual.

Semangat belajarnya, kodenya sudah full komentar baris-per-baris, silakan diintip! 🚀
