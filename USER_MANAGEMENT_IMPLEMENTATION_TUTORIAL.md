# Tutorial Implementasi Fitur Manajemen User (User Management)

Dokumen ini menjelaskan implementasi fitur **User Management** yang digunakan untuk mengelola pengguna aplikasi. Fitur ini mencakup listing user, filtering lanjutan (Branch, Role, Status), dan pagination client-side yang responsif.

---

## DAFTAR ISI

1.  **Backend Integration** (Model & Service)
2.  **Display Logic** (Component, Signal, Computed)
3.  **UI Template** (Table, Filters, Pagination)
4.  **Security & SSR**

---

## 1. Backend Integration

### A. Data Model (`user-response.model.ts`)

Mendifinisikan struktur data `UserData` yang diterima dari API Backend.

```typescript
export interface UserData {
  id: number;
  username: string;
  email: string;
  roles: string[];
  branchCode: string; // Bisa null jika Superadmin
  isActive: boolean;
}
```

### B. User Service (`user.service.ts`)

Service ini menggunakan `HttpClient` untuk mengambil data dari endpoint `/api/users/all-param`. Auth Interceptor otomatis menangani header token.

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  // Endpoint ini mengembalikan semua user (subject to server limitations)
  private readonly API_URL = '/api/users/all-param';

  getAllUsers(): Observable<ApiResponse<UserData[]>> {
    return this.http.get<ApiResponse<UserData[]>>(this.API_URL);
  }
}
```

---

## 2. Display Logic (Component)

File: `src/app/features/users/user-list.component.ts`

Component ini menggunakan pendekatan modern **Angular Signals** untuk state management yang reaktif dan performa tinggi.

### A. Reactive State (Signals)

Kita tidak menggunakan variabel biasa, melainkan `signal` agar perubahan UI otomatis terjadi.

```typescript
users = signal<UserData[]>([]);
searchQuery = signal<string>('');
selectedBranch = signal<string>('ALL'); // Filter Branch
selectedRole = signal<string>('ALL'); // Filter Role
currentPage = signal<number>(1);
pageSize = signal<number>(5);
```

### B. Computed Filter Logic

Filtering dilakukan di client-side menggunakan `computed` signal. Ini memungkinkan pencarian yang sangat cepat tanpa membebani server untuk setiap keystroke.

1.  **Dynamic Dropdown Options**: List branch dan role di dropdown filter diambil secara dinamis dari data user yang ada (`availableBranches`, `availableRoles`).
2.  **Multi-Filter**: Filter menggabungkan Search Text, Branch Selection, Role Selection, dan Status.

```typescript
filteredUsers = computed(() => {
    let results = this.users();
    // 1. Search Text (Username, Email, Branch, Role)
    if (query) { ... }

    // 2. Dropdown Filters
    if (branch !== 'ALL') { ... }
    if (role !== 'ALL') { ... }
    if (status !== 'ALL') { ... }

    return results;
});
```

### C. Standardized Pagination UI

Pagination menggunakan logic yang seragam dengan module lain (Branch & Plafond), menghitung `startIndex` dan `endIndex` berdasarkan `currentPage` dan `pageSize`.

---

## 3. UI Template (HTML & CSS)

File: `src/app/features/users/user-list.component.html`

### A. Interactive Stats

Menampilkan ringkasan data di bagian atas halaman (Total User, Active Users, Admins) menggunakan `computed` signal untuk kalkulasi real-time.

### B. Expandable Filter Panel

Panel filter dapat dibuka/tutup (`toggleFilter()`) untuk menghemat ruang layar. Panel ini menyediakan dropdown untuk Branch, Role, dan Status.

### C. Data Table

Tabel menampilkan data user dengan indikator visual:

- **Avatar Inisial**: Dibuat dinamis dengan warna background berbasis ID user.
- **Role Badge**: Menampilkan role user.
- **Status Badge**: Hijau untuk Active, Abu-abu untuk Inactive.

```html
<tr class="hover:bg-slate-50/50 transition-colors text-sm">
  <!-- Avatar Logic -->
  <div class="user-avatar" [style.background-color]="...">
    {{ user.username.substring(0, 2).toUpperCase() }}
  </div>
  <!-- ... -->
</tr>
```

---

## 4. Security & SSR Handling

Untuk mendukung **Server-Side Rendering (SSR)** tanpa error, kita membungkus pemanggilan API data di dalam pengecekan `isPlatformBrowser`.

Hal ini mencegah server mencoba mengakses `localStorage` (untuk token JWT) yang tidak tersedia di lingkungan server Node.js.

```typescript
ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        this.loadUsers();
    }
}
```
