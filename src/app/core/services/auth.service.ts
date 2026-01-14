import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Mengimpor Model Modular (Struktur folder request/response baru)
import { UserRole } from '../models/user-role.enum';
import { UserState } from '../models/user-state.model';
import { LoginRequestDTO } from '../models/request/login-request.model';
import { ApiResponse } from '../models/response/api-response.model';
import { LoginData } from '../models/response/login-response.model';

/**
 * AUTH SERVICE
 *
 * Ini adalah pusat kendali (Hub) untuk semua urusan login.
 * Kenapa di folder 'core'? Karena auth ini dipake di seluruh aplikasi dari ujung ke ujung.
 */
@Injectable({
    providedIn: 'root' // Berarti service ini adalah 'singleton' (cuma ada 1 instance di aplikasi)
})
export class AuthService {
    // 1. INJEKSI DEPENDENCY
    // HttpClient: Buat ngobrol sama backend (GET/POST/PUT/DELETE)
    private http = inject(HttpClient);
    // platformId: Buat ngecek kita lagi di browser atau di server (Penting buat Angular SSR)
    private platformId = inject(PLATFORM_ID);

    // Alamat API (Ditangkap oleh proxy.conf.json lalu dioper ke http://localhost:9091)
    private readonly API_URL = '/api/auth';

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     * Signal itu ibarat 'kotak' reaktif. Kalo isinya berubah, semua yang 'nonton' bakal ikut berubah otomatis.
     */
    private readonly userState = signal<UserState>({
        isAuthenticated: false, // Status awal: belum login
        token: null,           // Token akses (kosong)
        refreshToken: null,    // Token penyegar (kosong)
        username: null,        // Nama user (kosong)
        roles: []              // Hak akses (kosong)
    });

    /**
     * SIGNAL PUBLIK (READ-ONLY)
     * Kita sediain signal publik agar komponen lain bisa baca data user tapi GAK BISA asal ngrubah.
     */
    readonly user = computed(() => this.userState()); // Ngikutin userState
    readonly isAuthenticated = computed(() => this.userState().isAuthenticated); // Shortcut buat cek status login

    constructor() {
        /**
         * AUTO-LOGIN (PERSISTENCE)
         * Pas aplikasi pertama kali dibuka (di refresh), kita cek di 'lemari' (LocalStorage)
         * apakah ada data login yang tertinggal dari sesi sebelumnya.
         */
        if (isPlatformBrowser(this.platformId)) { // Cek: Apakah kita di Browser? (LocalStorage cuma ada di browser)
            const savedAuth = localStorage.getItem('loanova_auth');
            if (savedAuth) {
                try {
                    // Kalo ada, kita 'bongkar' JSON-nya jadi objek
                    const authData = JSON.parse(savedAuth);
                    // Kita masukkin balik datanya ke Signal biar aplikasi tau kita udah login
                    this.userState.set({ ...authData, isAuthenticated: true });
                } catch (e) {
                    // Kalo datanya rusak/gak valid, kita bersihin aja
                    localStorage.removeItem('loanova_auth');
                }
            }
        }
    }

    /**
     * FUNGSI LOGIN (OBSERVABLE PATTERN)
     * @param credentials: Berisi username & password yang diisi user di form
     * @returns: 'Stream' data (Observable) yang isinya jawaban dari server
     */
    login(credentials: LoginRequestDTO): Observable<ApiResponse<LoginData>> {
        // Melakukan request POST ke backend
        return this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/login`, credentials).pipe(
            /**
             * OPERATOR TAP:
             * Gunanya buat ngelakuin 'Side-Effect'.
             * Maksudnya: Sambil data login lewat, kita 'nyolong' datanya buat disimpen ke Signal & LocalStorage.
             */
            tap(response => {
                // Kalo backend bilang Sukses (true) dan ngasih data token
                if (response.success && response.data) {
                    // Update signal state (Biar UI navbar berubah dari 'Masuk' jadi nama user)
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

    /**
     * FUNGSI REFRESH TOKEN
     * Dipanggil otomatis sama interceptor kalo 'accessToken' habis masanya (biasanya 15 menit).
     */
    refreshToken(): Observable<ApiResponse<LoginData>> {
        const currentRefreshToken = this.userState().refreshToken;
        // Kita kirim 'refreshToken' yang sudah kita simpen tadi ke backend buat dapet token baru
        return this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/refresh`, {
            refreshToken: currentRefreshToken
        }).pipe(
            tap(response => {
                if (response.success && response.data) {
                    // Kalo dapet token baru, kita update 'lemari' (LocalStorage) & Signal kita
                    this.saveState({
                        ...this.userState(), // Gabungin data lama
                        token: response.data.accessToken, // Update access token baru
                        refreshToken: response.data.refreshToken // Update refresh token baru
                    });
                }
            })
        );
    }

    /**
     * LOGOUT
     * Memanggil API logout backend untuk invalidasi token di server, 
     * kemudian membersihkan state lokal (signal & localStorage).
     */
    logout(): Observable<ApiResponse<null>> {
        const currentRefreshToken = this.userState().refreshToken;
        
        // Kirim request logout ke backend dengan refreshToken di body
        return this.http.post<ApiResponse<null>>(`${this.API_URL}/logout`, {
            refreshToken: currentRefreshToken
        }).pipe(
            tap(() => {
                // Setelah logout berhasil di backend, bersihkan state lokal
                this.clearAuthState();
            })
        );
    }

    /**
     * CLEAR AUTH STATE (HELPER)
     * Membersihkan seluruh state autentikasi dari memory dan localStorage.
     * Dipanggil setelah logout atau saat token tidak valid.
     */
    clearAuthState() {
        // 1. Kosongin Signal (UI bakal otomatis balik ke tampilan Guest)
        this.userState.set({
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            username: null,
            roles: []
        });
        // 2. Buang token dari LocalStorage biar pas di refresh gak login otomatis lagi
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('loanova_auth');
        }
    }

    /**
     * PENYIMPANAN STATE (HELPER)
     * Fungsi buat nyimpen data ke 2 tempat sekaligus: Signal (Memori RAM) & LocalStorage (Harddisk/Storage)
     */
    saveState(state: UserState) {
        // 1. Simpen ke Signal (Buat dipake aplikasi yang lagi jalan sekarang)
        this.userState.set(state);

        // 2. Simpen ke Browser Storage (Biar kalo di refresh tetep login)
        if (isPlatformBrowser(this.platformId)) {
            const { isAuthenticated, ...saveData } = state; // Gak perlu simpen flag 'isAuthenticated' biar lebih rapi
            localStorage.setItem('loanova_auth', JSON.stringify(saveData));
        }
    }

    /**
     * AMBIL TOKEN (GETTER)
     * Dipake sama Interceptor buat nampilin 'Authorization: Bearer <TOKEN>' di setiap request
     */
    getAccessToken(): string | null {
        return this.userState().token;
    }
}
