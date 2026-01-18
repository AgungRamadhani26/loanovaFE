# Tutorial Lengkap Implementasi Sistem Autentikasi Angular (JWT + Refresh Token + SSR Safe)

Dokumentasi ini dibuat sebagai panduan lengkap untuk memahami kode autentikasi yang telah diimplementasikan dalam proyek **Loanova Frontend**. Kode ini mencakup fitur Login, Logout, penyimpanan aman terenkripsi, Refresh Token otomatis (silent refresh), dan kompatibilitas dengan Server-Side Rendering (SSR).

Setiap bagian kode di bawah ini akan dijelaskan baris demi baris agar mudah dipahami.

---

## DAFTAR ISI

1.  **Model & State** (Struktur data user)
2.  **Storage Utility** (Penyimpanan aman dengan AES)
3.  **Authentication Service** (Otak logika bisnis)
4.  **Auth Interceptor** (Satpam jaringan & Refresh Token otomatis)
5.  **Auth Guard** (Pelindung halaman/rute)
6.  **Login Component** (Tampilan & Interaksi User)

---

## 1. Model & State (`user-state.model.ts`)

File ini mendefinisikan bentuk data user yang akan kita simpan di memori aplikasi (RAM).

### Kode

```typescript
import { UserRole } from './user-role.enum';

/**
 * Model untuk melacak state user di frontend.
 */
export interface UserState {
  isAuthenticated: boolean; // Status apakah user sudah login atau belum (true/false)
  token: string | null; // Access Token JWT (digunakan untuk request API)
  refreshToken: string | null; // Refresh Token (digunakan untuk minta token baru jika expired)
  username: string | null; // Nama pengguna (untuk ditampilkan di navbar)
  roles: UserRole[]; // Daftar peran user (misal: ADMIN, USER)
  permissions: string[]; // Daftar izin spesifik (misal: LOAN:READ, BRANCH:CREATE)
}
```

### Penjelasan

- **`isAuthenticated`**: Penanda sederhana agar UI tahu harus menampilkan menu "Login" atau "Logout".
- **`token`**: Kunci akses utama yang punya masa berlaku pendek (misal 15 menit). Ini yang dikirim di header setiap request.
- **`refreshToken`**: Kunci cadangan dengan masa berlaku panjang (misal 7 hari). Jika `token` habis, kita tukar `refreshToken` ini dengan `token` baru ke server.
- **`permissions`**: Sangat penting untuk fitur UI. Contoh: Tombol "Hapus Cabang" hanya muncul jika user punya permission `BRANCH:DELETE`.

---

## 2. Storage Utility (`storage-util.ts`)

Kita tidak boleh menyimpan token sensitif begitu saja di `localStorage` karena mudah dibaca orang jika laptop tertinggal dalam keadaan terbuka. Kita gunakan enkripsi AES.

### Kode

```typescript
import * as CryptoJS from 'crypto-js';

/**
 * STORAGE UTILITY (SECURE VERSION)
 * Menggunakan AES Encryption (crypto-js) untuk mengamankan data di LocalStorage.
 */
export class StorageUtil {
  // Kunci rahasia enkripsi. Di aplikasi real, ini sebaiknya diambil dari environment variable.
  private static readonly SECRET_KEY = 'loanova-secret-key-2026';

  /**
   * Menyimpan data dengan enkripsi AES
   * Flow: Data Asli -> JSON String -> Enkripsi AES -> LocalStorage
   */
  static setItem(key: string, value: any): void {
    try {
      const jsonString = JSON.stringify(value);
      // Proses mengubah teks biasa menjadi kode acak (Ciphertext)
      const encryptedData = CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY).toString();
      localStorage.setItem(key, encryptedData);
    } catch (e) {
      console.error('Error secure-saving to localStorage', e);
    }
  }

  /**
   * Mengambil data dan melakukan dekripsi AES
   * Flow: LocalStorage -> Data Terenkripsi -> Dekripsi AES -> JSON Parse -> Data Asli
   */
  static getItem<T>(key: string): T | null {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;

      // Proses mengubah kode acak kembali menjadi teks biasa
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) return null;

      return JSON.parse(decryptedString) as T;
    } catch (e) {
      console.error('Error secure-reading from localStorage', e);
      // Jika gagal dekripsi (misal data diotak-atik manual), hapus saja datanya agar aman
      localStorage.removeItem(key);
      return null;
    }
  }

  // Helper standar untuk menghapus data
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
```

---

## 3. Authentication Service (`auth.service.ts`)

Ini adalah komponen paling krusial. Service ini mengatur flow login, logout, dan penyimpanan state.

### Kode

```typescript
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Penting untuk cek SSR vs Browser
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Injeksi router baru ditambahkan
import { Observable, tap } from 'rxjs';

// Import model-model terkait
import { UserState } from '../models/user-state.model';
import { LoginRequestDTO } from '../models/request/login-request.model';
import { ApiResponse } from '../models/response/api-response.model';
import { LoginData } from '../models/response/login-response.model';
import { StorageUtil } from '../utils/storage-util';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Injeksi dependency bergaya modern (sejak Angular 14+)
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); // Token untuk tahu kita sedang di Server atau Browser
  private router = inject(Router);

  private readonly API_URL = '/api/auth';

  /**
   * STATE MANAGEMENT DENGAN SIGNALS
   * Kita inisialisasi state awal dengan nilai kosong/false.
   */
  private readonly userState = signal<UserState>({
    isAuthenticated: false,
    token: null,
    refreshToken: null,
    username: null,
    roles: [],
    permissions: [], // Default array kosong
  });

  // Computed signal agar komponen luar bisa baca data tanpa bisa mengubahnya sembarangan
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => this.userState().isAuthenticated);

  constructor() {
    /**
     * LOGIKA AUTO-LOGIN (RESTORE SESSION)
     * Cek LocalStorage hanya jika kita berada di Browser (bukan di Server/Node.js).
     * Server tidak punya LocalStorage, jadi kode ini akan error jika dijalankan di server tanpa pengecekan.
     */
    if (isPlatformBrowser(this.platformId)) {
      // Ambil data terenkripsi dari 'lemari'
      const authData = StorageUtil.getItem<any>('loanova_auth');
      if (authData) {
        // Jika ketemu, kembalikan state user seperti sedia kala
        this.userState.set({
          permissions: [], // Default safety jika data lama tidak punya permission
          ...authData, // Timpa dengan data dari storage
          isAuthenticated: true, // Set status jadi Login
        });
      }
    }
  }

  /**
   * FUNGSI LOGIN UTAMA
   */
  login(credentials: LoginRequestDTO): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/login`, credentials).pipe(
      // Operator 'tap' digunakan untuk side-effect (melakukan sesuatu tanpa mengubah data stream)
      tap((response) => {
        if (response.success && response.data) {
          // Jika sukses, simpan data ke state aplikasi
          this.saveState({
            isAuthenticated: true,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            username: response.data.username,
            roles: response.data.roles,
            permissions: response.data.permissions || [], // Handle null safety
          });
        }
      })
    );
  }

  /**
   * FUNGSI REFRESH TOKEN
   * Dipanggil oleh Interceptor secara otomatis di belakang layar.
   */
  refreshToken(): Observable<ApiResponse<LoginData>> {
    const currentRefreshToken = this.userState().refreshToken;

    return this.http
      .post<ApiResponse<LoginData>>(`${this.API_URL}/refresh`, {
        refreshToken: currentRefreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Update state dengan token baru, tapi pertahankan data user lama yang tidak berubah
            this.saveState({
              ...this.userState(),
              token: response.data.accessToken,
              refreshToken: response.data.refreshToken, // Token refresh mungkin dirotasi juga oleh server
            });
          }
        })
      );
  }

  /**
   * LOGOUT LENGKAP
   */
  logout(): Observable<ApiResponse<null>> {
    const currentRefreshToken = this.userState().refreshToken;

    // 1. Beritahu server token ini sudah tidak valid
    return this.http
      .post<ApiResponse<null>>(`${this.API_URL}/logout`, {
        refreshToken: currentRefreshToken,
      })
      .pipe(
        tap(() => {
          // 2. Apapun jawaban server, bersihkan browser klien
          this.clearAuthState();
        })
      );
  }

  /**
   * MEMBERSIHKAN JEJAK AUTH
   */
  clearAuthState() {
    // Reset Signal ke kondisi awal
    this.userState.set({
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      username: null,
      roles: [],
      permissions: [],
    });

    // Hapus data fisik di storage browser
    if (isPlatformBrowser(this.platformId)) {
      StorageUtil.removeItem('loanova_auth');
    }

    // PENTING: Redirect user kembali ke halaman login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Helper privat untuk menyimpan ke dua tempat: Signal & Storage
   */
  saveState(state: UserState) {
    this.userState.set(state);
    // Simpan ke storage hanya jika di browser
    if (isPlatformBrowser(this.platformId)) {
      const { isAuthenticated, ...saveData } = state; // Kita simpan datanya saja, status isAuthenticated otomatis true kalau data ada
      StorageUtil.setItem('loanova_auth', saveData);
    }
  }

  // Getter sederhana untuk diambil oleh component/interceptor lain
  getAccessToken(): string | null {
    return this.userState().token;
  }

  hasRefreshToken(): boolean {
    return !!this.userState().refreshToken;
  }
}
```

---

## 4. Auth Interceptor (`auth.interceptor.ts`)

Interceptor ini bekerja seperti middleware. Dia menangkap setiap request HTTP keluar dan response HTTP masuk. Di sinilah letak logika "Silent Refresh Token" yang rumit untuk mencegah _race condition_.

### Kode

```typescript
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * LOGIKA CONCURRENCY (MUTEX LOCK)
 * Variabel ini diletakkan di luar fungsi interceptor agar menjadi 'Global' (Singleton)
 * Gunanya mencegah request refresh token dikirim berkali-kali jika ada banyak request gagal bersamaan.
 */
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null); // Antrian token baru

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const token = authService.getAccessToken();

  // Tentukan URL mana yang JANGAN diberi token (Login & Refresh itu sendiri)
  const skipUrls = ['/api/auth/login', '/api/auth/refresh'];
  const shouldSkip = skipUrls.some((url) => req.url.includes(url));

  let authReq = req;

  // LANGKAH 1: TEMPELKAN ACCESS TOKEN JIKA ADA
  if (token && !shouldSkip) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // LANGKAH 2: HANDLE RESPONSE & ERROR
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Jika error 401 (Unauthorized) muncul, berarti token expired atau tidak valid
      if (error.status === 401 && !shouldSkip) {
        // Kita hanya bisa refresh token di Browser (Client Side), bukan saat SSR di Server
        if (isBrowser && authService.hasRefreshToken()) {
          return handle401Error(authReq, next, authService);
        }

        // Jika di server atau tidak punya refresh token, logout saja
        authService.clearAuthState();
      }
      // Error lain (500, 404, dll) biarkan lewat agar ditangani UI
      return throwError(() => error);
    })
  );
};

// LOGIKA UTAMA REFRESH TOKEN
function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  // Skenario 1: Belum ada yang melakukan refresh token
  if (!isRefreshing) {
    isRefreshing = true; // Pasang bendera 'Lagi sibuk refresh'
    refreshTokenSubject.next(null); // Kosongkan antrian token

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false; // Turunkan bendera
        if (response.success && response.data?.accessToken) {
          // Kabari semua request yang sedang mengantri token baru
          refreshTokenSubject.next(response.data.accessToken);

          // Ulangi request Milik KITA sendiri yang tadi gagal
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.data.accessToken}`,
            },
          });
          return next(retryReq);
        } else {
          // Jika refresh gagal (misal refresh token juga expired), logout paksa
          authService.clearAuthState();
          return throwError(() => new Error('Refresh token invalid'));
        }
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.clearAuthState();
        return throwError(() => err);
      })
    );
  } else {
    // Skenario 2: Sudah ada request lain yang sedang refresh token
    // KITA HARUS MENGANTRI (WAITING)
    return refreshTokenSubject.pipe(
      filter((token) => token !== null), // Filter: hanya lolos jika token TIDAK null (artinya token baru sudah ada)
      take(1), // Ambil 1 nilai saja lalu berhenti subscribe (biar ga memory leak)
      switchMap((token) => {
        // Token baru sudah tersedia! Pakai token itu untuk request ulang
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(retryReq);
      })
    );
  }
}
```

---

## 5. Auth Guard (`auth.guard.ts`)

Guard ini mencegah akses tidak sah ke halaman admin. Kita tambahkan logika khusus SSR.

### Kode

```typescript
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Penting!
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  /**
   * FIX UNTUK MASALAH RELOAD HALAMAN (SSR)
   * Saat user me-refresh browser, request pertama kali dilayani oleh Server (Node.js).
   * Server TIDAK punya LocalStorage. Jadi authService.isAuthenticated() pasti false.
   * Jika kita langsung return false, server akan me-redirect ke login page (padahal user sebenernya login).
   *
   * Solusi: Ijinkan Server merender halaman (return true).
   * Validasi sesungguhnya akan terjadi detik berikutnya saat JavaScript Browser aktif (Hydration).
   */
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Validasi Normal (Browser Only)
  if (authService.isAuthenticated()) {
    return true; // Boleh masuk
  }

  // Jika tidak punya akses, tendang ke login page
  // queryParams 'returnUrl' berguna agar setelah login user dibalikin ke halaman yang tadi dia tuju.
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

---

## 6. Login Component (`login.component.ts`)

Ini adalah antarmuka pengguna akhir. Logikanya sederhana: ambil input -> kirim ke service -> handle sukses/gagal.

### Kode

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Menggunakan Signal untuk data binding yang reaktif dan modern
  readonly username = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<{ [key: string]: string } | null>(null); // Menyimpan error per field (misal: "password kurang panjang")
  readonly showPassword = signal(false);

  onSubmit() {
    // Reset state error sebelum request baru
    this.errorMessage.set(null);
    this.validationErrors.set(null);
    this.isLoading.set(true);

    this.authService
      .login({
        username: this.username(),
        password: this.password(),
      })
      .subscribe({
        next: (result) => {
          if (result.success) {
            // Redirect ke Dashboard jika sukses
            this.router.navigate(['/admin/dashboard']);
          } else {
            // Tampilkan pesan error dari backend
            this.errorMessage.set(result.message);

            // Jika ada validasi field spesifik (Error 400 Bad Request)
            if (result.code === 400 && result.data && (result.data as any).errors) {
              this.validationErrors.set((result.data as any).errors);
            }
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          // Handling jika server mati atau internet putus
          const apiError = err.error;
          if (apiError) {
            this.errorMessage.set(apiError.message);
          } else {
            this.errorMessage.set('Waduh, koneksinya lagi bermasalah atau server lagi tidur.');
          }
          this.isLoading.set(false);
        },
      });
  }

  // Helper untuk HTML mempermudah pengecekan error
  getFieldError(field: string): string | undefined {
    return this.validationErrors()?.[field];
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }
}
```

---

Semoga dokumentasi ini membantu memahami alur kerja sistem autentikasi yang aman dan handal!
