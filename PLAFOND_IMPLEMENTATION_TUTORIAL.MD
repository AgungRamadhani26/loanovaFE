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
Komponen ini menggunakan strategi **Client-Side Filter & Pagination** dengan dukungan **Server-Side Rendering (SSR)**.

**Fitur Utama:**

1.  **SSR Handling**: Menggunakan `isPlatformBrowser` untuk memastikan API call hanya berjalan di browser (menghindari error akses `localStorage` di server).
2.  **Advanced Search logic**: Menggunakan Regex untuk menghapus simbol mata uang/persen saat pencarian angka.
3.  **Row Styling Logic**: Method `getRowClass` untuk menentukan warna baris berdasarkan nama paket.

```typescript
// Implementasi Search Logic dengan Pembersihan Simbol
filteredPlafonds = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    return this.plafonds().filter(p => {
        // Membersihkan format angka (misal "5.5%" -> "5.5") untuk pencarian yang akurat
        const cleanRate = p.interestRate.toString();
        const cleanAmount = p.maxAmount.toString();

        const searchStr = `${p.name} ${p.description} ${cleanAmount} ${cleanRate} ${p.tenorMin}-${p.tenorMax}`.toLowerCase();

        // Logic search: Cocokkan query yang sudah dibersihkan simbolnya
        // Contoh: User ketik "5.5" akan match dengan "5.5%"
        const cleanQuery = query.replace(/[Rp,%]/g, '').trim();
        return searchStr.includes(query) || searchStr.includes(cleanQuery);
    });
});

// Implementasi SSR Handling
ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        this.loadPlafonds();
    }
}
```

File: `src/app/features/plafonds/plafond-list.component.html`
Template menggunakan `[ngClass]` untuk styling dinamis dan pipa `currency` untuk format Rupiah.

```html
<!-- Contoh Penggunaan Dynamic Class & Currency Pipe -->
<tr [ngClass]="getRowClass(plafond.name)" class="hover:bg-opacity-80 transition-colors">
  <!-- ... -->
  <td class="font-medium text-slate-700">
    {{ plafond.maxAmount | currency:'IDR':'symbol':'1.0-0' }}
  </td>
</tr>
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
