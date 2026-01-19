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

### C. Membuat Komponen Tampilan (Plafond List - Corporate Card View)

File: `src/app/features/plafonds/plafond-list.component.ts`
Komponen ini menggunakan strategi **Grid View** dengan tampilan kartu yang profesional ("Corporate Look").

**Fitur Utama:**

1.  **SSR Handling**: Menggunakan `isPlatformBrowser` untuk memastikan API call hanya berjalan di browser.
2.  **Corporate Card Design**: Menampilkan data dalam bentuk kartu dengan _visual hierarchy_ yang jelas (Header, Metrics, Footer).
3.  **Dynamic Styling**: Menggunakan helper helper methods untuk menentukan warna aksen dan ikon berdasarkan nama paket (Platinum, Gold, dll).

```typescript
// Logic Penanganan Create
submitPlafond(): void {
  // ...
  this.plafondService.createPlafond(request);
  // ...
}

// Helper Methods untuk Styling Dinamis
getAccentClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('platinum')) return 'accent-platinum';
    if (lowerName.includes('gold')) return 'accent-gold';
    if (lowerName.includes('silver')) return 'accent-silver';
    if (lowerName.includes('bronze')) return 'accent-bronze';
    return 'accent-default';
}

getIconClass(name: string): string {
    // Logic similar to accent class for icon selection
    // ...
}
```

File: `src/app/features/plafonds/plafond-list.component.html`
Template menggunakan Grid CSS untuk layout responsif tanpa kontrol paginasi visual (clean view).

- **Edit Button**: Ditambahkan pada Header Card.
- **Reusable Modal**: Title dan Button text berubah dinamis ("Add" vs "Edit"/"Update").

```html
<!-- Tombol Edit pada Card -->
<div class="card-header-corp">
  ...
  <button class="btn-icon-small edit" (click)="openEditModal(plafond)">
    <span class="material-icons-outlined">edit</span>
  </button>
</div>

<!-- Dynamic Modal Header -->
<h3>{{ editingPlafondId() ? 'Edit Plafond' : 'Add New Plafond' }}</h3>

<!-- Grid Container -->
<div class="plafond-grid-container">
  <div class="plafond-grid">
    @for (plafond of filteredPlafonds(); track plafond.id) {
    <div class="plafond-card-corporate">
      <!-- Accent Line -->
      <div class="card-accent" [ngClass]="getAccentClass(plafond.name)"></div>

      <div class="card-main">
        <!-- Header with Icon & Title -->
        <div class="card-header-corp">
          <div class="header-icon-wrapper" [ngClass]="getIconClass(plafond.name)">
            <span class="material-icons-outlined">workspace_premium</span>
          </div>
          <div class="header-text">
            <h3 class="corp-title">{{ plafond.name }}</h3>
            <span class="corp-subtitle">{{ plafond.description }}</span>
          </div>
        </div>

        <!-- Metrics Box (Limit & Interest) -->
        <div class="metrics-container">
          <div class="metric-box">
            <label>Maximum Limit</label>
            <div class="value">{{ plafond.maxAmount | currency:'IDR':'IDR ':'1.0-0' }}</div>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-box">
            <label>Interest Rate</label>
            <div class="value text-highlight">{{ plafond.interestRate }}%</div>
          </div>
        </div>
      </div>
    </div>
    }
  </div>
</div>
```

File: `src/app/features/plafonds/plafond-list.component.css`
Menambahkan styling khusus untuk kartu "Corporate" dengan shadow halus dan transisi.

```css
/* Corporate Card Styles */
.plafond-card-corporate {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  /* ... transition ... */
}

.plafond-card-corporate:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.1);
}

/* Color Themes (Accent & Icons) */
.accent-gold {
  background: linear-gradient(90deg, #fef3c7, #fbbf24);
}
.icon-gold {
  background: #fffbeb;
  color: #d97706;
}

/* ... Silver, Bronze, Platinum themes ... */
```

### D. Implementasi Delete Plafond

Kita menambahkan fitur hapus plafond (`DELETE /api/plafonds/{id}`) menggunakan konfirmasi sederhana `window.confirm`.

**1. Service Helper (`plafond.service.ts`):**

```typescript
deletePlafond(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
}
```

**2. Component Logic (`plafond-list.component.ts`):**

```typescript
deletePlafond(id: number, name: string): void {
  // Simple & Fast Confirmation
  if (confirm(`Are you sure you want to delete plafond "${name}"? This action cannot be undone.`)) {
    this.isLoading.set(true);
    this.plafondService.deletePlafond(id).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Plafond berhasil dihapus');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadPlafonds();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Gagal menghapus plafond');
        setTimeout(() => this.errorMessage.set(''), 5000);
        this.isLoading.set(false);
      }
    });
  }
}
```

**3. UI Button (`plafond-list.component.html`):**

```html
<button
  class="btn-icon-small delete"
  (click)="deletePlafond(plafond.id, plafond.name)"
  title="Delete"
>
  <span class="material-icons-outlined">delete</span>
</button>
```

### E. Konfigurasi Routing

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
