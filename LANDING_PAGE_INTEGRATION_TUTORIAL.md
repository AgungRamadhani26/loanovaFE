# Tutorial Integrasi Data Plafond ke Landing Page

Dokumen ini menjelaskan bagaimana Landing Page (`landing-page.component.ts` dan `.html`) telah diintegrasikan dengan API Publik Plafond untuk menampilkan paket pinjaman secara dinamis, menggantikan data hardcode.

## 1. Arsitektur Integrasi

### A. Backend Endpoint

Endpoint publik yang digunakan:

- **URL**: `GET /api/plafonds/public`
- **Tujuan**: Mengambil daftar active plafonds tanpa autentikasi (karena landing page dapat diakses publik).
- **Struktur Response**: Array of objects `{ id, name, description, maxAmount, interestRate, tenorMin, tenorMax, ... }`.

### B. Frontend Service (`plafond.service.ts`)

Method `getPublicPlafonds()` ditambahkan untuk melakukan request HTTP GET ke endpoint tersebut.

```typescript
// plafond.service.ts
getPublicPlafonds(): Observable<Plafond[]> {
    return this.http.get<Plafond[]>(`${this.apiUrl}/public`);
}
```

### C. Landing Page Logic (`landing-page.component.ts`)

Component menggunakan Angular Signals untuk state management yang reaktif.

1.  **State Initialization**:

    ```typescript
    public plafonds = signal<Plafond[]>([]);
    public isLoadingPlafonds = signal<boolean>(true);
    ```

2.  **Data Fetching**:
    Method `loadPublicPlafonds()` dipanggil pada `ngOnInit`.

    ```typescript
    private loadPublicPlafonds(): void {
        this.isLoadingPlafonds.set(true);
        this.plafondService.getPublicPlafonds().subscribe({
            next: (data) => {
                this.plafonds.set(data);
                this.isLoadingPlafonds.set(false);
            },
           // error handling...
        });
    }
    ```

3.  **UI Helpers**:
    - `isPopular(name: string)`: Menentukan apakah paket ditampilkan sebagai "Populer" (style Silver/Highlight). Logic saat ini mengecek string "silver".
    - `getThemeColor(name: string)`: Menentukan skema warna (Amber untuk Bronze/Gold, Purple untuk Platinum, dsb).
    - `getPlafondIcon(name: string)`: Mengembalikan emoji yang sesuai (🥉, 🥈, 🥇, 💎) berdasarkan nama paket.

## 2. Struktur Tampilan (HTML)

Data ditampilkan menggunakan control flow block `@for`:

```html
@for (plafond of plafonds(); track plafond.id) { @if (isPopular(plafond.name)) {
<!-- Tampilan Card Populer (Border Biru, Scale effect) -->
} @else {
<!-- Tampilan Card Standard (Warna dinamis menggunakan ngClass) -->
} }
```

Informasi yang ditampilkan secara dinamis meliputi:

- **Nama Paket**: `{{ plafond.name }}`
- **Deskripsi**: `{{ plafond.description }}`
- **Limit**: `{{ plafond.maxAmount }}` (Format Currency IDR)
- **Bunga**: `{{ plafond.interestRate }}`%
- **Tenor**: `{{ plafond.tenorMin }} - {{ plafond.tenorMax }} Bulan`

## 3. Cara Verifikasi

1.  Pastikan Backend Spring Boot berjalan.
2.  Buka Frontend (biasanya `localhost:4200`).
3.  Perhatikan bagian "Pilihan Paket Pinjaman".
4.  Data yang muncul harus sesuai dengan apa yang ada di database backend (table `plafonds`).
5.  Ubah data di backend (misal via Postman atau Admin Dashboard), refresh landing page, perubahan harus terefleksi.

## 4. Troubleshooting

- **Data tidak muncul (Loading terus)**: Cek Network Tab di Developer Tools. Pastikan request ke `/api/plafonds/public` sukses (Status 200).
- **Icon salah**: Periksa method `getPlafondIcon` di `landing-page.component.ts`. Pastikan logic pencocokan string nama plafond sesuai dengan data di DB.
- **Warna salah**: Periksa method `getThemeColor`.
