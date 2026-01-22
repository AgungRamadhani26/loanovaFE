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
        this.loadBranches(); // Untuk dropdown branch
        this.loadRoles();    // Untuk checkbox roles
    }
}
```

---

## 5. Create User Modal

### A. Modal Form dengan Role Selection

Modal create user memiliki fitur khusus untuk pemilihan role yang dinamis:

1. **Multi-select untuk SUPERADMIN & BACKOFFICE**: User bisa memilih kedua role ini bersamaan.
2. **Single-select untuk role lain**: MARKETING, BRANCHMANAGER, CUSTOMER hanya bisa dipilih satu.
3. **Conditional Branch Field**: Field branch hanya muncul jika role yang dipilih membutuhkan branch (MARKETING, BRANCHMANAGER).

### B. Form Structure (HTML)

```html
@if (isCreateModalOpen()) {
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Add New User</h3>
      <button class="btn-close" (click)="closeCreateModal()">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>

    <div class="modal-body">
      <!-- Error Alert -->
      @if (formError()) {
        <div class="error-alert">
          <span class="material-icons-outlined">error</span>
          <span>{{ formError() }}</span>
        </div>
      }

      <form (ngSubmit)="onCreateUser()">
        <!-- Username -->
        <div class="form-group">
          <label>Username <span class="required">*</span></label>
          <input type="text" [(ngModel)]="createUserForm().username" name="username" 
                 placeholder="Enter username" [class.error]="getFieldError('username')">
          @if (getFieldError('username')) {
            <span class="error-text">{{ getFieldError('username') }}</span>
          } @else {
            <span class="hint-text">Password akan otomatis sama dengan username</span>
          }
        </div>

        <!-- Email -->
        <div class="form-group">
          <label>Email <span class="required">*</span></label>
          <input type="email" [(ngModel)]="createUserForm().email" name="email" 
                 placeholder="Enter email address" [class.error]="getFieldError('email')">
          @if (getFieldError('email')) {
            <span class="error-text">{{ getFieldError('email') }}</span>
          }
        </div>

        <!-- Role Selection (Checkbox Group) -->
        <div class="form-group">
          <label>Role <span class="required">*</span></label>
          <div class="role-checkbox-group">
            @for (role of roles(); track role.id) {
              <label class="role-checkbox-item" [class.selected]="isRoleSelected(role.id)">
                <input type="checkbox" [checked]="isRoleSelected(role.id)" 
                       (change)="toggleRoleSelection(role.id)">
                <span>{{ role.roleName }}</span>
              </label>
            }
          </div>
          @if (getFieldError('roleIds')) {
            <span class="error-text">{{ getFieldError('roleIds') }}</span>
          }
        </div>

        <!-- Conditional Branch Field -->
        @if (needsBranch()) {
        <div class="form-group">
          <label>Branch <span class="required">*</span></label>
          <select [(ngModel)]="createUserForm().branchId" name="branchId" 
                  [class.error]="getFieldError('branchId')">
            <option [ngValue]="null">-- Select Branch --</option>
            @for (branch of branches(); track branch.id) {
              <option [ngValue]="branch.id">{{ branch.branchCode }} - {{ branch.branchName }}</option>
            }
          </select>
          @if (getFieldError('branchId')) {
            <span class="error-text">{{ getFieldError('branchId') }}</span>
          }
        </div>
        }

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" class="btn-secondary" (click)="closeCreateModal()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="isSubmitting()">
            @if (isSubmitting()) {
              <span class="spinner-small"></span> Saving...
            } @else {
              Save User
            }
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
}
```

### C. Role Selection Logic (TypeScript)

```typescript
// Konstanta untuk role yang bisa multi-select
private readonly MULTI_SELECT_ROLES = ['SUPERADMIN', 'BACKOFFICE'];
private readonly ROLES_REQUIRING_BRANCH = ['BRANCHMANAGER', 'MARKETING'];

// Computed: Cek apakah perlu branch
needsBranch = computed(() => {
  const selectedRoleIds = this.createUserForm().roleIds;
  const allRoles = this.roles();
  const selectedRoleNames = allRoles
    .filter(r => selectedRoleIds.includes(r.id))
    .map(r => r.roleName);
  return selectedRoleNames.some(name => this.ROLES_REQUIRING_BRANCH.includes(name));
});

// Toggle role selection dengan logic multi/single select
toggleRoleSelection(roleId: number): void {
  const clickedRole = this.roles().find(r => r.id === roleId);
  if (!clickedRole) return;

  const isMultiSelectRole = this.MULTI_SELECT_ROLES.includes(clickedRole.roleName);

  this.createUserForm.update(form => {
    let newRoles: number[];

    if (isMultiSelectRole) {
      // Multi-select untuk SUPERADMIN/BACKOFFICE
      const currentMultiSelectRoles = form.roleIds.filter(id => {
        const role = this.roles().find(r => r.id === id);
        return role && this.MULTI_SELECT_ROLES.includes(role.roleName);
      });

      if (currentMultiSelectRoles.includes(roleId)) {
        newRoles = currentMultiSelectRoles.filter(id => id !== roleId);
      } else {
        newRoles = [...currentMultiSelectRoles, roleId];
      }
    } else {
      // Single select untuk role lain
      newRoles = form.roleIds.includes(roleId) ? [] : [roleId];
    }

    return {
      ...form,
      roleIds: newRoles,
      branchId: this.needsBranch() ? form.branchId : null
    };
  });
}
```

---

## 6. Modal Styling (Konsistensi dengan Branch & Plafond)

### A. Modal Container

```css
.modal-container {
  background: white;
  width: 90%;
  max-width: 500px; /* Wider untuk form yang lebih kompleks */
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-body {
  padding: 24px;
  max-height: 80vh; /* Prevent terlalu tinggi */
  overflow-y: auto; /* Scroll jika konten panjang */
}
```

### B. Error Styling (Hanya Border Merah)

```css
.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #ef4444; /* Hanya border merah, tanpa background */
}
```

### C. Role Checkbox Styling

```css
.role-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.role-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-checkbox-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}
```

---

## Kesimpulan

Fitur User Management menggunakan:
- **Advanced Filtering**: Search + Branch + Role + Status filter yang bekerja secara bersamaan
- **Dynamic Role Selection**: Multi-select untuk admin roles, single-select untuk operational roles
- **Conditional Fields**: Branch field hanya muncul jika diperlukan
- **Konsistensi Desain**: Modal styling yang sama dengan Branch dan Plafond (max-width 500px, scrollable, error styling)
- **Angular Signals**: State management yang reaktif dan performa tinggi

---

_Dokumentasi ini dibuat sebagai referensi implementasi fitur User Management._
