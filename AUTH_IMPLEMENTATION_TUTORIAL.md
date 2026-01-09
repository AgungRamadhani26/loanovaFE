# Panduan Lengkap Implementasi Autentikasi JWT & Refresh Token (Angular v21)

Dokumen ini berisi tutorial langkah-demi-langkah pembuatan fitur autentikasi pada aplikasi **Loanova**. Tutorial ini mencakup seluruh kode sumber, struktur folder modular, dan penjelasan detail mengenai cara kerja setiap bagiannya.

---

## 1. Konfigurasi Lingkungan (Proxy & Permintaan API)

Karena Frontend (port 4200) dan Backend (port 9091) berjalan pada port yang berbeda, kita menggunakan **Proxy Dev Server** untuk menghindari blokir CORS di browser.

### a. `proxy.conf.json`
File ini diletakkan di root direktori proyek. Tugasnya adalah mengalihkan setiap request yang dimulai dengan `/api` ke backend asli di port 9091.

```json
{
  "/api": {
    "target": "http://localhost:9091",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### b. `angular.json` (Konfigurasi Serve)
Daftarkan file proxy tersebut di bagian `serve.options` agar otomatis aktif saat menjalankan `ng serve`.

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  },
  ...
}
```

---

## 2. Struktur Modular Model Data (DTO)

Setiap interface dipisahkan ke dalam file masing-masing untuk meningkatkan kemudahan pemeliharaan (Maintainability).

### a. Enum User Role (`core/models/user-role.enum.ts`)
Mendefinisikan daftar hak akses yang diakui oleh sistem.

```typescript
export enum UserRole {
    SUPERADMIN = 'SUPERADMIN',
    BACKOFFICE = 'BACKOFFICE',
    CUSTOMER = 'CUSTOMER',
    MARKETING = 'MARKETING',
    BRANCHMANAGER = 'BRANCHMANAGER'
}
```

### b. Base Response (`core/models/response/api-response.model.ts`)
Struktur standar untuk setiap jawaban yang diterima dari API Backend.

```typescript
export interface ApiResponse<T> {
    success: boolean;   // Status operasi (true/false)
    message: string;   // Pesan penjelasan dari server
    data: T;           // Payload data utama (dinamis)
    code: number;      // HTTP Code (200, 400, 500, dll)
    timestamp: string; // Waktu pengiriman respons
}
```

### c. Login Request & Response (`request/login-request.model.ts` & `response/login-response.model.ts`)
Kontrak data khusus untuk proses login.

```typescript
// Request
export interface LoginRequestDTO {
    username: string;
    password: string;
}

// Response (Payload di dalam data)
export interface LoginData {
    accessToken: string;
    refreshToken: string;
    type: string;
    username: string;
    roles: UserRole[];
}
```

---

## 3. Manajemen State & Bisnis Logik (`core/services/auth.service.ts`)

`AuthService` adalah pusat kendali autentikasi. Ia menggunakan **Angular Signals** untuk menyimpan data sesi yang reaktif.

```typescript
/**
 * AuthService menangani:
 * 1. Login & Logout
 * 2. Penyimpanan token ke LocalStorage (Persistence)
 * 3. Mekanisme Refresh Token bila Access Token kadaluarsa.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private readonly API_URL = '/api/auth'; // Menggunakan path relatif via Proxy

    // State Internal menggunakan Signal
    private readonly userState = signal<UserState>({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        username: null,
        roles: []
    });

    // Login Method
    async login(credentials: LoginRequestDTO): Promise<ApiResponse<LoginData | null>> {
        try {
            const response = await firstValueFrom(
                this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/login`, credentials)
            );

            if (response.success && response.data) {
                this.saveState({
                    isAuthenticated: true,
                    token: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    username: response.data.username,
                    roles: response.data.roles
                });
            }
            return response;
        } catch (error: any) {
            // Meneruskan error asli backend (termasuk validasi field)
            return error.error || { success: false, message: 'Network Error' };
        }
    }

    // Refresh Token Method
    async refreshToken(): Promise<boolean> {
        const refresh = this.userState().refreshToken;
        if (!refresh) return false;

        try {
            const response = await firstValueFrom(
                this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/refresh`, { refreshToken: refresh })
            );
            if (response.success && response.data) {
                this.saveState({ ...this.userState(), token: response.data.accessToken });
                return true;
            }
            return false;
        } catch {
            this.logout();
            return false;
        }
    }

    private saveState(state: UserState) {
        this.userState.set(state);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('loanova_auth', JSON.stringify(state));
        }
    }
}
```

---

## 4. Middleware Middleware Interceptor (`core/interceptors/auth.interceptor.ts`)

Interceptor bertugas mencegat setiap request HTTP keluar untuk menyisipkan token Authorization.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    // Abaikan endpoint login dan refresh agar tidak terjadi loop
    if (req.url.includes('/login') || req.url.includes('/refresh')) {
        return next(req);
    }

    // Sisipkan Bearer Token
    let authReq = req;
    if (token) {
        authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Jika Error 401 (Unauthorized), coba refresh token otomatis
            if (error.status === 401) {
                return from(authService.refreshToken()).pipe(
                    switchMap(success => {
                        if (success) {
                            // Ulangi request gagal dengan token baru
                            const newToken = authService.getAccessToken();
                            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
                        }
                        return throwError(() => error);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
```

---

## 5. Implementasi UI Login (`features/auth/login/`)

Halaman login bertugas menangkap input user dan menampilkan error yang dikirim oleh backend.

### a. `login.component.ts` (Logika UI)
Tidak menggunakan validasi client-side yang kaku agar pesan validasi asli dari backend bisa ditampilkan.

```typescript
export class LoginComponent {
    readonly username = signal('');
    readonly password = signal('');
    readonly errorMessage = signal<string | null>(null);
    readonly validationErrors = signal<{ [key: string]: string } | null>(null);

    async onSubmit() {
        this.errorMessage.set(null);
        this.validationErrors.set(null);

        const result = await this.authService.login({
            username: this.username(),
            password: this.password()
        });

        if (result.success) {
            this.router.navigate(['/']);
        } else {
            this.errorMessage.set(result.message);
            // Ambil detail error per field (misal: "Username tidak boleh kosong")
            if (result.code === 400 && result.data?.errors) {
                this.validationErrors.set(result.data.errors);
            }
        }
    }
}
```

### b. `login.component.html` (Template)
Menggunakan syntax `@if` untuk menampilkan pesan kesalahan secara dinamis.

```html
<!-- Input Username -->
<input [ngModel]="username()" (ngModelChange)="username.set($event)" 
       [class.border-red-400]="getFieldError('username')">
@if (getFieldError('username')) {
    <p class="text-red-500"># {{ getFieldError('username') }}</p>
}

<!-- Tombol Login dengan Status Loading -->
<button type="submit" [disabled]="isLoading()">
    {{ isLoading() ? 'Sedang Memproses...' : 'Login ke Sistem' }}
</button>
```

---

## 6. Pendaftaran Global (`app.config.ts`)

Langkah terakhir adalah mendaftarkan HTTP Client dan Interceptor agar aktif di seluruh aplikasi.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(), // Untuk performa SSR
      withInterceptors([authInterceptor]) // Aktifkan Middleware Token
    ),
    ...
  ]
};
```

---
**Ingat: Setiap kali mengubah `proxy.conf.json` atau `angular.json`, server `ng serve` harus di-restart!**
