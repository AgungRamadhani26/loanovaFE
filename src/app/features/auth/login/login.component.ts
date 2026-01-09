import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LOGIN COMPONENT
 * 
 * Ini adalah 'Otak' dari tampilan halaman login.
 * Menangani inputan user, tombol klik, dan nampilin pesan error kusam dari backend.
 */
@Component({
    selector: 'app-login', // Nama tag buat manggil komponen ini
    standalone: true,      // Pola Angular modern: gak butuh pendaftaran di AppModule
    imports: [CommonModule, FormsModule, RouterLink], // Modul yang dibutuhin buat form & navigasi
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    // ALAT BANTU (INJEKSI)
    private authService = inject(AuthService); // Buat manggil login API
    private router = inject(Router);          // Buat pindah halaman (pindah ke Home)

    /**
     * DATA DINAMIS (SIGNALS)
     * Variabel yang 'hidup' dan nempel ke tampilan HTML.
     */
    readonly username = signal('');           // Tempat nampung ketikan username
    readonly password = signal('');           // Tempat nampung ketikan password
    readonly isLoading = signal(false);       // Status lagi nunggu jawaban server (Loading...)
    readonly errorMessage = signal<string | null>(null); // Pesan error umum (Gagal login)
    readonly validationErrors = signal<{ [key: string]: string } | null>(null); // Error per kotak (Username kosong)
    readonly showPassword = signal(false);    // Status mata password (kebuka/ketutup)

    /**
     * AKSI TOMBOL LOGIN
     * Pas tombol 'Masuk' diklik, fungsi ini jalan.
     */
    onSubmit() {
        // 1. BERSIHIN ERROR LAMA
        // Biar kalo user nyoba lagi, pesan merah yang tadi ilang dulu.
        this.errorMessage.set(null);
        this.validationErrors.set(null);

        // 2. NYALAIN SPINNING LOADING
        // Tombol jadi disable biar gak dipencet berkali-kali.
        this.isLoading.set(true);

        /**
         * 3. PANGGIL API LOGIN (SUBSCRIBE PATTERN)
         * Kita manggil AuthService.login, lalu kita 'Nunggu' (Subscribe) balesannya.
         */
        this.authService.login({
            username: this.username(),
            password: this.password()
        }).subscribe({
            // Kalo server ngasih jawaban (mau itu sukses atau gagal bisnis)
            next: (result) => {
                if (result.success) {
                    /**
                     * LOGIN BERHASIL! 
                     * User kita arahkan (Navigasi) balik ke halaman Beranda.
                     */
                    this.router.navigate(['/']);
                } else {
                    /**
                     * LOGIN GAGAL (Kredensial salah atau data kurang)
                     * Kita ambil pesan 'message' dari API buat dipajang di UI.
                     */
                    this.errorMessage.set(result.message);

                    // Kalo ada detail error (misal: 'username tidak boleh kosong')
                    // Kita tangke' p datanya di variabel validationErrors
                    if (result.code === 400 && result.data && (result.data as any).errors) {
                        this.validationErrors.set((result.data as any).errors);
                    }
                }
                // Stop loading karena proses udah beres
                this.isLoading.set(false);
            },
            // Kalo koneksi internet putus atau server mati total
            error: (err) => {
                const apiError = err.error;
                if (apiError) {
                    // Kalo server masih hidup tapi ngirim error response
                    this.errorMessage.set(apiError.message);
                    if (apiError.data && apiError.data.errors) {
                        this.validationErrors.set(apiError.data.errors);
                    }
                } else {
                    // Kalo beneran mati lampu/jaringan error
                    this.errorMessage.set('Waduh, koneksinya lagi bermasalah atau server lagi tidur.');
                }
                this.isLoading.set(false);
            }
        });
    }

    /**
     * HELPER: AMBIL ERROR KOTAK INPUT
     * Dipake di HTML buat ngecek: 'Kotak username ada merahnya gak?'
     */
    getFieldError(field: string): string | undefined {
        return this.validationErrors()?.[field];
    }

    /**
     * AKSI MATA PASSWORD
     * Tombol buat ngeliatin/nyembunyiin teks password.
     */
    togglePassword() {
        this.showPassword.update(v => !v);
    }
}
