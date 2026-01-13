# 📘 TUTORIAL LENGKAP: IMPLEMENTASI LOGIN & LAYOUT SISTEM LOANOVA

## 📚 DAFTAR ISI

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Struktur Folder & File](#2-struktur-folder--file)
3. [Alur Proses Login](#3-alur-proses-login)
4. [Komponen-Komponen Utama](#4-komponen-komponen-utama)
5. [Layout Management](#5-layout-management)
6. [Security & Interceptor](#6-security--interceptor)
7. [State Management dengan Signals](#7-state-management-dengan-signals)
8. [Routing Strategy](#8-routing-strategy)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. ARSITEKTUR SISTEM

### 1.1 Diagram Alur Login

```
┌──────────────┐
│  User Input  │
│ (Username +  │
│  Password)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ LoginComponent       │
│ • Validasi Form      │
│ • Loading State      │
│ • Error Handling     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  AuthService         │
│ • HTTP POST Login    │
│ • Save Token         │
│ • Update Signal      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Backend API         │
│ POST /api/auth/login │
│ Response: Token +    │
│           UserData   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Token Disimpan:      │
│ • LocalStorage       │
│ • Signal (Memory)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Router Navigate      │
│ → /admin/dashboard   │
└──────────────────────┘
```

### 1.2 Diagram Layout System

```
┌─────────────────────────────────────────────────┐
│              AdminLayoutComponent               │
│                                                 │
│  ┌──────────┐  ┌──────────────────────────┐   │
│  │          │  │  HeaderComponent          │   │
│  │          │  │  • User Info              │   │
│  │ Sidebar  │  │  • Notifications          │   │
│  │          │  │  • Logout Button          │   │
│  │ • Logo   │  └──────────────────────────┘   │
│  │ • Menu   │                                  │
│  │ • RBAC   │  ┌──────────────────────────┐   │
│  │          │  │                          │   │
│  │          │  │   <router-outlet>        │   │
│  │          │  │   (Dashboard Content)    │   │
│  │          │  │                          │   │
│  │          │  │                          │   │
│  └──────────┘  └──────────────────────────┘   │
│                                                 │
│                 ┌──────────────────────────┐   │
│                 │  FooterComponent         │   │
│                 └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 2. STRUKTUR FOLDER & FILE

### 2.1 Tree Struktur Core

```
src/app/
├── core/                           # Logic inti aplikasi
│   ├── interceptors/               # HTTP Request/Response Handler
│   │   └── auth.interceptor.ts    # Token injection & refresh
│   ├── models/                     # Data Models
│   │   ├── user-role.enum.ts      # Enum untuk role
│   │   ├── user-state.model.ts    # Interface state user
│   │   ├── request/               # DTO untuk Request
│   │   │   └── login-request.model.ts
│   │   └── response/              # DTO untuk Response
│   │       ├── api-response.model.ts
│   │       ├── login-response.model.ts
│   │       └── validation-error.model.ts
│   └── services/                   # Business Logic Services
│       ├── auth.service.ts        # Authentication logic
│       └── layout.service.ts      # Layout state management
```

### 2.2 Tree Struktur Features

```
src/app/
├── features/                       # Fitur-fitur aplikasi
│   ├── auth/                      # Modul Authentication
│   │   └── login/                 # Halaman Login
│   │       ├── login.component.ts
│   │       ├── login.component.html
│   │       └── login.component.css
│   └── dashboard/                 # Halaman Dashboard
│       ├── dashboard.component.ts
│       ├── dashboard.component.html
│       └── dashboard.component.css
```

### 2.3 Tree Struktur Layout

```
src/app/
├── layout/                         # Komponen Layout
│   ├── admin/                     # Layout untuk area admin
│   │   ├── admin-layout/         # Wrapper utama
│   │   │   ├── admin-layout.component.ts
│   │   │   ├── admin-layout.component.html
│   │   │   └── admin-layout.component.css
│   │   ├── header/               # Top Navigation
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.html
│   │   │   └── header.component.css
│   │   ├── sidebar/              # Side Navigation
│   │   │   ├── sidebar.component.ts
│   │   │   ├── sidebar.component.html
│   │   │   └── sidebar.component.css
│   │   └── footer/               # Bottom Footer
│   │       ├── footer.component.ts
│   │       ├── footer.component.html
│   │       └── footer.component.css
│   └── shared/                    # Layout untuk public area
│       └── main-layout.component.ts
```

---

## 3. ALUR PROSES LOGIN

### 3.1 Flow Chart Login

```
START
  │
  ▼
User membuka halaman /auth/login
  │
  ▼
LoginComponent di-render
  │
  ├─► Inisialisasi signal:
  │   • username = ''
  │   • password = ''
  │   • isLoading = false
  │   • errorMessage = null
  │
  ▼
User mengisi form & klik tombol "Login ke Sistem"
  │
  ▼
Method onSubmit() dipanggil
  │
  ├─► 1. Reset error messages
  ├─► 2. Set isLoading = true (Tombol jadi disabled)
  ├─► 3. Panggil AuthService.login(credentials)
  │
  ▼
AuthService.login() menjalankan:
  │
  ├─► HTTP POST ke /api/auth/login
  │   Body: { username: "...", password: "..." }
  │
  ▼
Backend memproses & memberikan response
  │
  ├─► SUCCESS (200 OK)
  │   {
  │     "success": true,
  │     "message": "Login berhasil",
  │     "data": {
  │       "accessToken": "eyJhbGciOiJIUzI1...",
  │       "refreshToken": "dGhpcyBpcyByZW...",
  │       "username": "Bima12345",
  │       "roles": ["SUPERADMIN"]
  │     }
  │   }
  │   │
  │   ├─► AuthService menyimpan data:
  │   │   • Update userState signal
  │   │   • Simpan ke localStorage
  │   │
  │   ├─► LoginComponent navigate ke /admin/dashboard
  │   │
  │   └─► User melihat halaman dashboard
  │
  └─► ERROR (400/401)
      {
        "success": false,
        "message": "Username atau password salah",
        "code": 401
      }
      │
      ├─► LoginComponent menampilkan error
      ├─► Set isLoading = false
      └─► User bisa mencoba login lagi
```

### 3.2 Sequence Diagram Detail

```
┌─────────┐   ┌───────────────┐   ┌─────────────┐   ┌─────────┐
│  User   │   │ LoginComponent│   │ AuthService │   │ Backend │
└────┬────┘   └───────┬───────┘   └──────┬──────┘   └────┬────┘
     │                │                   │               │
     │ Klik Login     │                   │               │
     ├───────────────►│                   │               │
     │                │                   │               │
     │                │ login(credentials)│               │
     │                ├──────────────────►│               │
     │                │                   │               │
     │                │                   │ POST /login   │
     │                │                   ├──────────────►│
     │                │                   │               │
     │                │                   │ Response      │
     │                │                   │◄──────────────┤
     │                │                   │               │
     │                │  tap(): Save token│               │
     │                │                   ├─┐             │
     │                │                   │ │ localStorage│
     │                │                   │ │ + signal    │
     │                │                   │◄┘             │
     │                │                   │               │
     │                │ Observable Result │               │
     │                │◄──────────────────┤               │
     │                │                   │               │
     │                │ navigate('/admin')│               │
     │                ├─────────────────┐ │               │
     │                │                 │ │               │
     │ Dashboard      │◄────────────────┘ │               │
     │◄───────────────┤                   │               │
```

---

## 4. KOMPONEN-KOMPONEN UTAMA

### 4.1 AuthService (`auth.service.ts`)

**Tujuan:** Mengelola seluruh proses autentikasi (login, logout, refresh token, dan state management).

#### A. Property & Dependency Injection

```typescript
@Injectable({
  providedIn: 'root', // Singleton pattern
})
export class AuthService {
  // Injected services
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // API Endpoint
  private readonly API_URL = '/api/auth';

  // State management dengan Signals
  private readonly userState = signal<UserState>({
    isAuthenticated: false,
    token: null,
    refreshToken: null,
    username: null,
    roles: [],
  });

  // Public read-only signals
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => this.userState().isAuthenticated);
}
```

**Penjelasan:**

- `inject()`: Cara modern Angular untuk dependency injection (tidak perlu constructor).
- `signal()`: Reactive state container yang otomatis update UI ketika berubah.
- `computed()`: Derived signal yang terbentuk dari signal lain.
- `providedIn: 'root'`: Service ini tersedia di seluruh aplikasi (tidak perlu dideklarasikan di providers).

#### B. Constructor & Auto-Login

```typescript
constructor() {
    if (isPlatformBrowser(this.platformId)) {
        const savedAuth = localStorage.getItem('loanova_auth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                this.userState.set({ ...authData, isAuthenticated: true });
            } catch (e) {
                localStorage.removeItem('loanova_auth');
            }
        }
    }
}
```

**Penjelasan:**

- Saat aplikasi pertama kali dijalankan (atau di-refresh), service ini akan:
  1. Cek apakah kode berjalan di browser (bukan di server untuk SSR).
  2. Cek LocalStorage apakah ada data login tersimpan.
  3. Jika ada, parse JSON dan restore state user.
  4. Jika data rusak, hapus dari LocalStorage.

#### C. Login Method

```typescript
login(credentials: LoginRequestDTO): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(
        `${this.API_URL}/login`,
        credentials
    ).pipe(
        tap(response => {
            if (response.success && response.data) {
                this.saveState({
                    isAuthenticated: true,
                    token: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    username: response.data.username,
                    roles: response.data.roles
                });
            }
        })
    );
}
```

**Penjelasan:**

- `Observable<T>`: Asynchronous stream data (seperti Promise tapi lebih powerful).
- `pipe()`: Operator untuk menambahkan logic tambahan pada stream.
- `tap()`: Side-effect operator, digunakan untuk save state tanpa mengubah data stream.
- Kenapa tidak pakai async/await? Karena Angular HttpClient menggunakan RxJS pattern yang lebih powerful untuk handle async operations.

#### D. Refresh Token Method

```typescript
refreshToken(): Observable<ApiResponse<LoginData>> {
    const currentRefreshToken = this.userState().refreshToken;
    return this.http.post<ApiResponse<LoginData>>(
        `${this.API_URL}/refresh`,
        { refreshToken: currentRefreshToken }
    ).pipe(
        tap(response => {
            if (response.success && response.data) {
                this.saveState({
                    ...this.userState(),
                    token: response.data.accessToken,
                    refreshToken: response.data.refreshToken
                });
            }
        })
    );
}
```

**Penjelasan:**

- Refresh token digunakan untuk mendapatkan access token baru tanpa perlu login ulang.
- Access token biasanya kadaluarsa dalam waktu singkat (15-30 menit).
- Refresh token memiliki masa hidup lebih lama (7-30 hari).
- Flow ini dipanggil otomatis oleh interceptor ketika mendapat response 401.

#### E. Logout Method

```typescript
logout() {
    this.userState.set({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        username: null,
        roles: []
    });

    if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('loanova_auth');
    }
}
```

**Penjelasan:**

- Reset semua state ke kondisi awal.
- Hapus data dari LocalStorage.
- UI akan otomatis berubah karena signal reactive.

#### F. Save State Helper

```typescript
saveState(state: UserState) {
    this.userState.set(state);

    if (isPlatformBrowser(this.platformId)) {
        const { isAuthenticated, ...saveData } = state;
        localStorage.setItem('loanova_auth', JSON.stringify(saveData));
    }
}
```

**Penjelasan:**

- Menyimpan state ke dua tempat sekaligus:
  1. **Memory (Signal)**: Untuk reactive UI.
  2. **LocalStorage**: Untuk persistensi data (tetap login setelah refresh).
- `isAuthenticated` tidak disimpan ke LocalStorage karena akan di-set ulang saat constructor.

---

### 4.2 LoginComponent (`login.component.ts`)

**Tujuan:** Menghandle UI halaman login, validasi form, dan interaksi user.

#### A. Component Metadata

```typescript
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
```

**Penjelasan:**

- `standalone: true`: Component ini tidak memerlukan NgModule (Angular 15+).
- `imports`: Modul yang dibutuhkan component ini:
  - `CommonModule`: *ngIf, *ngFor, pipes, dll.
  - `FormsModule`: Two-way binding dengan ngModel.
  - `RouterLink`: Navigasi dengan link.

#### B. Signals & State

```typescript
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<{ [key: string]: string } | null>(null);
  readonly showPassword = signal(false);
}
```

**Penjelasan:**

- Semua state menggunakan `signal()` untuk reactive updates.
- `readonly`: Signals tidak bisa di-reassign, tapi isinya bisa di-update dengan `.set()` atau `.update()`.
- `<string | null>`: TypeScript generic untuk type safety.

#### C. onSubmit Method

```typescript
onSubmit() {
    // 1. Reset errors
    this.errorMessage.set(null);
    this.validationErrors.set(null);

    // 2. Set loading
    this.isLoading.set(true);

    // 3. Call API
    this.authService.login({
        username: this.username(),
        password: this.password()
    }).subscribe({
        next: (result) => {
            if (result.success) {
                this.router.navigate(['/admin/dashboard']);
            } else {
                this.errorMessage.set(result.message);
                if (result.code === 400 && result.data && (result.data as any).errors) {
                    this.validationErrors.set((result.data as any).errors);
                }
            }
            this.isLoading.set(false);
        },
        error: (err) => {
            const apiError = err.error;
            if (apiError) {
                this.errorMessage.set(apiError.message);
                if (apiError.data && apiError.data.errors) {
                    this.validationErrors.set(apiError.data.errors);
                }
            } else {
                this.errorMessage.set('Waduh, koneksinya lagi bermasalah atau server lagi tidur.');
            }
            this.isLoading.set(false);
        }
    });
}
```

**Penjelasan:**

- `subscribe()`: Memulai eksekusi Observable (seperti `.then()` pada Promise).
- `next`: Handler ketika mendapat response sukses dari server.
- `error`: Handler ketika terjadi network error atau HTTP error.
- Error handling bertingkat:
  1. HTTP Error (network issue)
  2. Business Error (wrong credentials)
  3. Validation Error (empty fields)

#### D. Helper Methods

```typescript
getFieldError(field: string): string | undefined {
    return this.validationErrors()?.[field];
}

togglePassword() {
    this.showPassword.update(v => !v);
}
```

**Penjelasan:**

- `getFieldError()`: Mengambil error message untuk field tertentu (digunakan di template).
- `togglePassword()`: Toggle visibility password field.
- `.update()`: Cara update signal berdasarkan nilai sebelumnya.

---

### 4.3 Login Template (`login.component.html`)

#### A. Struktur Wrapper

```html
<div
  class="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
>
  <!-- Background decorations -->
  <div class="absolute inset-0 z-0 opacity-10 pointer-events-none">
    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-[120px] ..."></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] ..."></div>
  </div>

  <!-- Form container -->
  <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-[40px] shadow-2xl ...">...</div>
</div>
```

**Penjelasan Tailwind Classes:**

- `min-h-screen`: Minimum tinggi = tinggi viewport (100vh).
- `flex items-center justify-center`: Centering content horizontal & vertical.
- `relative`: Container untuk absolute positioned elements.
- `overflow-hidden`: Mencegah scroll horizontal/vertical dari decorations.
- `pointer-events-none`: Background tidak bisa di-klik (tidak menghalangi form).

#### B. Form dengan Error Handling

```html
<form class="mt-8 space-y-6" (submit)="onSubmit(); $event.preventDefault()">
  <!-- Global Error -->
  @if (errorMessage()) {
  <div
    class="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
  >
    <span>❌</span>
    <p>{{ errorMessage() }}</p>
  </div>
  }

  <!-- Username Field -->
  <div>
    <label for="username" class="block text-sm font-bold text-slate-700 mb-2">Username</label>
    <div class="relative group">
      <span
        class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors"
        >👤</span
      >
      <input
        id="username"
        name="username"
        type="text"
        required
        class="appearance-none block w-full pl-12 pr-4 py-4 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium sm:text-sm"
        [class.border-red-400]="getFieldError('username')"
        placeholder="Masukkan username Anda"
        [ngModel]="username()"
        (ngModelChange)="username.set($event)"
      />
    </div>
    @if (getFieldError('username')) {
    <p class="mt-1 text-xs text-red-500 font-bold ml-1"># {{ getFieldError('username') }}</p>
    }
  </div>
</form>
```

**Penjelasan:**

- `(submit)="onSubmit(); $event.preventDefault()"`: Mencegah default form submission.
- `@if (errorMessage())`: New control flow syntax Angular 17+ (pengganti \*ngIf).
- `[class.border-red-400]="condition"`: Conditional CSS class.
- `[ngModel]` & `(ngModelChange)`: Two-way binding dengan signal.
- `group-focus-within`: Tailwind variant untuk parent styling ketika child di-focus.

#### C. Loading State Button

```html
<button
  type="submit"
  [disabled]="isLoading()"
  class="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-70"
>
  @if (isLoading()) {
  <span class="flex items-center gap-2">
    <svg
      class="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    Sedang Memproses...
  </span>
  } @else { Login ke Sistem }
</button>
```

**Penjelasan:**

- `[disabled]="isLoading()"`: Disable button saat loading.
- `disabled:opacity-70`: Tailwind variant untuk disabled state.
- `animate-spin`: Tailwind utility untuk rotating animation.
- `@if @else`: New control flow untuk conditional rendering.

---

## 5. LAYOUT MANAGEMENT

### 5.1 AdminLayoutComponent

**Tujuan:** Wrapper utama untuk area dashboard yang mengatur posisi sidebar, header, footer, dan content area.

#### A. Component Structure

```typescript
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  layoutService = inject(LayoutService);
}
```

**Penjelasan:**

- Component ini hanya sebagai orchestrator (pengatur).
- Logic utama ada di child components (Sidebar, Header, Footer).
- `RouterOutlet`: Tempat render component berdasarkan routing.

#### B. Template Structure

```html
<div class="min-h-screen bg-slate-50 relative overflow-hidden">
  <!-- Mobile Overlay -->
  <div
    *ngIf="layoutService.isSidebarOpen()"
    (click)="layoutService.closeSidebar()"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
  ></div>

  <!-- Sidebar -->
  <app-admin-sidebar></app-admin-sidebar>

  <!-- Main Content Wrapper -->
  <div class="flex flex-col min-h-screen transition-all duration-300">
    <!-- Header -->
    <app-admin-header></app-admin-header>

    <!-- Content Area -->
    <main class="flex-grow pl-4 lg:pl-72 pt-20 pr-4 pb-4 md:pr-8 md:pb-8 overflow-x-hidden">
      <div class="container mx-auto max-w-7xl">
        <router-outlet></router-outlet>
      </div>
    </main>

    <!-- Footer -->
    <app-admin-footer></app-admin-footer>
  </div>
</div>
```

**Penjelasan Layout Strategy:**

1. **Mobile Overlay:**

   - `*ngIf="layoutService.isSidebarOpen()"`: Hanya muncul di mobile ketika sidebar terbuka.
   - `(click)="layoutService.closeSidebar()"`: Klik overlay = tutup sidebar.
   - `lg:hidden`: Overlay tidak terlihat di desktop (layar >= 1024px).
   - `backdrop-blur-sm`: Blur effect untuk background.

2. **Main Content Padding:**

   - `pl-4`: Padding left 16px di mobile.
   - `lg:pl-72`: Padding left 288px di desktop (256px sidebar + 32px gap).
   - `pt-20`: Padding top 80px untuk space dari header yang fixed.

3. **Responsive Breakpoints:**
   - Mobile: < 640px
   - Tablet (md:): >= 768px
   - Desktop (lg:): >= 1024px

---

### 5.2 SidebarComponent

**Tujuan:** Menampilkan menu navigasi dengan Role-Based Access Control (RBAC).

#### A. Menu Configuration

```typescript
private readonly allMenuItems = [
    {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: 'dashboard',
        roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE, UserRole.MARKETING, UserRole.BRANCHMANAGER]
    },
    {
        label: 'Users',
        path: '/admin/users',
        icon: 'people',
        roles: [UserRole.SUPERADMIN]
    },
    {
        label: 'Branch',
        path: '/admin/branches',
        icon: 'business',
        roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE]
    },
    // ... menu lainnya
];
```

**Penjelasan:**

- Setiap menu item memiliki property `roles` yang menentukan siapa saja yang boleh melihat.
- `UserRole` adalah enum yang didefinisikan di model.
- Structure ini memudahkan penambahan/pengurangan menu.

#### B. Filtered Menu dengan Computed Signal

```typescript
readonly filteredMenuItems = computed(() => {
    const user = this.authService.user();

    if (!user.isAuthenticated) return [];

    return this.allMenuItems.filter(item =>
        item.roles.some(role => user.roles.includes(role))
    );
});
```

**Penjelasan:**

- `computed()`: Automatically re-calculates when dependencies change.
- Logic:
  1. Ambil data user dari AuthService.
  2. Jika belum login, return array kosong.
  3. Filter menu: tampilkan jika user memiliki salah satu role yang required.
- Kenapa pakai `computed()`? Agar menu otomatis update ketika user login/logout tanpa perlu manual refresh.

#### C. Template dengan @for (Angular 17+)

```html
<aside
  [class.-translate-x-full]="!layoutService.isSidebarOpen()"
  class="w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-50 transition-all duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none"
>
  <!-- Logo -->
  <div class="p-7 md:p-8 border-b border-slate-800/50 flex items-center gap-3.5">
    <div
      class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-black text-lg shadow-lg shadow-blue-600/20"
    >
      L
    </div>
    <span class="text-lg font-black tracking-[0.2em] text-white">LOANOVA</span>
  </div>

  <!-- Menu List -->
  <nav class="mt-6 px-4 space-y-2">
    @for (item of filteredMenuItems(); track item.path) {
    <a
      [routerLink]="item.path"
      routerLinkActive="bg-blue-600 text-white shadow-lg shadow-blue-900/40"
      [routerLinkActiveOptions]="{exact: true}"
      class="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-slate-800 text-slate-400 hover:text-white"
    >
      <span class="material-icons-outlined text-xl group-hover:scale-110 transition-transform">
        {{ item.icon }}
      </span>
      <span class="font-medium text-sm">{{ item.label }}</span>
    </a>
    }
  </nav>

  <!-- Footer -->
  <div
    class="absolute bottom-6 left-6 right-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50"
  >
    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center">
      Version 1.0.0-PRO
    </p>
  </div>
</aside>
```

**Penjelasan Sidebar Behavior:**

1. **Mobile Slide Animation:**

   - `[class.-translate-x-full]="!layoutService.isSidebarOpen()"`: Binding conditional class.
   - `-translate-x-full`: Sidebar tersembunyi di luar layar (translasi -100% ke kiri).
   - `lg:translate-x-0`: Di desktop, sidebar selalu terlihat (translasi 0).

2. **RouterLink Active State:**

   - `routerLinkActive`: Class yang ditambahkan ketika route aktif.
   - `{exact: true}`: Hanya aktif jika URL exact match (tidak partial).

3. **Icon Animation:**
   - `group-hover:scale-110`: Icon membesar 110% ketika parent di-hover.
   - `transition-transform`: Smooth animation untuk scale.

---

### 5.3 HeaderComponent

**Tujuan:** Top navigation dengan user info, notifications, dan logout button.

#### A. Component Logic

```typescript
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  layoutService = inject(LayoutService);

  readonly user = this.authService.user;

  readonly userRole = computed(() => {
    const roles = this.user().roles;
    return roles.length > 0 ? roles[0] : 'Guest';
  });

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
```

**Penjelasan:**

- `user`: Direct reference ke signal dari AuthService (reactive).
- `userRole`: Computed signal yang mengambil role pertama dari array roles.
- `onLogout()`: Clear state + navigate to login page.

#### B. Template Structure

```html
<header
  class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-64 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm"
>
  <!-- Left Side -->
  <div class="flex items-center gap-4">
    <!-- Hamburger Menu (Mobile Only) -->
    <button
      (click)="layoutService.toggleSidebar()"
      class="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
    >
      <span class="material-icons-outlined">menu</span>
    </button>

    <!-- Page Title -->
    <div class="hidden sm:block">
      <h2 class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Dashboard</h2>
      <p class="text-lg font-black text-slate-900 leading-tight">Overview System</p>
    </div>
  </div>

  <!-- Right Side -->
  <div class="flex items-center gap-3 md:gap-6">
    <!-- Notification Button -->
    <button
      class="relative p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
    >
      <span class="material-icons-outlined text-[22px]">notifications</span>
      <span
        class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
      ></span>
    </button>

    <!-- User Info -->
    <div class="flex items-center gap-3">
      <div class="hidden md:flex flex-col items-end text-right">
        <p class="text-sm font-black text-slate-900 leading-none mb-1">
          {{ user().username || 'User' }}
        </p>
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest"
            >{{ userRole() }}</span
          >
        </div>
      </div>

      <!-- Avatar + Logout -->
      <div
        class="p-1 px-1.5 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 group"
      >
        <div
          class="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform"
        >
          {{ user().username ? user().username![0].toUpperCase() : 'U' }}
        </div>

        <button
          (click)="onLogout()"
          class="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Logout"
        >
          <span class="material-icons-outlined text-xl">logout</span>
        </button>
      </div>
    </div>
  </div>
</header>
```

**Penjelasan Header Behavior:**

1. **Fixed Positioning:**

   - `fixed top-0 right-0 left-0`: Header menempel di atas layar.
   - `lg:left-64`: Di desktop, header mulai dari kanan sidebar (256px dari kiri).
   - `z-30`: Layer di atas content tapi di bawah sidebar (z-50) dan overlay (z-40).

2. **Responsive Visibility:**

   - `lg:hidden`: Hamburger menu hanya muncul di mobile/tablet.
   - `hidden sm:block`: Page title disembunyikan di mobile, muncul di tablet ke atas.
   - `hidden md:flex`: User info detail hanya muncul di desktop.

3. **Avatar Dynamic Initial:**
   - `{{ user().username![0].toUpperCase() }}`: Ambil karakter pertama username dan uppercase.
   - `!`: Non-null assertion operator (kita yakin username tidak null karena sudah login).

---

### 5.4 LayoutService

**Tujuan:** Centralized state management untuk layout (sidebar toggle di mobile).

```typescript
@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  readonly isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update((state) => !state);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }
}
```

**Penjelasan:**

- Service ini sangat simple, hanya manage 1 signal.
- Bisa di-extend untuk layout state lainnya (e.g., theme, collapsed mode, dll).
- Kenapa perlu service terpisah? Agar bisa diakses dari berbagai component tanpa prop drilling.

---

## 6. SECURITY & INTERCEPTOR

### 6.1 Auth Interceptor

**Tujuan:** Automatically inject JWT token ke setiap HTTP request dan handle token refresh.

#### A. Interceptor Function

```typescript
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const skipUrls = ['/api/auth/login', '/api/auth/refresh'];
  const shouldSkip = skipUrls.some((url) => req.url.includes(url));

  let authReq = req;

  if (token && !shouldSkip) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !shouldSkip) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};
```

**Penjelasan Flow:**

```
Request dibuat
    │
    ▼
Interceptor dipanggil
    │
    ├─► Cek: Apakah URL perlu token?
    │   │
    │   ├─► Ya → Clone request + tambahkan header Authorization
    │   └─► Tidak → Lanjutkan tanpa modifikasi
    │
    ▼
Request dikirim ke server
    │
    ▼
Response diterima
    │
    ├─► Status 401? (Unauthorized)
    │   │
    │   └─► Ya → Panggil handle401Error (refresh token)
    │           │
    │           ├─► Refresh berhasil → Retry request dengan token baru
    │           └─► Refresh gagal → Logout user
    │
    └─► Status lain → Lanjutkan normal
```

#### B. Handle 401 Error (Token Refresh)

```typescript
function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  return authService.refreshToken().pipe(
    switchMap((response) => {
      if (response.success) {
        const newToken = authService.getAccessToken();
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
          },
        });
        return next(retryReq);
      } else {
        authService.logout();
        return throwError(() => new Error('Sesi sudah habis, silakan login ulang.'));
      }
    }),
    catchError((err) => {
      authService.logout();
      return throwError(() => err);
    })
  );
}
```

**Penjelasan:**

- `switchMap()`: RxJS operator yang switch dari satu Observable ke Observable lain.
- Flow:
  1. Call refresh token API.
  2. Jika sukses, ambil token baru.
  3. Clone request yang gagal tadi dengan token baru.
  4. Retry request (user tidak akan sadar ada retry).
  5. Jika refresh gagal, logout dan throw error.

**Kenapa ini penting?**

- User experience: Tidak perlu login ulang setiap token expire.
- Security: Token punya lifetime pendek, mengurangi risiko jika token dicuri.
- Automatic: Semua handled di background, transparent untuk user.

---

### 6.2 Security Best Practices

#### A. Token Storage Strategy

```typescript
// ✅ GOOD: LocalStorage untuk persistence
if (isPlatformBrowser(this.platformId)) {
  localStorage.setItem('loanova_auth', JSON.stringify(saveData));
}

// ❌ BAD: Tidak cek platform (error di SSR)
localStorage.setItem('loanova_auth', JSON.stringify(saveData));
```

**Kenapa cek platform?**

- Angular Universal (SSR) tidak punya `localStorage`.
- Code harus bisa berjalan di server dan browser.

#### B. Token Lifetime

```
Access Token:  15-30 menit  (Short-lived)
Refresh Token: 7-30 hari    (Long-lived)
```

**Strategy:**

- Access token untuk authorization di setiap request.
- Refresh token untuk mendapatkan access token baru.
- Jika refresh token expire, user harus login ulang.

#### C. Sensitive Data Handling

```typescript
// ✅ GOOD: Simpan minimal data
const { isAuthenticated, ...saveData } = state;
localStorage.setItem('loanova_auth', JSON.stringify(saveData));

// ❌ BAD: Simpan data sensitif
localStorage.setItem('password', password); // NEVER DO THIS!
```

**Rules:**

- Jangan simpan password.
- Jangan simpan data sensitif yang tidak perlu.
- Token sudah encrypted, aman untuk disimpan.

---

## 7. STATE MANAGEMENT DENGAN SIGNALS

### 7.1 Kenapa Signals?

**Sebelum Signals (Zone.js):**

```typescript
username: string = '';

ngOnInit() {
    setTimeout(() => {
        this.username = 'John'; // Zone.js detect change → trigger change detection
    }, 1000);
}
```

**Dengan Signals:**

```typescript
username = signal('');

ngOnInit() {
    setTimeout(() => {
        this.username.set('John'); // Signal update → only affected components re-render
    }, 1000);
}
```

**Keuntungan Signals:**

1. **Performance**: Hanya component yang depend ke signal yang re-render.
2. **Explicit**: Mudah track data flow.
3. **Type-safe**: TypeScript fully supported.
4. **No Zone.js**: Angular bisa jalan tanpa Zone.js (opt-in).

### 7.2 Signal Operations

#### A. Basic Operations

```typescript
// Create
const count = signal(0);

// Read
console.log(count()); // 0

// Write (set)
count.set(10);

// Write (update)
count.update((val) => val + 1);
```

#### B. Computed Signals

```typescript
const count = signal(0);
const doubleCount = computed(() => count() * 2);

console.log(doubleCount()); // 0
count.set(5);
console.log(doubleCount()); // 10 (automatically updated)
```

#### C. Effect (Side Effects)

```typescript
const count = signal(0);

effect(() => {
  console.log('Count changed:', count());
});

count.set(5); // Console: Count changed: 5
```

### 7.3 Signals vs Observable

| Signals            | Observables (RxJS)   |
| ------------------ | -------------------- |
| Synchronous        | Asynchronous         |
| Always has value   | Can be empty stream  |
| Simpler API        | More operators       |
| For local state    | For async operations |
| Builtin to Angular | External library     |

**Kapan pakai apa?**

- **Signals**: Component state, derived state, UI state.
- **Observables**: HTTP calls, events, complex async flows.

---

## 8. ROUTING STRATEGY

### 8.1 Route Configuration

```typescript
export const routes: Routes = [
  // Public Area
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: '', component: LandingPageComponent }],
  },

  // Auth Area
  { path: 'auth/login', component: LoginComponent },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },

  // Protected Area
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: DashboardComponent },
      // ... other admin routes
    ],
  },

  // Fallback
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
```

**Penjelasan Structure:**

1. **Nested Routes:**

   - Parent route render layout component.
   - Child route render di `<router-outlet>` dalam parent.

2. **Redirect:**

   - `/login` → `/auth/login` (standardisasi URL).
   - `/admin` → `/admin/dashboard` (default page).
   - `**` → `/` (catch all invalid routes).

3. **pathMatch:**
   - `'full'`: URL harus exact match.
   - `'prefix'`: URL bisa partial match (default).

### 8.2 Navigation Methods

#### A. Programmatic Navigation

```typescript
// Basic navigation
this.router.navigate(['/admin/dashboard']);

// With parameters
this.router.navigate(['/admin/users', userId]);

// With query params
this.router.navigate(['/admin/users'], { queryParams: { page: 1, sort: 'name' } });

// Relative navigation
this.router.navigate(['../sibling'], { relativeTo: this.route });
```

#### B. Template Navigation

```html
<!-- Basic link -->
<a routerLink="/admin/dashboard">Dashboard</a>

<!-- With parameters -->
<a [routerLink]="['/admin/users', user.id]">Edit User</a>

<!-- With query params -->
<a [routerLink]="['/admin/users']" [queryParams]="{page: 1}">Users</a>

<!-- Active class -->
<a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
```

### 8.3 Route Guards (Future Implementation)

```typescript
// Auth Guard
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};

// Role Guard
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const requiredRoles = route.data['roles'] as UserRole[];

    const userRoles = authService.user().roles;
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));

    if (hasAccess) {
        return true;
    }

    router.navigate(['/admin/dashboard']);
    return false;
};

// Usage in routes
{
    path: 'admin/users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.SUPERADMIN] }
}
```

---

## 9. TROUBLESHOOTING

### 9.1 Common Issues

#### Issue 1: "Token tidak terkirim ke backend"

**Symptom:**

```
POST /api/user/profile → 401 Unauthorized
Header tidak mengandung Authorization
```

**Solution:**

1. Cek apakah token tersimpan:

```typescript
console.log(authService.getAccessToken()); // Should print token
```

2. Cek interceptor terdaftar di config:

```typescript
// app.config.ts
provideHttpClient(
  withFetch(),
  withInterceptors([authInterceptor]) // ✅ Must be registered
);
```

3. Cek URL tidak masuk skip list:

```typescript
const skipUrls = ['/api/auth/login', '/api/auth/refresh'];
// Pastikan URL request tidak ada di list ini
```

---

#### Issue 2: "Setelah refresh, user logout otomatis"

**Symptom:**

```
User login → Bisa akses dashboard
Refresh page → Kembali ke login page
```

**Solution:**

1. Cek LocalStorage:

```typescript
// Browser DevTools → Console
localStorage.getItem('loanova_auth');
// Should return JSON string with token
```

2. Cek constructor AuthService dipanggil:

```typescript
constructor() {
    console.log('AuthService initialized');
    // ... restore logic
}
```

3. Cek signal update:

```typescript
const savedAuth = localStorage.getItem('loanova_auth');
if (savedAuth) {
  const authData = JSON.parse(savedAuth);
  this.userState.set({ ...authData, isAuthenticated: true });
  console.log('User restored:', this.userState());
}
```

---

#### Issue 3: "Sidebar tidak muncul di desktop"

**Symptom:**

```
Mobile → Sidebar bisa dibuka/tutup
Desktop → Sidebar tidak terlihat
```

**Solution:**

1. Cek Tailwind class:

```html
<!-- ✅ CORRECT -->
<aside class="... lg:translate-x-0">
  <!-- ❌ WRONG -->
  <aside class="... lg:-translate-x-full"></aside>
</aside>
```

2. Cek main content padding:

```html
<!-- ✅ CORRECT -->
<main class="... lg:pl-72">
  <!-- ❌ WRONG -->
  <main class="... lg:pl-0"></main>
</main>
```

3. Cek z-index layers:

```
Overlay:  z-40 (lg:hidden)
Sidebar:  z-50
Header:   z-30
Content:  z-0
```

---

#### Issue 4: "Menu tidak filter berdasarkan role"

**Symptom:**

```
Login sebagai MARKETING → Bisa lihat menu "Users" (seharusnya SUPERADMIN only)
```

**Solution:**

1. Cek role tersimpan di state:

```typescript
console.log(authService.user().roles); // ['MARKETING']
```

2. Cek menu configuration:

```typescript
{
    label: 'Users',
    path: '/admin/users',
    icon: 'people',
    roles: [UserRole.SUPERADMIN] // ✅ Should be array
}
```

3. Cek filter logic:

```typescript
return this.allMenuItems.filter((item) => item.roles.some((role) => user.roles.includes(role)));
```

---

#### Issue 5: "Error 401 setelah beberapa menit"

**Symptom:**

```
Login berhasil → Dashboard OK
Setelah 15 menit → Semua request 401
Tidak auto-refresh token
```

**Solution:**

1. Cek interceptor catch 401:

```typescript
catchError((error: HttpErrorResponse) => {
  if (error.status === 401 && !shouldSkip) {
    return handle401Error(authReq, next, authService); // ✅
  }
  return throwError(() => error);
});
```

2. Cek refresh token endpoint:

```typescript
refreshToken(): Observable<ApiResponse<LoginData>> {
    const currentRefreshToken = this.userState().refreshToken;
    console.log('Refreshing with:', currentRefreshToken);
    // Should call /api/auth/refresh
}
```

3. Cek response handling:

```typescript
if (response.success) {
  this.saveState({
    ...this.userState(),
    token: response.data.accessToken, // ✅ Update token
    refreshToken: response.data.refreshToken,
  });
}
```

---

### 9.2 Debugging Tips

#### A. Console Logging Strategy

```typescript
// AuthService
login(credentials: LoginRequestDTO): Observable<ApiResponse<LoginData>> {
    console.log('[AUTH] Login attempt:', credentials.username);
    return this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/login`, credentials).pipe(
        tap(response => {
            console.log('[AUTH] Login response:', response);
            if (response.success && response.data) {
                console.log('[AUTH] Saving state with token:', response.data.accessToken.substring(0, 20) + '...');
                this.saveState({...});
            }
        })
    );
}
```

#### B. Network Monitoring

```
Browser DevTools → Network Tab
1. Filter: XHR
2. Cek request headers: Authorization: Bearer xxx
3. Cek response status: 200 OK vs 401 Unauthorized
4. Cek response body: success, message, data
```

#### C. State Inspection

```typescript
// Component
ngOnInit() {
    effect(() => {
        console.log('[COMPONENT] User state changed:', this.authService.user());
    });
}
```

---

### 9.3 Testing Checklist

```
☐ Login dengan kredensial valid → Berhasil masuk dashboard
☐ Login dengan kredensial invalid → Tampil error message
☐ Login dengan field kosong → Tampil validation error
☐ Logout dari header → Kembali ke login page
☐ Logout → LocalStorage terhapus
☐ Refresh page setelah login → Tetap login (auto-restore)
☐ Buka halaman admin tanpa login → Redirect ke login (jika pakai guard)
☐ Akses menu yang tidak sesuai role → Menu tidak muncul
☐ Biarkan idle 15+ menit → Token auto-refresh (request tetap berhasil)
☐ Hamburger menu di mobile → Sidebar slide in/out
☐ Klik overlay di mobile → Sidebar tertutup
☐ Resize window desktop ↔ mobile → Layout responsive
☐ Token expire total → Logout otomatis + redirect login
```

---

## 🎯 KESIMPULAN

### Sistem yang Sudah Dibuat:

1. **Authentication System:**

   - Login dengan JWT Token
   - Auto-refresh token
   - Persistent login (LocalStorage)
   - Logout functionality

2. **Layout Management:**

   - Responsive admin layout (Desktop + Mobile)
   - Sidebar dengan RBAC
   - Header dengan user info
   - Footer component

3. **State Management:**

   - Reactive state dengan Signals
   - Computed values
   - Centralized auth state

4. **Security:**

   - HTTP Interceptor
   - Token injection
   - Automatic token refresh
   - Role-based access control

5. **Routing:**
   - Nested routes
   - Layout-based routing
   - Redirect strategies

---

### Arsitektur Key Points:

```
┌─────────────────────────────────────────────────┐
│              Application Flow                   │
│                                                 │
│  User Login                                     │
│      ↓                                          │
│  AuthService (Save Token + State)              │
│      ↓                                          │
│  Navigate to Dashboard                          │
│      ↓                                          │
│  AdminLayout Render (Sidebar + Header + Content)│
│      ↓                                          │
│  Every HTTP Request                             │
│      ↓                                          │
│  Interceptor (Add Token)                        │
│      ↓                                          │
│  Backend Response                               │
│      ↓                                          │
│  If 401 → Auto Refresh → Retry                 │
│  If Success → Show Data                         │
│  If Other Error → Show Error                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Next Steps (Future Development):

1. **Route Guards:**

   - Implement `authGuard` untuk protect routes
   - Implement `roleGuard` untuk role-based routing

2. **Advanced Features:**

   - Remember me checkbox
   - Password strength indicator
   - Two-factor authentication
   - Account lockout after failed attempts

3. **UI Enhancements:**

   - Dark mode toggle
   - Sidebar collapse mode
   - Breadcrumb navigation
   - Toast notifications

4. **Performance:**
   - Lazy loading routes
   - Preloading strategies
   - Service worker (PWA)

---

## 📖 REFERENSI

- [Angular Signals Documentation](https://angular.io/guide/signals)
- [Angular HTTP Client](https://angular.io/guide/http)
- [Angular Router](https://angular.io/guide/router)
- [RxJS Documentation](https://rxjs.dev/)
- [JWT Best Practices](https://auth0.com/blog/jwt-handbook/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Created by:** Copilot AI Assistant  
**Date:** January 13, 2026  
**Version:** 1.0.0  
**Project:** Loanova Finance System
