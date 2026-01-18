import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Variable global untuk menangani concurrent refresh token
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * AUTH INTERCEPTOR
 *
 * Bayangkan ini sebagai 'Pintu Gerbang' atau 'Satpam' aplikasi.
 * Setiap ada data yang mau keluar (Request) atau mau masuk (Response), dia yang periksa.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    // 1. Kita panggil 'Kunci' (Token) dari AuthService
    const authService = inject(AuthService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);
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
                // HANYA COBA REFRESH JIKA: di Browser DAN punta refreshToken
                if (isBrowser && authService.hasRefreshToken()) {
                    return handle401Error(authReq, next, authService);
                }

                // Jika tidak, langsung bersihkan state & lempar error
                authService.clearAuthState();
            }
            // Kalo errornya bukan 401 (misal error 500), kita lempar aja ke UI biar UI yang handle.
            return throwError(() => error);
        })
    );
};

/**
 * HANDLE REFRESH TOKEN SECARA DIAM-DIAM (SILENT REFRESH)
 * Gunanya: Biar user gak ngerasa tokennya abis, dia gak bakal disuruh logout.
 * Dilengkapi dengan mekanisme 'Locking' (Mutex) agar tidak bentrok kalau ada banyak request sekaligus.
 */
function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
    // Jika belum ada yang lagi refresh, kita yang ambil alih
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null); // Reset sinyal

        return authService.refreshToken().pipe(
            switchMap((response) => {
                isRefreshing = false;
                if (response.success && response.data?.accessToken) {
                    // YEAY! Dapet token baru.
                    // Kabari semua request yang lagi ngantri
                    refreshTokenSubject.next(response.data.accessToken);

                    // Ulangi request kita sendiri
                    const retryReq = req.clone({
                        setHeaders: {
                            Authorization: `Bearer ${response.data.accessToken}`
                        }
                    });
                    return next(retryReq);
                } else {
                    // Gagal refresh
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
        // Jika sedang refresh, kita NGANTRI sampai dapet sinyal token baru
        return refreshTokenSubject.pipe(
            filter(token => token !== null), // Tunggu sampe token TIDAK null
            take(1), // Ambil satu kali aja
            switchMap(token => {
                // Token baru udah dateng, pake buat request ulang
                const retryReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(retryReq);
            })
        );
    }
}
