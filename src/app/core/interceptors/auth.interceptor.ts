import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * AUTH INTERCEPTOR
 *
 * Bayangkan ini sebagai 'Pintu Gerbang' atau 'Satpam' aplikasi.
 * Setiap ada data yang mau keluar (Request) atau mau masuk (Response), dia yang periksa.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    // 1. Kita panggil 'Kunci' (Token) dari AuthService
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    // 2. TENTUKAN ALAMAT YANG GAK PERLU TOKEN
    // Kalo mau login, kita belum punya token, jadi jangan dipasangin token.
    const skipUrls = ['/api/auth/login', '/api/auth/refresh'];
    const shouldSkip = skipUrls.some(url => req.url.includes(url));

    let authReq = req;

    /**
     * LANGKAH 1: PASANG TOKEN (REQUEST)
     * Kalo kita punya token dan alamatnya BUKAN alamat login,
     * kita masukkan token tersebut ke 'Header' paket data kita.
     */
    if (token && !shouldSkip) {
        // Kita cloning request aslinya, lalu kita tambahkan header Authorization
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}` // Format standar JWT: 'Bearer <kuncinya>'
            }
        });
    }

    /**
     * LANGKAH 2: PANTAU JAWABAN (RESPONSE)
     * next(authReq) artinya 'Lepaskan paket data ke internet'.
     * .pipe(catchError(...)) artinya 'Kalo ada error dari server, lakukan sesuatu'.
     */
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            /**
             * PENANGANAN ERROR 401 (UNAUTHORIZED / TOKEN MATI)
             * Kalo server bilang 401, artinya 'AccessToken kamu sudah basi/kadaluarsa'.
             */
            if (error.status === 401 && !shouldSkip) {
                // Panggil bantuan buat refresh kuncinya secara otomatis!
                return handle401Error(authReq, next, authService);
            }
            // Kalo errornya bukan 401 (misal error 500), kita lempar aja ke UI biar UI yang handle.
            return throwError(() => error);
        })
    );
};

/**
 * HANDLE REFRESH TOKEN SECARA DIAM-DIAM (SILENT REFRESH)
 * Gunanya: Biar user gak ngerasa tokennya abis, dia gak bakal disuruh logout.
 */
function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
    // 1. Minta AuthService buat tukerin RefreshToken jadi AccessToken baru
    return authService.refreshToken().pipe(
        /**
         * SWITCHMAP:
         * Gunanya buat nunda request yang tadinya gagal (tunggu dapet token baru dulu).
         */
        switchMap((response) => {
            if (response.success) {
                // YEAY! Dapet token baru. Sekarang kita ambil kuncinya.
                const newToken = authService.getAccessToken();

                // 2. Kloning ulang request lama yang GAGAL tadi, pasangin TOKEN BARU.
                const retryReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${newToken}`
                    }
                });

                // 3. Kirim ulang paketnya! User gak bakal tau kalo tadi sempet gagal.
                return next(retryReq);
            } else {
                // Kalo usaha refresh gagal juga (misal: RefreshToken juga abis masanya)
                authService.clearAuthState(); // Paksa keluar
                return throwError(() => new Error('Sesi sudah habis, silakan login ulang.'));
            }
        }),
        catchError((err) => {
            // Kalo koneksi putus pas lagi refresh
            authService.clearAuthState();
            return throwError(() => err);
        })
    );
}
