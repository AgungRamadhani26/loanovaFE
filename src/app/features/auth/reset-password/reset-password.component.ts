import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * RESET PASSWORD COMPONENT
 *
 * Halaman untuk mengatur password baru setelah menerima email reset.
 * Token diambil dari query parameter: /reset-password?token=xxx
 */
@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private platformId = inject(PLATFORM_ID);

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    readonly token = signal<string | null>(null);
    readonly newPassword = signal('');
    readonly confirmPassword = signal('');
    readonly isLoading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly successMessage = signal<string | null>(null);
    readonly validationErrors = signal<{ [key: string]: string } | null>(null);
    readonly isPasswordReset = signal(false); // Status password sudah direset
    readonly showNewPassword = signal(false);
    readonly showConfirmPassword = signal(false);
    readonly tokenError = signal<string | null>(null); // Error jika token tidak ada

    ngOnInit() {
        // Ambil token dari query parameter
        if (isPlatformBrowser(this.platformId)) {
            this.route.queryParams.subscribe(params => {
                const tokenParam = params['token'];
                if (tokenParam) {
                    this.token.set(tokenParam);
                } else {
                    this.tokenError.set('Token tidak ditemukan. Silakan minta link reset password baru.');
                }
            });
        }
    }

    /**
     * SUBMIT RESET PASSWORD
     */
    onSubmit() {
        // Reset state
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.validationErrors.set(null);

        // Validasi konfirmasi password (UX saja, bukan security)
        if (this.newPassword() !== this.confirmPassword()) {
            this.errorMessage.set('Password dan konfirmasi password tidak sama.');
            return;
        }

        const token = this.token();
        if (!token) {
            this.errorMessage.set('Token tidak valid.');
            return;
        }

        this.isLoading.set(true);

        this.authService.resetPassword({
            token: token,
            newPassword: this.newPassword()
        }).subscribe({
            next: (result) => {
                if (result.success) {
                    this.successMessage.set(result.message);
                    this.isPasswordReset.set(true);
                } else {
                    this.errorMessage.set(result.message);
                    if (result.code === 400 && result.data && (result.data as any).errors) {
                        this.validationErrors.set((result.data as any).errors);
                    }
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                const apiError = err.error;
                if (apiError) {
                    this.errorMessage.set(apiError.message);
                    if (apiError.data && apiError.data.errors) {
                        this.validationErrors.set(apiError.data.errors);
                    }
                } else {
                    this.errorMessage.set('Terjadi kesalahan. Silakan coba lagi.');
                }
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Helper: Get field error
     */
    getFieldError(field: string): string | undefined {
        return this.validationErrors()?.[field];
    }

    /**
     * Toggle visibility password
     */
    toggleNewPassword() {
        this.showNewPassword.set(!this.showNewPassword());
    }

    toggleConfirmPassword() {
        this.showConfirmPassword.set(!this.showConfirmPassword());
    }

    /**
     * Navigate to login page
     */
    goToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
