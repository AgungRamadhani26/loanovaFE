# LoanNova FE - Panduan Best Practice Angular v21

Dokumen ini berfungsi sebagai referensi standar pengembangan untuk proyek LoanNova FE. Panduan ini disusun berdasarkan dokumentasi resmi Angular terbaru (v21).

## 1. Arsitektur Proyek
Gunakan pola **Feature-Based Architecture** dengan *Standalone Components* untuk modularitas maksimal.

### Struktur Folder
- `src/app/core/`: Berisi layanan singleton (Auth, Interceptors, Global Services).
- `src/app/shared/`: Berisi komponen UI, pipe, dan direktori yang digunakan di banyak fitur.
- `src/app/features/`: Direktori utama untuk fitur bisnis (contoh: `loan-request`, `admin-panel`). Setiap fitur harus di-*lazy load*.
- `src/app/layout/`: Berisi komponen struktural seperti Navbar dan Sidebar.

---

## 2. Manajemen State (Signals)
Gunakan **Angular Signals** sebagai pengganti utama RxJS untuk state lokal dan global yang sederhana.

- **`signal()`**: Untuk data yang bisa diubah.
- **`computed()`**: Untuk data turunan yang bersifat *read-only*.
- **`resource()`**: Gunakan fitur `resource` atau `rxResource` untuk operasi pengambilan data (I/O).

```typescript
// Contoh di Service
readonly user = signal<UserDTO | null>(null);
readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
```

---

## 3. Integrasi API & DTO
Sesuai dengan best practice Java, setiap request dan response harus memiliki tipe data yang jelas (Data Transfer Object).

### Aturan Main:
1. Gunakan **TypeScript Interface** untuk merepresentasikan DTO dari backend.
2. Tempatkan interface global di `src/app/core/models/`.
3. Gunakan **Functional Interceptors** untuk menangani token JWT dan error handling global.

```typescript
// src/app/core/models/loan.interface.ts
export interface LoanRequestDTO {
  uuid: string;
  amount: number;
  status: 'PENDING' | 'APPROVED';
}
```

---

## 4. Keamanan & Role (RBAC)
Keamanan di sisi klien dilakukan menggunakan **Functional Guards**.

### Strategi:
- **Auth Guard**: Melindungi rute dari pengguna yang belum login.
- **Role Guard**: Mengecek permission pengguna berdasarkan data di JWT/Signal sebelum mengizinkan akses ke rute tertentu.
- **@if**: Gunakan sintaks `@if` di template untuk menyembunyikan elemen UI yang tidak sesuai dengan role pengguna.

```typescript
// Contoh di Template
@if (authService.isAdmin()) {
  <button (click)="approveLoan()">Approve</button>
}
```

---

## 5. Standar Penulisan Kode
- Selalu gunakan variabel `private inject(HttpClient)` daripada constructor injection (Style Angular Modern).
- Hindari penggunaan `any`. Selalu definisikan tipe data.
- Pastikan komponen bersifat *standalone*.
- Gunakan kontrol alur modern (`@if`, `@for`, `@switch`).

---

**Dokumen ini adalah referensi hidup. Silakan perbarui jika ada perubahan standar tim.**
