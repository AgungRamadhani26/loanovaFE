# Tutorial Implementasi Menu Plafond (Frontend)

Dokumen ini menjelaskan langkah-langkah implementasi tampilan menu **Daftar Plafond** pada aplikasi web Loanova (Frontend).

## 1. Persiapan Backend (Konteks)

Backend menyediakan endpoint API untuk manajemen plafond (CRUD).

- **GET Endpoint**: `GET /api/plafonds` (Protected: `PLAFOND:READ`)
- **POST Endpoint**: `POST /api/plafonds` (Protected: `PLAFOND:CREATE`)
- **Validation Error (400)**: Mengembalikan object `data.errors` jika validasi input gagal.
- **Conflict Error (409)**: Mengembalikan error jika nama plafond sudah ada.

## 2. Implementasi Frontend (Angular)

### A. Membuat Model Data

File: `src/app/core/models/response/plafond-response.model.ts`
Model untuk data yang diterima dari API (READ).

```typescript
export interface PlafondResponse {
  id: number;
  name: string;
  description: string;
  maxAmount: number;
  interestRate: number;
  tenorMin: number;
  tenorMax: number;
}
```

File: `src/app/core/models/request/plafond-request.model.ts`
Model untuk data yang dikirim saat membuat plafond baru (CREATE).

```typescript
export interface PlafondRequest {
  name: string;
  description: string;
  maxAmount: number; // BigDecimal di Backend
  interestRate: number; // Float/Double
  tenorMin: number; // Integer
  tenorMax: number; // Integer
}
```

### B. Membuat Service Integration

File: `src/app/core/services/plafond.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PlafondService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/plafonds';

  getAllPlafonds(): Observable<ApiResponse<PlafondResponse[]>> {
    return this.http.get<ApiResponse<PlafondResponse[]>>(this.API_URL);
  }

  createPlafond(request: PlafondRequest): Observable<ApiResponse<PlafondResponse>> {
    return this.http.post<ApiResponse<PlafondResponse>>(this.API_URL, request);
  }
}
```

### C. Membuat Komponen Tampilan (Plafond List)

File: `src/app/features/plafonds/plafond-list.component.ts`
Komponen ini menggunakan strategi **Client-Side Filter & Pagination** dengan dukungan **Server-Side Rendering (SSR)** dan **Modal Form** untuk aksi Create.

**Fitur Utama:**

1.  **SSR Handling**: Menggunakan `isPlatformBrowser` untuk memastikan API call hanya berjalan di browser.
2.  **Advanced Search logic**: Menggunakan Regex untuk mixed search (Text & Number).
3.  **Create Action**: Modal form dengan validasi error dari backend status 400 & 409.

```typescript
// Implementasi Create Action dengan Validasi
submitPlafond(): void {
    this.plafondService.createPlafond(this.newPlafond()).subscribe({
        error: (err) => {
            if (err.status === 400) {
                // Mapping field errors dari Backend
                this.validationErrors.set(err.error.data.errors);
            } else if (err.status === 409) {
                // Handling duplicate name
                this.validationErrors.set({ name: err.error.message });
            }
        }
    });
}
```

File: `src/app/features/plafonds/plafond-list.component.html`
Template menggunakan:

- `[ngClass]` untuk styling dinamis baris tabel.
- Modal dengan backdrop blur untuk form input.
- `[(ngModel)]` binding untuk input form.

```html
<!-- Contoh Modal Input dengan Error Message -->
<div class="form-group">
  <label>Plafond Name</label>
  <input [(ngModel)]="newPlafond().name" [class.border-red-500]="validationErrors()['name']" />
  @if (validationErrors()['name']) {
  <p class="text-red-500">{{ validationErrors()['name'] }}</p>
  }
</div>
```

File: `src/app/features/plafonds/plafond-list.component.css`
Menambahkan styling khusus untuk membedakan jenis paket pinjaman secara visual.

```css
/* Styling Baris Tabel Berdasarkan Paket */
.row-gold {
  background-color: #fffbeb !important; /* Amber-50 */
}
.row-gold:hover {
  background-color: #fef3c7 !important; /* Amber-100 */
}

.row-silver {
  background-color: #f8fafc !important; /* Slate-50 */
}
.row-silver:hover {
  background-color: #f1f5f9 !important; /* Slate-100 */
}

.row-bronze {
  background-color: #fff7ed !important; /* Orange-50 */
}
.row-bronze:hover {
  background-color: #ffedd5 !important; /* Orange-100 */
}
```

### D. Konfigurasi Routing

File: `src/app/app.routes.ts`
Menambahkan rute baru di bawah layout admin agar bisa diakses melalui URL `/admin/plafond`.

```typescript
{ path: 'plafond', component: PlafondListComponent },
```

### E. Integrasi Sidebar

File: `src/app/layout/admin/sidebar/sidebar.component.ts`
Menu sudah dikonfigurasi sebelumnya dengan permission `PLAFOND:READ`.

```typescript
{
    label: 'Plafond',
    path: '/admin/plafond',
    icon: 'monetization_on',
    permissions: ['PLAFOND:READ']
}
```

## 3. Hasil Akhir

Sekarang pengguna dengan role/permission yang sesuai (Superadmin atau User dengan `PLAFOND:READ`) dapat:

1. Login ke aplikasi.
2. Melihat menu "Plafond" di sidebar.
3. Mengklik menu tersebut dan melihat daftar produk pinjaman (Plafond) dalam bentuk kartu yang informatif.

## Catatan

- Pastikan backend (`loanova`) berjalan di port default (biasanya 8080 atau 9091 sesuai konfigurasi).
- Proxy `proxy.conf.json` di frontend harus mengarah ke port backend yang benar.
