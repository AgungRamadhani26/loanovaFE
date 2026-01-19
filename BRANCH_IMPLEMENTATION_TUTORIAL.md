# Tutorial Implementasi Fitur Manajemen Cabang (Branch Management)

Dokumen ini menjelaskan implementasi fitur **Daftar Cabang** (Branch List) yang mengambil data dari API backend `/api/branches`. Fitur ini mencakup Service, Model, Component dengan Pagination & Search, serta integrasi Sidebar Menu berdasarkan Permission.

---

## DAFTAR ISI

1.  **Backend Integration** (Model & Service)
2.  **Display Logic** (Component, Signal, Pagination)
3.  **UI Template** (HTML & CSS)
4.  **Menu Access** (Sidebar & Permission)
5.  **Hasil Akhir** (Output API)

---

## 1. Backend Integration

### A. Data Model (`branch-response.model.ts`)

Kita mendefinisikan bentuk data sesuai dengan JSON yang dikembalikan oleh backend.

```typescript
export interface BranchData {
  id: number;
  branchCode: string;
  branchName: string;
  address: string;
}
```

### B. Branch Service (`branch.service.ts`)

Service ini bertugas "menelpon" backend. Header `Authorization` tidak perlu ditulis manual karena sudah otomatis ditempel oleh `auth.interceptor.ts`.

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { BranchData } from '../models/response/branch-response.model';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private http = inject(HttpClient);
  // Proxy config mengarahkan /api/branches ke http://localhost:9091/api/branches
  private readonly API_URL = '/api/branches';

  /**
   * Mengambil daftar cabang dari database.
   * Response: { success: true, data: [ ...branches... ] }
   */
  getAllBranches(): Observable<ApiResponse<BranchData[]>> {
    return this.http.get<ApiResponse<BranchData[]>>(this.API_URL);
  }
}
```

---

## 2. Display Logic (`branch-list.component.ts`)

Komponen ini menggunakan **Angular Signals** untuk performa tinggi dan kode yang lebih reaktif.

- **Pemuatan Data (`loadBranches`)**: Dipanggil saat `ngOnInit`.
- **Pencarian (`filteredBranches`)**: Computed signal yang otomatis memfilter data saat user mengetik.
- **Pagination (`paginatedBranches`)**: Memotong daftar data sesuai halaman aktif.

```typescript
import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../core/services/branch.service';
import { BranchData } from '../../core/models/response/branch-response.model';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.css',
})
export class BranchListComponent implements OnInit {
  private branchService = inject(BranchService);
  private platformId = inject(PLATFORM_ID);

  // STATE SIGNALS
  branches = signal<BranchData[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // COMPUTED SIGNALS (LOGIKA FILTER & PAGE)
  filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branches();

    // Cari status di kode, nama, atau alamat
    return this.branches().filter((b) =>
      (b.branchCode + b.branchName + b.address).toLowerCase().includes(query),
    );
  });

  paginatedBranches = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredBranches().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredBranches().length / this.pageSize()) || 1);

  ngOnInit(): void {
    // Cek SSR agar tidak error di server
    if (isPlatformBrowser(this.platformId)) {
      this.loadBranches();
    }
  }

  loadBranches(): void {
    this.isLoading.set(true);
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success) this.branches.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      },
    });
  }

  // Helper navigasi
  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((c) => c + 1);
  }
  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update((c) => c - 1);
  }
}
```

---

## 3. Menu Access (`sidebar.component.ts`)

Sidebar hanya menampilkan menu jika user memiliki permission `BRANCH:READ` (sesuai backend).

```typescript
{
    label: 'Branch',
    path: '/admin/branches',
    icon: 'business',
    permissions: ['BRANCH:READ'] // << Kunci Akses
},
```

---

## 4. Contoh Data API

Berikut adalah format data yang diterima dari backend dan berhasil ditampilkan di tabel:

```json
{
  "success": true,
  "message": "Berhasil mengambil daftar cabang",
  "data": [
    {
      "id": 1,
      "branchCode": "SUMUT01",
      "branchName": "Medan Area",
      "address": "JL Sisinga Mangaraja No 46"
    },
    {
      "id": 2,
      "branchCode": "JKT01",
      "branchName": "Jakarta Pusat",
      "address": "JL. Otto Iskansar Dinata"
    }
    // ... dst
  ],
  "code": 200,
  "timestamp": "2026-01-18T11:22:06.556Z"
}
```

---

_Dokumen ini dibuat otomatis sebagai referensi implementasi fitur Branch._

---

## 5. Implementasi Create Branch (POST) & UI/UX Enhancement

Fitur ini memungkinkan pembuatan cabang baru melalui antarmuka **Modal Popup** yang responsif, dengan penanganan error validasi yang detail dan feedback kesuksesan berupa **Toast Notification**.

### A. Alur Data (Data Flow)

1.  User klik **"New Branch"** → Modal terbuka (`isModalOpen = true`).
2.  User isi form → Data di-binding ke `newBranch` object.
3.  User klik **"Save"** → Service mengirim POST ke `/api/branches`.
4.  **Skenario Sukses (201)**:
    - List branch di-refresh (`loadBranches`).
    - Modal ditutup.
    - Muncul notifikasi hijau ("Success Toast") di pojok kanan atas.
5.  **Skenario Gagal (400/500)**:
    - Jika Validasi Gagal (400): Field input yang salah menjadi merah dan pesan error muncul di bawahnya.
    - Jika Server Error (500): Pesan error umum muncul di atas form.

### B. Struktur Kode Frontend

#### 1. Model Data (`branch-request.model.ts`)

DTO (Data Transfer Object) untuk payload pembuatan cabang.

```typescript
export interface BranchRequest {
  branchCode: string; // Validasi backend: @NotBlank, Unique
  branchName: string; // Validasi backend: @NotBlank
  address: string; // Validasi backend: @NotBlank
}
```

#### 2. Service Logic (`branch.service.ts`)

```typescript
createBranch(data: BranchRequest): Observable<ApiResponse<BranchData>> {
    // Mengirim POST request ke backend
    // Backend akan memvalidasi data dan mengembalikan 201 atau 400
    return this.http.post<ApiResponse<BranchData>>(this.API_URL, data);
}
```

#### 3. Component Logic (`branch-list.component.ts`)

Menggunakan **Signals** untuk state management yang reaktif dan efisien.

**State Definition:**

State dipisahkan antara Add dan Edit untuk keterbacaan kode (Separation of Concerns).

```typescript
// Modal State
isAddModalOpen = signal(false);
isEditModalOpen = signal(false);
editingBranchId = signal<number | null>(null);

// Forms Data
addBranchForm: BranchRequest = {
  /* ... */
};
editBranchForm: BranchRequest = {
  /* ... */
};

// Shared State
isSubmitting = signal(false);
successMessage = signal<string | null>(null);
```

**Submission Handler (Create):**

```typescript
submitAddBranch(): void {
    this.isSubmitting.set(true);
    // ... reset errors ...

    this.branchService.createBranch(this.addBranchForm).subscribe({
        next: (response) => {
            if (response.success) {
                this.loadBranches();
                this.closeAddModal(); // Tutup modal add
                // Show Toast
                this.successMessage.set(response.message || 'Success!');
            }
            this.isSubmitting.set(false);
        },
        error: (err) => this.handleError(err) // Reusable error handler
    });
}
```

#### 4. UI Template (`branch-list.component.html`)

**Separated Modals:**
Kita menggunakan dua blok `@if` terpisah untuk modal Add dan Edit agar template lebih bersih.

```html
<!-- ADD MODAL -->
@if (isAddModalOpen()) {
<div class="modal-overlay">... Form binding ke addBranchForm ...</div>
}

<!-- EDIT MODAL -->
@if (isEditModalOpen()) {
<div class="modal-overlay">... Form binding ke editBranchForm ...</div>
}
```

### C. Styling & UX Refinement (`branch-list.component.css`)

Peningkatan desain dilakukan untuk pengalaman pengguna yang lebih baik:

1.  **Compact Modal**: Ukuran modal dibatasi `max-width: 400px` agar fokus dan tidak terlalu lebar.
2.  **Modern Look**: Menggunakan `border-radius: 16px` dan shadow yang halus (`box-shadow`).
3.  **Animasi**:
    - `fadeIn` untuk overlay background.
    - `slideUp` + `scale` effect untuk konten modal agar terkesan "pop".
4.  **Toast Notification**: Melayang di kanan atas (`fixed`, `top: 24px`, `right: 24px`) dengan animasi masuk dari kanan.

```css
/* Styling Kunci */
.modal-container {
  width: 90%;
  max-width: 400px; /* Ukuran compact */
  border-radius: 16px; /* Sudut membulat modern */
  animation: slideUp 0.3s ease-out;
}

.success-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: #10b981; /* Hijau modern */
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

_Dokumentasi ini mencakup implementasi List, Pagination, Search, Create, Validation Error Handling, dan UI Polish._

---

## 6. Implementasi Edit Branch (PUT)

Fitur ini memungkinkan user untuk mengubah data cabang yang sudah ada. Demi alasan _Clean Code_, logika Edit dipisahkan sepenuhnya dari Create.

### A. Update Branch Service

Menambahkan method `updateBranch` yang melakukan HTTP PUT ke endpoint `/api/branches/{id}`.

```typescript
/**
 * Memperbarui data cabang
 * Endpoint: PUT /api/branches/{id}
 */
updateBranch(id: number, data: BranchRequest): Observable<ApiResponse<BranchData>> {
    return this.http.put<ApiResponse<BranchData>>(`${this.API_URL}/${id}`, data);
}
```

### B. Component Logic Update (Separated)

Menambahkan state dan handler khusus untuk Edit agar tidak tercampur dengan Logic Add.

**State Tambahan:**

```typescript
isEditModalOpen = signal(false);
editingBranchId = signal<number | null>(null);
editBranchForm: BranchRequest = {
  /* ... */
};
```

**Handler Edit:**
Ketika tombol edit diklik, form diisi awal (pre-fill) dengan data yang ada.

```typescript
openEditModal(branch: BranchData): void {
    // Fill data
    this.editBranchForm = {
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        address: branch.address
    };
    this.editingBranchId.set(branch.id);
    this.isEditModalOpen.set(true);
}
```

**Logic Submit (Update):**

```typescript
submitEditBranch(): void {
    // ... validation state reset ...
    this.branchService.updateBranch(this.editingBranchId()!, this.editBranchForm)
        .subscribe({
            next: (response) => {
                 this.loadBranches();
                 this.closeEditModal();
                 this.successMessage.set(response.message || 'Updated!');
            },
            error: (err) => this.handleError(err)
        });
}
```

**Handling Error 409 (Conflict):**
Jika nama cabang sudah digunakan oleh cabang lain (selain dirinya sendiri), backend akan mengembalikan 409. Error ini ditangani sama dengan error validasi 400 (ditangkap oleh `handleError` yang sama dengan Add).

---

_Dokumentasi diperbarui: Refaktorisasi pemisahan Add & Edit Logic._

### B. Component Logic Update

Menambahkan state untuk melacak mode edit dan ID cabang yang sedang diedit.

**State Tambahan:**

```typescript
isEditMode = signal(false);
editingBranchId = signal<number | null>(null);
```

**Handler Edit:**
Ketika tombol edit diklik, form diisi dengan data baris tersebut dan mode diubah ke Edit.

```typescript
editBranch(branch: BranchData): void {
    // Populate form
    this.newBranch = {
        branchCode: branch.branchCode, // Bisa diedit
        branchName: branch.branchName,
        address: branch.address
    };

    // Set Edit Mode
    this.isEditMode.set(true);
    this.editingBranchId.set(branch.id);

    // Reset Error & Buka Modal
    this.formError.set(null);
    this.fieldErrors.set({});
    this.isModalOpen.set(true);
}
```

**Logic Submit:**
Memilih method service berdasarkan `isEditMode`.

```typescript
const request$ = this.isEditMode()
  ? this.branchService.updateBranch(this.editingBranchId()!, this.newBranch)
  : this.branchService.createBranch(this.newBranch);

request$.subscribe({
  /* handle response */
});
```

**Handling Error 409 (Conflict):**
Jika nama cabang sudah digunakan oleh cabang lain (selain dirinya sendiri), backend akan mengembalikan 409. Error ini ditangani sama dengan error validasi 400 atau error umum, tergantung struktur response backend.

### C. Dynamic UI (Template)

Judul modal dan tombol submit menyesuaikan dengan mode.

```html
<!-- Dynamic Header -->
<h3>{{ isEditMode() ? 'Edit Branch' : 'Add New Branch' }}</h3>

<!-- Dynamic Button -->
<button type="submit" class="btn-primary">
  {{ isEditMode() ? 'Update Branch' : 'Save Branch' }}
</button>
```

---

## 4. Implementasi Delete Branch (Fase 3)

Fase ini menambahkan kemampuan untuk menghapus cabang (`DELETE /api/branches/{id}`). Implementasi menggunakan pendekatan **Simple Confirmation** browser native (`window.confirm`) untuk UX yang cepat dan efisien namun tetap aman.

### A. Code Separation (Clean Code)

Kita menggunakan satu method sederhana `deleteBranch` yang mencakup konfirmasi dan pemanggilan API.

### B. Service Update (`branch.service.ts`)

Menambahkan method `deleteBranch`:

```typescript
deleteBranch(id: number): Observable<ApiResponse<void>> {
  return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
}
```

### C. Component Logic (`branch-list.component.ts`)

```typescript
// Delete Handler dengan Native Confirm Dialog
deleteBranch(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete branch "${name}"? This action cannot be undone.`)) {
        this.isLoading.set(true);
        this.branchService.deleteBranch(id).subscribe({
            next: (response) => {
                // Tampilkan pesan sukses sebentar
                this.successMessage.set(response.message || 'Branch deleted successfully');
                setTimeout(() => this.successMessage.set(null), 3000);

                // Refresh tabel
                this.loadBranches();
            },
            error: (error) => {
                // Menangani Error 400 (Business Rule Violation)
                // Contoh: "Cannot delete branch because it has active users"
                if (error.error && error.error.message) {
                    this.error.set(error.error.message);
                } else {
                    this.error.set('Failed to delete branch.');
                }
                setTimeout(() => this.error.set(null), 5000);
                this.isLoading.set(false);
            },
            complete: () => {
               this.isLoading.set(false);
            }
        });
    }
}
```

### D. UI Template (`branch-list.component.html`)

Tombol Delete langsung memanggil method `deleteBranch`:

```html
<button
  class="btn-action btn-delete"
  (click)="deleteBranch(branch.id, branch.branchName)"
  title="Delete Branch"
>
  <span class="material-icons-outlined">delete</span>
</button>
```

> **Note:** Kita tidak lagi menggunakan Custom Modal untuk delete untuk menyederhanakan kode dan user flow.
