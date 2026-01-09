import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LOGIN COMPONENT
 * 
 * Mengelola UI Form Login dan interaksi autentikasi dengan backend.
 * Menggunakan arsitektur Standalone (Angular v21+) agar modular dan ringan.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    // Injeksi Dependency menggunakan inject() fungsional
    private authService = inject(AuthService);
    private router = inject(Router);

    /**
     * REACTIVE STATE (Signals)
     * Menggunakan signal() untuk performa deteksi perubahan yang optimal.
     */
    readonly username = signal('');
    readonly password = signal('');
    readonly isLoading = signal(false); // Melacak status request API (untuk spinner tombol)
    readonly errorMessage = signal<string | null>(null); // Pesan error umum (misal: "Kredensial salah")
    readonly validationErrors = signal<{ [key: string]: string } | null>(null); // Detail error per field dari backend
    readonly showPassword = signal(false); // Toggle mata mata password

    /**
     * ONSUBMIT
     * Alur: View -> Component -> AuthService -> API Backend -> Response -> UI Update
     */
    async onSubmit() {
        /**
         * Langkah 1: Reset State Error
         * Penting agar pesan lama tidak menempel saat user mencoba lagi.
         */
        this.errorMessage.set(null);
        this.validationErrors.set(null);

        /**
         * Langkah 2: Aktifkan Loading
         * Mendisable tombol agar tidak terjadi double-submit.
         */
        this.isLoading.set(true);

        try {
            /**
             * Langkah 3: Eksekusi Login via Service
             * Data dikirim langsung ke backend tanpa validasi client-side yang berlebihan 
             * agar pesan error asli backend (seperti "Username tidak boleh kosong") bisa muncul.
             */
            const result = await this.authService.login({
                username: this.username(),
                password: this.password()
            });

            /**
             * Langkah 4: Evaluasi Respons API
             */
            if (result.success) {
                // LOGIN BERHASIL: User diarahkan ke halaman utama.
                this.router.navigate(['/']);
            } else {
                // LOGIN GAGAL: Ambil 'message' umum dari API.
                this.errorMessage.set(result.message);

                /**
                 * Langkah 5: Tangani Error Validasi (API Error 400)
                 * Mengekstrak map error dari field 'data.errors' kiriman backend.
                 */
                if (result.code === 400 && result.data && (result.data as any).errors) {
                    this.validationErrors.set((result.data as any).errors);
                }
            }
        } catch (err) {
            // Error Jaringan: Jika server mati atau endpoint tidak ditemukan.
            this.errorMessage.set('Koneksi bermasalah atau server tidak merespons.');
        } finally {
            // Matikan loading apapun hasilnya.
            this.isLoading.set(false);
        }
    }

    /**
     * GET FIELD ERROR
     * Helper fungsional yang digunakan di template (.html) untuk mengecek 
     * apakah suatu field memiliki pesan error spesifik dari backend.
     */
    getFieldError(field: string): string | undefined {
        return this.validationErrors()?.[field];
    }

    /**
     * TOGGLE PASSWORD
     * Mengubah state visibilitas password secara reaktif.
     */
    togglePassword() {
        this.showPassword.update(v => !v);
    }
}
