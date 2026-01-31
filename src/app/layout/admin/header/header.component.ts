import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';

/**
 * HEADER COMPONENT (Admin Area)
 * 
 * Menampilkan baris atas dashboard yang berisi:
 * 1. Tombol Toggle Sidebar (untuk mobile/tablet)
 * 2. Informasi User yang sedang login (Reaktif via Signals)
 * 3. Menu Dropdown Profil & Logout
 */
@Component({
    selector: 'app-admin-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    layoutService = inject(LayoutService);

    // Mengambil data user secara reaktif dari AuthService
    readonly user = this.authService.user;

    // Shortcut untuk role (diambil dari array role pertama)
    readonly userRole = computed(() => {
        const roles = this.user().roles;
        return roles.length > 0 ? roles[0] : 'Guest';
    });

    /**
     * ON LOGOUT
     * Memanggil fungsi logout di service dan mengarahkan ke halaman login.
     */
    onLogout() {
        this.authService.logout().subscribe({
            next: (response) => {
                if (response.success) {
                    // Logout berhasil, arahkan ke halaman login
                    this.router.navigate(['/auth/login']);
                }
            },
            error: (err) => {
                console.error('Logout error:', err);
                // Meskipun error, tetap bersihkan state lokal dan redirect
                this.authService.clearAuthState();
                this.router.navigate(['/auth/login']);
            }
        });
    }

    /**
     * GO TO PROFILE
     * Navigasi ke halaman profil user
     */
    goToProfile() {
        this.router.navigate(['/admin/profile']);
    }
}
