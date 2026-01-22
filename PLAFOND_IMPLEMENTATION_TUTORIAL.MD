# Tutorial Implementasi Fitur Manajemen Plafond (Plafond Management)

Dokumen ini menjelaskan implementasi fitur **Plafond Management** yang digunakan untuk mengelola limit pinjaman dan suku bunga. Fitur ini mencakup listing plafond dalam bentuk card grid yang menarik, create plafond dengan modal form, dan delete plafond.

---

## DAFTAR ISI

1.  **Backend Integration** (Model & Service)
2.  **Display Logic** (Component, Signal)
3.  **UI Template** (Card Grid Layout)
4.  **Modal Form** (Create Plafond dengan Form Grid)
5.  **Styling & UX** (Konsistensi Desain)

---

## 1. Backend Integration

### A. Data Model (`plafond-response.model.ts`)

Model data plafond yang diterima dari API backend.

```typescript
export interface PlafondData {
  id: number;
  name: string;              // Nama tier (Gold, Platinum, dll)
  description: string;       // Deskripsi singkat
  maxAmount: number;         // Limit maksimal pinjaman (IDR)
  interestRate: number;      // Suku bunga (%)
  tenorMin: number;          // Tenor minimum (bulan)
  tenorMax: number;          // Tenor maksimum (bulan)
}
```

### B. Plafond Service (`plafond.service.ts`)

Service untuk komunikasi dengan backend API.

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { PlafondData } from '../models/response/plafond-response.model';
import { PlafondRequest } from '../models/request/plafond-request.model';

@Injectable({
  providedIn: 'root',
})
export class PlafondService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/plafonds';

  /**
   * Mengambil semua data plafond
   */
  getAllPlafonds(): Observable<ApiResponse<PlafondData[]>> {
    return this.http.get<ApiResponse<PlafondData[]>>(this.API_URL);
  }

  /**
   * Membuat plafond baru
   */
  createPlafond(data: PlafondRequest): Observable<ApiResponse<PlafondData>> {
    return this.http.post<ApiResponse<PlafondData>>(this.API_URL, data);
  }

  /**
   * Menghapus plafond
   */
  deletePlafond(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
```

---

## 2. Display Logic (`plafond-list.component.ts`)

Component menggunakan **Angular Signals** untuk state management yang reaktif.

### A. State Management

```typescript
// Data State
plafonds = signal<PlafondData[]>([]);
isLoading = signal<boolean>(false);

// Modal State
isAddModalOpen = signal(false);
isSubmitting = signal(false);

// Message State
successMessage = signal<string | null>(null);
errorMessage = signal<string | null>(null);

// Form Data
addPlafondForm = signal<PlafondRequest>({
  name: '',
  description: '',
  maxAmount: 0,
  interestRate: 0,
  tenorMin: 0,
  tenorMax: 0
});

// Validation Errors (per field)
validationErrors = signal<Record<string, string>>({});
```

### B. Load Data

```typescript
loadPlafonds(): void {
  this.isLoading.set(true);
  this.plafondService.getAllPlafonds().subscribe({
    next: (response) => {
      if (response.success) {
        this.plafonds.set(response.data);
      }
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('Error loading plafonds:', err);
      this.isLoading.set(false);
    }
  });
}
```

### C. Create Plafond

```typescript
submitAddPlafond(): void {
  this.isSubmitting.set(true);
  this.errorMessage.set(null);
  this.validationErrors.set({});

  this.plafondService.createPlafond(this.addPlafondForm()).subscribe({
    next: (response) => {
      if (response.success) {
        this.loadPlafonds(); // Refresh data
        this.closeAddModal();
        this.successMessage.set(response.message || 'Plafond created successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
      }
      this.isSubmitting.set(false);
    },
    error: (err) => {
      // Handle validation errors
      if (err.error?.data?.errors) {
        this.validationErrors.set(err.error.data.errors);
        this.errorMessage.set(err.error.message || 'Validation failed');
      } else {
        this.errorMessage.set('An error occurred');
      }
      this.isSubmitting.set(false);
    }
  });
}
```

---

## 3. UI Template - Card Grid Layout

File: `plafond-list.component.html`

### A. Card Grid Container

Plafond ditampilkan dalam bentuk **card grid** yang responsif, bukan tabel.

```html
<div class="plafond-grid">
  @for (plafond of filteredPlafonds(); track plafond.id) {
    <div class="plafond-card-corporate">
      <!-- Top Accent Line (Color coded by type) -->
      <div class="card-accent" [ngClass]="getAccentClass(plafond.name)"></div>

      <div class="card-main">
        <!-- Header dengan Icon -->
        <div class="card-header-corp">
          <div class="header-icon-wrapper" [ngClass]="getIconClass(plafond.name)">
            <span class="material-icons-outlined">workspace_premium</span>
          </div>
          <div class="header-text">
            <h3 class="corp-title">{{ plafond.name }}</h3>
            <span class="corp-subtitle">{{ plafond.description }}</span>
          </div>
          <button class="btn-icon-small delete" (click)="deletePlafond(plafond.id, plafond.name)">
            <span class="material-icons-outlined">delete</span>
          </button>
        </div>

        <!-- Key Metrics Row -->
        <div class="metrics-container">
          <div class="metric-box primary-metric">
            <label>Maximum Limit</label>
            <div class="value">{{ plafond.maxAmount | currency:'IDR':'IDR ':'1.0-0' }}</div>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-box secondary-metric">
            <label>Interest Rate</label>
            <div class="value text-highlight">{{ plafond.interestRate }}%</div>
          </div>
        </div>

        <!-- Footer / Details -->
        <div class="card-footer-corp">
          <div class="detail-item">
            <span class="material-icons-outlined">date_range</span>
            <span>Tenor: <strong>{{ plafond.tenorMin }} - {{ plafond.tenorMax }} Months</strong></span>
          </div>
        </div>
      </div>
    </div>
  }
</div>
```

### B. Color Coding Logic

Setiap tier plafond memiliki warna accent yang berbeda:

```typescript
getAccentClass(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('platinum')) return 'accent-platinum';
  if (lowerName.includes('gold')) return 'accent-gold';
  if (lowerName.includes('silver')) return 'accent-silver';
  if (lowerName.includes('bronze')) return 'accent-bronze';
  return 'accent-default';
}
```

---

## 4. Modal Form - Create Plafond

### A. Form Grid Layout (2 Kolom)

Modal menggunakan **form-grid** untuk menampilkan field dalam 2 kolom yang lebih efisien.

```html
@if (isAddModalOpen()) {
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Add New Plafond</h3>
      <button class="btn-close" (click)="closeAddModal()">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>

    <div class="modal-body">
      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="error-alert">
          <span class="material-icons-outlined">error</span>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Full Width Fields -->
      <div class="form-group">
        <label>Plafond Name <span class="required">*</span></label>
        <input type="text" [(ngModel)]="addPlafondForm().name" 
               [class.error]="validationErrors()['name']">
        @if (validationErrors()['name']) {
          <span class="error-text">{{ validationErrors()['name'] }}</span>
        }
      </div>

      <div class="form-group">
        <label>Description <span class="required">*</span></label>
        <textarea [(ngModel)]="addPlafondForm().description" rows="3"
                  [class.error]="validationErrors()['description']"></textarea>
        @if (validationErrors()['description']) {
          <span class="error-text">{{ validationErrors()['description'] }}</span>
        }
      </div>

      <!-- 2 Column Grid -->
      <div class="form-grid">
        <div class="form-group">
          <label>Max Amount (IDR) <span class="required">*</span></label>
          <input type="number" [(ngModel)]="addPlafondForm().maxAmount"
                 [class.error]="validationErrors()['maxAmount']">
          @if (validationErrors()['maxAmount']) {
            <span class="error-text">{{ validationErrors()['maxAmount'] }}</span>
          }
        </div>

        <div class="form-group">
          <label>Interest Rate (%) <span class="required">*</span></label>
          <input type="number" step="0.1" [(ngModel)]="addPlafondForm().interestRate"
                 [class.error]="validationErrors()['interestRate']">
          @if (validationErrors()['interestRate']) {
            <span class="error-text">{{ validationErrors()['interestRate'] }}</span>
          }
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Min Tenor (Months) <span class="required">*</span></label>
          <input type="number" [(ngModel)]="addPlafondForm().tenorMin"
                 [class.error]="validationErrors()['tenorMin']">
        </div>

        <div class="form-group">
          <label>Max Tenor (Months) <span class="required">*</span></label>
          <input type="number" [(ngModel)]="addPlafondForm().tenorMax"
                 [class.error]="validationErrors()['tenorMax']">
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button class="btn-secondary" (click)="closeAddModal()">Cancel</button>
        <button class="btn-primary" (click)="submitAddPlafond()" [disabled]="isSubmitting()">
          @if (isSubmitting()) {
            <span class="spinner-small"></span> Saving...
          } @else {
            Save Plafond
          }
        </button>
      </div>
    </div>
  </div>
</div>
}
```

---

## 5. Styling & UX (`plafond-list.component.css`)

### A. Modal Styling (Konsisten dengan User & Branch)

```css
/* Modal Container - Wider untuk 2-col layout */
.modal-container {
  background: white;
  width: 90%;
  max-width: 500px; /* Wider untuk form-grid */
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

/* Scrollable Modal Body */
.modal-body {
  padding: 24px;
  max-height: 80vh; /* Prevent terlalu tinggi */
  overflow-y: auto; /* Scroll jika konten panjang */
}

/* Form Grid - 2 Kolom */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Error Styling - Hanya Border Merah */
.form-group input.error,
.form-group textarea.error {
  border-color: #ef4444; /* Hanya border merah */
}
```

### B. Card Grid Layout

```css
.plafond-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.plafond-card-corporate {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.plafond-card-corporate:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.1);
}
```

### C. Color Themes

```css
/* Platinum */
.accent-platinum {
  background: linear-gradient(90deg, #e0f2fe, #38bdf8);
}
.icon-platinum {
  background: #f0f9ff;
  color: #0284c7;
}

/* Gold */
.accent-gold {
  background: linear-gradient(90deg, #fef3c7, #fbbf24);
}
.icon-gold {
  background: #fffbeb;
  color: #d97706;
}

/* Silver */
.accent-silver {
  background: linear-gradient(90deg, #f1f5f9, #94a3b8);
}
.icon-silver {
  background: #f8fafc;
  color: #475569;
}
```

---

## Kesimpulan

Fitur Plafond Management menggunakan:
- **Card Grid Layout** untuk tampilan yang lebih menarik daripada tabel
- **Form Grid (2 kolom)** untuk efisiensi ruang di modal
- **Color Coding** untuk membedakan tier plafond secara visual
- **Konsistensi Desain** dengan modal User dan Branch (max-width 500px, scrollable, error styling yang sama)
- **Angular Signals** untuk state management yang reaktif dan performa tinggi

---

_Dokumentasi ini dibuat sebagai referensi implementasi fitur Plafond Management._
