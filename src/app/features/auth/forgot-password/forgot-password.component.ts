import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * FORGOT PASSWORD COMPONENT
 *
 * Halaman untuk meminta reset password melalui email.
 * User memasukkan email, backend akan mengirim link reset ke email tersebut.
 */
@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    readonly email = signal('');
    readonly isLoading = signal(false);
    readonly errorMessage = signal<string | null>(null);
    readonly successMessage = signal<string | null>(null);
    readonly validationErrors = signal<{ [key: string]: string } | null>(null);
    readonly isEmailSent = signal(false); // Status email sudah terkirim

    /**
     * SUBMIT FORGOT PASSWORD
     */
    onSubmit() {
        // Reset state
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.validationErrors.set(null);
        this.isLoading.set(true);

        this.authService.forgotPassword({
            email: this.email()
        }).subscribe({
            next: (result) => {
                if (result.success) {
                    this.successMessage.set(result.message);
                    this.isEmailSent.set(true);
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
     * Kirim ulang email
     */
    resendEmail() {
        this.isEmailSent.set(false);
        this.successMessage.set(null);
    }
}
