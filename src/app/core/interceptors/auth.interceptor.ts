import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * AUTH INTERCEPTOR (Functional)
 * 
 * Bertindak sebagai middleware untuk setiap request HTTP yang keluar dari aplikasi.
 * Tugas Utama:
 * 1. Inject Token: Menambahkan Header Authorization ke setiap request.
 * 2. Auto-Refresh: Jika server membalas 401 (kadaluarsa), lakukan refresh token otomatis.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    // Inject service secara fungsional (bukan via constructor)
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    /**
     * WHITELIST ENDPOINTS:
     * Daftar URL yang tidak boleh disisipi token (seperti login atau refresh itu sendiri).
     */
    const skipUrls = ['/api/auth/login', '/api/auth/refresh'];
    const shouldSkip = skipUrls.some(url => req.url.includes(url));

    let authReq = req;

    // Langkah 1: Sisipkan token "Bearer" jika ada dan tidak dalam blacklist
    if (token && !shouldSkip) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    /**
     * Langkah 2: Tangani respons dari server
     * pipa .PIPE() digunakan untuk mencegat error.
     */
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            /**
             * TOKEN EXPIRED HANDLING (HTTP 401):
             * Jika token mati ditengah jalan, jangan langsung lempar error ke user.
             * Cobalah untuk memanggil fungsi refreshToken di background.
             */
            if (error.status === 401 && !shouldSkip) {
                return handle401Error(authReq, next, authService);
            }
            return throwError(() => error);
        })
    );
};

/**
 * HELPER: HANDLE 401 ERROR
 * Mengintegrasikan alur 'silent refresh token' ke dalam aliran RxJS.
 */
function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
    /**
     * Ubah Promise refreshToken() menjadi Observable (RxJS) menggunakan from()
     * switchMap() digunakan untuk beralih dari satu alur request ke alur request baru.
     */
    return from(authService.refreshToken()).pipe(
        switchMap((success) => {
            if (success) {
                /**
                 * RE-TRY MECHANISM:
                 * Jika refresh token berhasil, kita ambil token baru yang baru saja disimpan.
                 * Kloning request lama yang gagal tadi, ganti Bearer-nya, lalu kirim ulang.
                 */
                const newToken = authService.getAccessToken();
                const retryReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${newToken}`
                    }
                });
                // Kirim ulang request yang tertunda
                return next(retryReq);
            } else {
                // Jika refresh gagal (misal: refresh token habis masa berlakunya), lempar error sesi habis
                authService.logout();
                return throwError(() => new Error('Session Expired'));
            }
        }),
        catchError((err) => {
            // Jika terjadi error teknis saat refresh, keluarkan user secara paksa
            authService.logout();
            return throwError(() => err);
        })
    );
}
