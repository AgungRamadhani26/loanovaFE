# Tutorial Implementasi Menu Plafond (Frontend)

Dokumen ini menjelaskan langkah-langkah implementasi tampilan menu **Daftar Plafond** pada aplikasi web Loanova (Frontend).

## 1. Persiapan Backend (Konteks)

Backend sudah menyediakan endpoint API untuk mengambil daftar plafond.

- **Endpoint**: `GET /api/plafonds` (Protected)
- **Endpoint Public**: `GET /api/plafonds/public`
- **Response Format**:
  ```json
  {
      "success": true,
      "message": "Berhasil mengambil daftar plafond",
      "data": [ ...list of plafonds... ],
      "code": 200,
      "timestamp": "..."
  }
  ```

## 2. Implementasi Frontend (Angular)

### A. Membuat Model Response

File: `src/app/core/models/response/plafond-response.model.ts`
Model ini mendefinisikan struktur data plafond yang diterima dari API.

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

### B. Membuat Service Integration

File: `src/app/core/services/plafond.service.ts`
Service ini bertanggung jawab menghubungi API backend. Token autentikasi otomatis ditangani oleh `AuthInterceptor`.

```typescript
@Injectable({ providedIn: 'root' })
export class PlafondService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/plafonds'; // Proxy akan mengarahkan ke backend

  getAllPlafonds(): Observable<ApiResponse<PlafondResponse[]>> {
    return this.http.get<ApiResponse<PlafondResponse[]>>(this.API_URL);
  }
}
```

### C. Membuat Komponen Tampilan (Plafond List)

File: `src/app/features/plafonds/plafond-list.component.ts`
Komponen ini diinisialisasi dengan struktur table yang mirip dengan menu Branch:

- Menggunakan `CommonModule` dan `FormsModule`
- State Management dengan Angular Signals (`plafonds`, `searchQuery`)
- Dilengkapi Pagination dan Search Filter.
- **Improved Search**: Pencarian mencakup nama, deskripsi, nominal, bunga, dan tenor.
- **SSR Handling**: Menggunakan `isPlatformBrowser` untuk mencegah error 401 saat server-side rendering.

File: `src/app/features/plafonds/plafond-list.component.html`
Menggunakan **Table Layout** untuk keseragaman UI dengan halaman manajemen lainnya:

- Header dengan Title
- Summary Card (Total Plafonds)
- Search Box
- Table Data (Nama, Deskripsi, Max Pinjaman, Bunga, Tenor)
- **Dynamic Row Styling**: Memberikan warna latar berbeda sesuai jenis plafond (Gold/Silver/Bronze).

File: `src/app/features/plafonds/plafond-list.component.css`
Menggunakan styling yang seragam dengan Branch List, ditambah CSS khusus `.row-gold`, `.row-silver`, `.row-bronze`.

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
