import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRole } from '../models/user-role.enum';
import { UserState } from '../models/user-state.model';
import { LoginRequestDTO } from '../models/request/login-request.model';
import { ApiResponse } from '../models/response/api-response.model';
import { LoginData } from '../models/response/login-response.model';

/**
 * AUTH SERVICE
 *
 * Jantung manajemen autentikasi aplikasi.
 * - Mengelola state user menggunakan Angular Signals (Source of Truth).
 * - Sinkronisasi sesi dengan LocalStorage (Persistence).
 * - Berinteraksi dengan API Backend untuk Login & Refresh Token.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Dependency Injection
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID); // Digunakan untuk cek apakah berjalan di Browser atau Server (SSR)

    // Urutan pendaftaran API (Melalui Proxy Dev Server)
    private readonly API_URL = '/api/auth';

    /**
     * Sesi User State (Private Signal)
     * Menggunakan object reaktif untuk menyimpan seluruh data sesi.
     */
    private readonly userState = signal<UserState>({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        username: null,
        roles: []
    });

    /**
     * Signal Publik (Read-only)
     * Komponen UI cukup "subscribe" ke signal ini untuk mendapatkan data terbaru otomatis.
     */
    readonly user = computed(() => this.userState());
    readonly isAuthenticated = computed(() => this.userState().isAuthenticated);

    constructor() {
        /**
         * INITIALIZATION:
         * Saat aplikasi pertama kali dimuat, kita coba ambil data sesi dari LocalStorage.
         * Hanya dilakukan di Browser (isPlatformBrowser) agar tidak error saat SSR.
         */
        if (isPlatformBrowser(this.platformId)) {
            const savedAuth = localStorage.getItem('loanova_auth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    // Kembalikan state ke signal internal
                    this.userState.set({ ...authData, isAuthenticated: true });
                } catch (e) {
                    // Jika data korup, hapus dari storage
                    localStorage.removeItem('loanova_auth');
                }
            }
        }
    }

    /**
     * PROSES LOGIN
     * @param credentials Objek berisi username & password
     * @returns Observable berisi ApiResponse dari backend
     *
     * Menggunakan Observable pattern untuk reactive programming.
     * Component harus subscribe untuk mendapatkan hasilnya.
     */
    login(credentials: LoginRequestDTO): Observable<ApiResponse<LoginData>> {
        return this.http.post<ApiResponse<LoginData>>(
            `${this.API_URL}/login`,
            credentials
        );
    }

    /**
     * REFRESH TOKEN FLOW
     * Dipanggil secara otomatis oleh AuthInterceptor saat access token kadaluarsa (401).
     * @returns Observable<boolean> Sukses atau tidaknya penyegaran token
     */
    refreshToken(): Observable<ApiResponse<LoginData>> {
        const currentRefreshToken = this.userState().refreshToken;
        return this.http.post<ApiResponse<LoginData>>(`${this.API_URL}/refresh`, {
            refreshToken: currentRefreshToken
        });
    }

    /**
     * LOGOUT
     * Membersihkan state di memori (signal) dan storage permanen (LocalStorage).
     */
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

    /**
     * PERSISTENCE HELPER
     * Sinkronisasi antara memori aplikasi (Signals) dan penyimpanan browser.
     */
    saveState(state: UserState) {
        this.userState.set(state);
        // Kita tidak menyimpan flag isAuthenticated di LocalStorage demi keamanan
        if (isPlatformBrowser(this.platformId)) {
            const { isAuthenticated, ...saveData } = state;
            localStorage.setItem('loanova_auth', JSON.stringify(saveData));
        }
    }

    /**
     * TOKEN GETTER
     * Memudahkan AuthInterceptor untuk mengambil token aktif.
     */
    getAccessToken(): string | null {
        return this.userState().token;
    }
}
