# 🏢 Tutorial Implementasi Branch Management - Frontend

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Struktur Folder](#struktur-folder)
3. [Backend API Endpoint](#backend-api-endpoint)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Tutorial ini menjelaskan implementasi lengkap **Branch Management** di frontend Angular v21 untuk menampilkan daftar cabang (branches) dari backend Loanova API.

### Fitur yang Diimplementasikan:

- ✅ Menampilkan daftar cabang dalam bentuk tabel
- ✅ Search/Filter cabang (berdasarkan kode, nama, alamat)
- ✅ Pagination (navigasi halaman)
- ✅ Loading state
- ✅ Empty state
- ✅ Responsive design
- ✅ Angular Signals (State Management)

### Tech Stack:

- **Framework**: Angular 21 (Standalone Components)
- **State Management**: Angular Signals
- **HTTP**: HttpClient + RxJS
- **Styling**: Custom CSS (Modern Design)
- **Icons**: Material Icons

---

## 📁 Struktur Folder

Berikut adalah struktur file yang dibuat untuk fitur Branch Management:

```
loanovafe/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   └── response/
│   │   │   │       └── branch-response.model.ts     ← Model TypeScript
│   │   │   ├── services/
│   │   │   │   └── branch.service.ts                ← Service untuk API calls
│   │   ├── features/
│   │   │   └── branches/
│   │   │       ├── branch-list.component.ts         ← Component logic
│   │   │       ├── branch-list.component.html       ← Template HTML
│   │   │       └── branch-list.component.css        ← Styling
│   │   ├── app.routes.ts                            ← Update routing
```

---

## 🔌 Backend API Endpoint

### Endpoint Information

```
URL: http://localhost:9091/api/branches
Method: GET
Authorization: Bearer Token (Required)
```

### Request Headers

```bash
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBZ3VuZzI2MTFAIiwiaWF0IjoxNzY4MzgwNzI3LCJleHAiOjE3NjgzODE2Mjd9.mdKHTgFiDhjHAAppW_KnHc0bC2vPT33fWwMAd_wlsixAY0S_voLxPezmrhdjZGV63i1U4udbA38RWSFjXtofMw
```

### Response Structure

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
  ],
  "code": 200,
  "timestamp": "2026-01-14T08:52:32.443571300Z"
}
```

---

## 🚀 Step-by-Step Implementation

### Step 1: Buat Model TypeScript

**File**: `src/app/core/models/response/branch-response.model.ts`

```typescript
/**
 * Model untuk data cabang (Branch) sesuai dengan response dari backend.
 * Mapping dari BranchResponse.java di backend.
 */
export interface BranchData {
  id: number;
  branchCode: string;
  branchName: string;
  address: string;
}
```

**Penjelasan**:

- Interface `BranchData` merepresentasikan struktur data branch dari backend
- Property disesuaikan dengan response API (camelCase untuk TypeScript)
- Diletakkan di folder `core/models/response` karena digunakan di berbagai komponen

---

### Step 2: Buat Service untuk API Calls

**File**: `src/app/core/services/branch.service.ts`

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
  private readonly API_URL = '/api/branches';

  getAllBranches(): Observable<ApiResponse<BranchData[]>> {
    return this.http.get<ApiResponse<BranchData[]>>(this.API_URL);
  }
}
```

**Penjelasan**:

- `@Injectable({ providedIn: 'root' })`: Service adalah singleton (satu instance di seluruh aplikasi)
- `inject(HttpClient)`: Modern Angular dependency injection
- `API_URL = '/api/branches'`: URL akan di-proxy oleh `proxy.conf.json` ke `http://localhost:9091`
- `getAllBranches()`: Method untuk mengambil semua data branch
- `Observable<ApiResponse<BranchData[]>>`: Return type menggunakan generic ApiResponse dengan array BranchData
- **Authorization**: Token otomatis ditambahkan oleh `auth.interceptor.ts`

---

### Step 3: Buat Component TypeScript

**File**: `src/app/features/branches/branch-list.component.ts`

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
  protected readonly Math = Math;

  // STATE MANAGEMENT (SIGNALS)
  branches = signal<BranchData[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  // COMPUTED PROPERTIES
  filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.branches();

    return this.branches().filter((branch) => {
      const searchStr = `${branch.branchCode} ${branch.branchName} ${branch.address}`.toLowerCase();
      return searchStr.includes(query);
    });
  });

  paginatedBranches = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredBranches().slice(startIndex, endIndex);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredBranches().length / this.pageSize()))
  );

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  showingFrom = computed(() => {
    if (this.filteredBranches().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredBranches().length);
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBranches();
    }
  }

  loadBranches(): void {
    this.isLoading.set(true);
    this.branchService.getAllBranches().subscribe({
      next: (response) => {
        if (response.success) {
          this.branches.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching branches:', err);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
    this.currentPage.set(1);
  }
}
```

**Penjelasan Konsep Angular Signals**:

#### 1. **Signals** (Reactive State)

```typescript
branches = signal<BranchData[]>([]);
```

- Signal adalah "kotak reaktif" yang menyimpan state
- Ketika nilai signal berubah, semua yang bergantung padanya otomatis update
- Cara update: `branches.set(newData)` atau `branches.update(old => [...old, newItem])`
- Cara baca: `branches()` (dengan parentheses)

#### 2. **Computed Signals** (Derived State)

```typescript
filteredBranches = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.branches().filter(branch => ...);
});
```

- Computed signal otomatis re-evaluate ketika dependency-nya berubah
- Dalam contoh di atas, `filteredBranches` akan otomatis update ketika `searchQuery` atau `branches` berubah
- Efficient: Hanya re-compute ketika diperlukan (lazy evaluation)

#### 3. **State Flow**

```
User Input (Search)
    ↓
searchQuery.set(value)
    ↓
filteredBranches (auto re-compute)
    ↓
paginatedBranches (auto re-compute)
    ↓
UI Update (otomatis)
```

---

### Step 4: Buat Template HTML

**File**: `src/app/features/branches/branch-list.component.html`

```html
<div class="branch-management-container">
  <!-- HEADER -->
  <div class="header-section">
    <div class="title-wrapper">
      <h1 class="page-title">Branch Management</h1>
      <p class="page-subtitle">View and manage all branch locations.</p>
    </div>
  </div>

  <!-- STATS CARDS -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon bg-blue-100 text-blue-600">
        <span class="material-icons-outlined">store</span>
      </div>
      <div class="stat-info">
        <span class="stat-value">{{ branches().length }}</span>
        <span class="stat-label">Total Branches</span>
      </div>
    </div>
    <!-- More stat cards... -->
  </div>

  <!-- TABLE -->
  <div class="table-card">
    <div class="table-controls">
      <div class="search-box">
        <span class="material-icons-outlined">search</span>
        <input
          type="text"
          placeholder="Search..."
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearch($event)"
        />
      </div>
    </div>

    @if (isLoading()) {
    <!-- LOADING -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
    </div>
    } @else if (filteredBranches().length === 0) {
    <!-- EMPTY STATE -->
    <div class="empty-state">
      <span class="material-icons-outlined">store_mall_directory</span>
      <h3>No Branches Found</h3>
    </div>
    } @else {
    <!-- TABLE DATA -->
    <table>
      <thead>
        <tr>
          <th>BRANCH CODE</th>
          <th>BRANCH NAME</th>
          <th>ADDRESS</th>
        </tr>
      </thead>
      <tbody>
        @for (branch of paginatedBranches(); track branch.id) {
        <tr>
          <td>{{ branch.branchCode }}</td>
          <td>{{ branch.branchName }}</td>
          <td>{{ branch.address }}</td>
        </tr>
        }
      </tbody>
    </table>

    <!-- PAGINATION -->
    <div class="pagination-wrapper">
      <div class="pagination-info">
        <span
          >Showing {{ showingFrom() }} to {{ showingTo() }} of {{ filteredBranches().length }}</span
        >
      </div>
      <div class="pagination-controls">
        <button (click)="previousPage()">Previous</button>
        @for (page of pages(); track page) {
        <button [class.active]="currentPage() === page" (click)="goToPage(page)">{{ page }}</button>
        }
        <button (click)="nextPage()">Next</button>
      </div>
    </div>
    }
  </div>
</div>
```

**Penjelasan Angular v21 Syntax**:

#### 1. **Control Flow (@if, @for)**

Angular 21 menggunakan built-in control flow (bukan *ngIf, *ngFor):

```html
@if (condition) {
<!-- Show when true -->
} @else {
<!-- Show when false -->
} @for (item of items; track item.id) {
<!-- Repeat for each item -->
}
```

#### 2. **Two-Way Binding dengan Signals**

```html
<input [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" />
```

- `[ngModel]="searchQuery()"`: Bind nilai signal ke input (baca dengan parentheses)
- `(ngModelChange)="onSearch($event)"`: Trigger method ketika input berubah

#### 3. **String Interpolation dengan Signals**

```html
{{ branches().length }}
```

- Panggil signal dengan `()` untuk mendapatkan nilainya

---

### Step 5: Styling dengan CSS

**File**: `src/app/features/branches/branch-list.component.css`

Styling menggunakan modern CSS dengan:

- **Flexbox & Grid Layout**: Responsive design
- **CSS Variables**: Untuk konsistensi warna
- **Animations**: Smooth transitions
- **Hover Effects**: Interactive UI
- **Mobile-First**: Media queries untuk responsiveness

Key classes:

- `.branch-management-container`: Main container dengan fade-in animation
- `.stat-card`: Card untuk statistics dengan hover effect
- `.table-card`: Card untuk tabel dengan border-radius
- `.pagination-controls`: Flex layout untuk tombol pagination

---

### Step 6: Update Routing

**File**: `src/app/app.routes.ts`

```typescript
import { BranchListComponent } from './features/branches/branch-list.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserListComponent },
      { path: 'branches', component: BranchListComponent }, // ← Tambahkan ini
      // ...
    ],
  },
];
```

**Penjelasan**:

- Route `/admin/branches` akan menampilkan `BranchListComponent`
- Menggunakan nested routing dengan `AdminLayoutComponent` sebagai parent
- Layout admin menyediakan navbar dan sidebar yang konsisten

---

## 🧪 Testing

### 1. Manual Testing

#### A. Akses Halaman

```
URL: http://localhost:4200/admin/branches
```

#### B. Test Cases

| Test Case     | Action                        | Expected Result                             |
| ------------- | ----------------------------- | ------------------------------------------- |
| Load Data     | Buka halaman                  | Tabel menampilkan data branches             |
| Search        | Ketik "Jakarta" di search box | Hanya branches dengan kata "Jakarta" muncul |
| Pagination    | Klik tombol "Next"            | Menampilkan halaman berikutnya              |
| Page Size     | Ubah dropdown "10 per page"   | Tabel menampilkan 10 data                   |
| Loading State | Refresh page                  | Spinner muncul saat loading                 |
| Empty State   | Search "zzz" (tidak ada)      | Tampil "No Branches Found"                  |

### 2. Testing dengan cURL

```bash
curl -X GET "http://localhost:9091/api/branches" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. DevTools Console

Buka browser DevTools (F12) → Console tab:

```typescript
// Cek apakah service ter-inject
// Di component: console.log(this.branches())
```

---

## 🔧 Troubleshooting

### Issue 1: "401 Unauthorized"

**Penyebab**: Token expired atau tidak valid

**Solusi**:

1. Login ulang untuk mendapatkan token baru
2. Cek `auth.interceptor.ts` apakah token ter-attach
3. Verify token di [jwt.io](https://jwt.io)

```typescript
// Di browser console
localStorage.getItem('loanova_auth');
```

---

### Issue 2: "CORS Error"

**Penyebab**: Backend tidak mengizinkan request dari frontend

**Solusi**:

1. Pastikan `proxy.conf.json` sudah dikonfigurasi:

```json
{
  "/api": {
    "target": "http://localhost:9091",
    "secure": false,
    "changeOrigin": true
  }
}
```

2. Jalankan Angular dengan proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

3. Cek CORS di backend (Spring Boot):

```java
@CrossOrigin(origins = "http://localhost:4200")
```

---

### Issue 3: Data Tidak Muncul

**Debugging Steps**:

1. **Cek Network Tab** (DevTools → Network):

   - Apakah request ke `/api/branches` berhasil (status 200)?
   - Apakah response memiliki data?

2. **Cek Console** untuk error messages

3. **Tambahkan Console Log**:

```typescript
loadBranches(): void {
    this.isLoading.set(true);
    this.branchService.getAllBranches().subscribe({
        next: (response) => {
            console.log('API Response:', response); // ← Add this
            if (response.success) {
                this.branches.set(response.data);
                console.log('Branches set:', this.branches()); // ← Add this
            }
            this.isLoading.set(false);
        },
        error: (err) => {
            console.error('Error:', err); // ← Already there
            this.isLoading.set(false);
        }
    });
}
```

---

### Issue 4: Pagination Tidak Berfungsi

**Penyebab**: Computed signals tidak update

**Solusi**:

1. Pastikan signals dipanggil dengan `()`:

```typescript
// ❌ SALAH
return this.branches.slice(0, 5);

// ✅ BENAR
return this.branches().slice(0, 5);
```

2. Pastikan `currentPage` dan `pageSize` adalah signals

---

### Issue 5: Styling Tidak Muncul

**Penyebab**: CSS tidak ter-load

**Solusi**:

1. Cek file path di component decorator:

```typescript
@Component({
    styleUrl: './branch-list.component.css' // Singular (Angular 21)
    // BUKAN: styleUrls: ['...'] (plural)
})
```

2. Hard refresh browser: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                      │
│  ┌───────────────────────────────────────────────┐  │
│  │        BranchListComponent (UI)              │  │
│  │  - Displays table, search, pagination        │  │
│  │  - Uses Angular Signals for state            │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ inject                            │
│                  ▼                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │          BranchService (API Layer)           │  │
│  │  - Handles HTTP requests                      │  │
│  │  - Returns Observable<ApiResponse<T>>         │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ HTTP GET /api/branches           │
└──────────────────┼───────────────────────────────────┘
                   │ (via proxy)
                   ▼
┌─────────────────────────────────────────────────────┐
│                SPRING BOOT BACKEND                   │
│  ┌───────────────────────────────────────────────┐  │
│  │         BranchController                      │  │
│  │  @GetMapping("/api/branches")                 │  │
│  │  - Security: @PreAuthorize("SUPERADMIN")      │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│                  ▼                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │          BranchService                        │  │
│  │  - Business Logic                             │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│                  ▼                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │       BranchRepository (JPA)                  │  │
│  │  - Database Access                            │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│                  ▼                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │         PostgreSQL Database                   │  │
│  │  Table: branches                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🎓 Key Concepts Learned

### 1. **Angular Signals** (New in v16+)

- Reactive state management built into Angular
- Better performance than traditional observables for simple state
- Automatic change detection

### 2. **Standalone Components** (Angular v14+)

- No need for NgModule
- Direct imports in component decorator
- Simpler, more modern approach

### 3. **Service Layer Pattern**

- Separation of concerns (UI vs Business Logic)
- Reusable API calls
- Centralized HTTP logic

### 4. **Computed Values**

- Derived state from other signals
- Automatic updates
- Memoization for performance

### 5. **Modern Template Syntax**

- `@if`, `@for` instead of `*ngIf`, `*ngFor`
- Cleaner, more readable
- Better type checking

---

## 🚀 Next Steps (Future Enhancements)

Fitur yang bisa ditambahkan di masa depan:

1. **Create Branch** (POST)

   - Modal/Form untuk tambah cabang baru
   - Validation (branchCode unique, required fields)

2. **Update Branch** (PUT)

   - Edit button di setiap row
   - Inline editing atau modal form

3. **Delete Branch** (DELETE)

   - Confirmation dialog
   - Soft delete atau hard delete

4. **Advanced Filters**

   - Filter by region
   - Sort by column

5. **Export Data**

   - Export to Excel/CSV
   - Print functionality

6. **Bulk Operations**
   - Checkbox selection
   - Bulk delete/update

---

## 📝 Summary

✅ **What We Built**:

- Complete branch listing feature dengan modern Angular v21
- Reactive state management dengan Signals
- Clean architecture dengan service layer
- Beautiful, responsive UI dengan custom CSS

✅ **Technologies Used**:

- Angular 21 (Standalone Components)
- TypeScript
- RxJS
- Angular Signals
- Modern CSS

✅ **Best Practices Applied**:

- Separation of concerns (Service, Component, Model)
- Type safety dengan TypeScript
- Reactive programming dengan Signals
- Clean code dengan comments
- Responsive design

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan:

1. Check dokumentasi Angular: https://angular.dev
2. Review code comments di setiap file
3. Debug dengan browser DevTools

**Happy Coding! 🎉**
