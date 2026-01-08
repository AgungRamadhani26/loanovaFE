# LoanNova FE - Best Practice & Struktur Proyek Angular v21

Dokumen ini merangkum arsitektur terbaik untuk aplikasi LoanNova Front End menggunakan **Angular v21**. Fokus utama adalah pada performa modern (Signals), keamanan tipe data (DTO), dan manajemen multi-role yang aman.

## Strategi yang Diusulkan

### 1. Struktur Folder (Advanced Feature-Based)
Angular v21 sangat mengutamakan *standalone components*. Struktur ini dirancang agar modular dan mudah dikembangkan.

```text
src/app/
├── core/                   # Sistem Singleton (Global)
│   ├── auth/               # State JWT & Sesi (Signals)
│   ├── guards/             # Guard RBAC & Auth (Functional)
│   ├── interceptors/       # Interceptor HTTP (Functional)
│   ├── services/           # Provider API Global
│   └── models/             # DTO Global & Tipe Domain (Interfaces)
├── shared/                 # Komponen UI Umum (Berbasis Signals)
│   ├── components/         # UI Atomik (Card, Input, Modal)
│   ├── directives/         # Logika perilaku kustom
│   └── pipes/              # Format data
├── features/               # Fitur bisnis (Lazy-loaded)
│   ├── dashboard/          # Dashboard dinamis (Role-aware)
│   ├── loan-application/   # Alur pengajuan & pelacakan pinjaman
│   └── admin-panel/        # Manajemen User & Pinjaman
├── layout/                 # Pembungkus struktur utama (Navbar/Sidebar)
└── app.routes.ts           # Definisi rute dengan modern guards
```

### 2. Manajemen Multi-Role (Signals & RBAC)
Pada Angular v21, kita menggunakan **Signals** sebagai sumber kebenaran utama untuk state pengguna.

#### Role-Based Access Control (RBAC):
- **User Signal**: Signal global `computed` di `AuthService` memberikan akses reaktif ke role pengguna.
- **Functional Guards**: Fungsi ringan yang menggunakan `inject()` untuk mengecek role sebelum rute diakses.
- **Logika Template**: Menggunakan sintaks `@if` (modern control flow) untuk menampilkan UI berdasarkan role secara kondisional.

### 3. Integrasi API & Pola DTO
Sesuai dengan best practice di backend Java, kita menggunakan **TypeScript Interfaces** yang ketat untuk objek Request/Response.

#### Best Practice:
1. **TypeScript Interfaces (DTO)**: Pastikan pemetaan 1:1 dengan model di backend Java.
2. **Signal-based Services**: Menggunakan `resource` (fitur terbaru Angular) untuk pengambilan data yang lebih sederhana dibandingkan RxJS.
3. **Functional Interceptors**: Middleware ringan untuk menyisipkan header `Authorization: Bearer <token>` secara otomatis.

### 4. Detail Implementasi

#### Contoh DTO (Interface)
```typescript
// src/app/core/models/loan.model.ts
export interface LoanProposalDTO {
  uuid: string;
  proposedAmount: number;
  periodMonths: number;
  interestRate: number;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
}
```

#### Contoh Service (dengan Signals)
```typescript
// src/app/features/loan/services/loan.service.ts
@Injectable({ providedIn: 'root' })
export class LoanService {
  private http = inject(HttpClient);
  
  // Contoh pengambilan data menggunakan pola modern
  getLoanDetails(id: string) {
    return this.http.get<LoanProposalDTO>(`/api/loans/${id}`);
  }
}
```

## Review Pengguna Diperlukan
> [!IMPORTANT]
> - **Pendekatan Signal-First**: Apakah Anda nyaman menggunakan `signal()`, `computed()`, dan `effect()` sebagai pengganti RxJS yang kompleks?
> - **Server-Side Rendering (SSR)**: File `package.json` Anda menunjukkan penggunaan `@angular/ssr`. Kami akan memastikan semua guard dan service kompatibel dengan SSR.

## Rencana Verifikasi

### Verifikasi Manual
1. Pastikan struktur folder memisahkan fitur Admin dan Customer dengan jelas.
2. Validasi definisi tipe di `src/app/core/models` agar sesuai dengan DTO di Java.
3. Uji RBAC dengan mencoba mengakses rute Admin menggunakan token role Customer.
