import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserData } from '../../core/models/response/user-response.model';

/**
 * MY PROFILE COMPONENT
 * Menampilkan informasi profil user yang sedang login.
 * Data diambil dari API GET /api/users/by-username/{username}
 */
@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-profile.component.html',
    styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private router = inject(Router);

    // Profile State
    profile = signal<UserData | null>(null);
    isLoading = signal(true);
    error = signal<string | null>(null);

    // Change Password Modal State
    showPasswordModal = signal(false);
    currentPassword = '';
    newPassword = '';
    isChangingPassword = signal(false);
    passwordError = signal<string | null>(null);
    passwordSuccess = signal<string | null>(null);
    validationErrors = signal<{ [key: string]: string } | null>(null);
    showCurrentPassword = signal(false);
    showNewPassword = signal(false);

    ngOnInit(): void {
        this.loadProfile();
    }

    /**
     * Load profile data berdasarkan username yang sedang login
     */
    loadProfile(): void {
        const username = this.authService.user().username;

        if (!username) {
            this.error.set('Username tidak ditemukan. Silakan login ulang.');
            this.isLoading.set(false);
            return;
        }

        this.userService.getUserByUsername(username).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.profile.set(response.data);
                } else {
                    this.error.set(response.message || 'Gagal memuat data profil');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile:', err);
                this.error.set('Terjadi kesalahan saat memuat data profil');
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Buka modal ganti password
     */
    onChangePassword(): void {
        this.showPasswordModal.set(true);
        this.resetPasswordForm();
    }

    /**
     * Tutup modal ganti password
     */
    closePasswordModal(): void {
        this.showPasswordModal.set(false);
        this.resetPasswordForm();
    }

    /**
     * Reset form password
     */
    resetPasswordForm(): void {
        this.currentPassword = '';
        this.newPassword = '';
        this.passwordError.set(null);
        this.passwordSuccess.set(null);
        this.validationErrors.set(null);
    }

    /**
     * Submit ganti password
     */
    submitChangePassword(): void {
        // Reset errors
        this.passwordError.set(null);
        this.validationErrors.set(null);

        this.isChangingPassword.set(true);

        this.authService.changePassword({
            currentPassword: this.currentPassword,
            newPassword: this.newPassword
        }).subscribe({
            next: (response) => {
                if (response.success) {
                    this.passwordSuccess.set(response.message);
                    // Auto logout setelah 2 detik
                    setTimeout(() => {
                        this.authService.clearAuthState();
                    }, 2000);
                } else {
                    this.passwordError.set(response.message);
                    if (response.code === 400 && response.data && (response.data as any).errors) {
                        this.validationErrors.set((response.data as any).errors);
                    }
                }
                this.isChangingPassword.set(false);
            },
            error: (err) => {
                const apiError = err.error;
                if (apiError) {
                    this.passwordError.set(apiError.message);
                    if (apiError.data && apiError.data.errors) {
                        this.validationErrors.set(apiError.data.errors);
                    }
                }
                this.isChangingPassword.set(false);
            }
        });
    }

    /**
     * Helper: Ambil error per field
     */
    getFieldError(field: string): string | undefined {
        return this.validationErrors()?.[field];
    }

    /**
     * Kembali ke dashboard
     */
    goBack(): void {
        this.router.navigate(['/admin/dashboard']);
    }

    /**
     * Toggle visibility password lama
     */
    toggleCurrentPassword(): void {
        this.showCurrentPassword.update(v => !v);
    }

    /**
     * Toggle visibility password baru
     */
    toggleNewPassword(): void {
        this.showNewPassword.update(v => !v);
    }
}
