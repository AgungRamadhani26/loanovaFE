import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

/**
 * SIDEBAR COMPONENT
 *
 * Menampilkan menu navigasi utama aplikasi di area Dashboard.
 * Dilengkapi dengan logika Permission-Based Access Control untuk menyembunyikan
 * menu yang tidak layak diakses oleh pengguna tertentu.
 */
@Component({
    selector: 'app-admin-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    private authService = inject(AuthService);
    layoutService = inject(LayoutService);

    /**
     * DAFTAR SELURUH MENU (MASTER DATA)
     * Menggunakan MENU:* permissions khusus untuk kontrol visibility sidebar.
     * Ini terpisah dari data access permissions (READ, CREATE, dll).
     */
    private readonly allMenuItems = [
        {
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: 'dashboard',
            permissions: ['MENU:DASHBOARD']
        },
        {
            label: 'Users',
            path: '/admin/users',
            icon: 'people',
            permissions: ['MENU:USERS']
        },
        {
            label: 'Branch',
            path: '/admin/branches',
            icon: 'business',
            permissions: ['MENU:BRANCH']
        },
        {
            label: 'Role Permission',
            path: '/admin/roles',
            icon: 'security',
            permissions: ['MENU:ROLES']
        },
        {
            label: 'Loan Application',
            path: '/admin/loans',
            icon: 'assignment',
            permissions: ['MENU:LOAN']
        },
        {
            label: 'Application History',
            path: '/admin/history',
            icon: 'history',
            permissions: ['MENU:HISTORY']
        },
        {
            label: 'Plafond',
            path: '/admin/plafond',
            icon: 'monetization_on',
            permissions: ['MENU:PLAFOND']
        },
        {
            label: 'User Plafond',
            path: '/admin/user-plafonds',
            icon: 'assignment_ind',
            permissions: ['MENU:USER_PLAFOND']
        }
    ];

    /**
     * SIGNAL: MENU TERFILTER (REAKTIF)
     * Menu otomatis muncul/hilang tergantung permission yang dimiliki user saat ini.
     */
    readonly filteredMenuItems = computed(() => {
        const user = this.authService.user();

        // 1. Jika belum login, sembunyikan semua
        if (!user.isAuthenticated) return [];

        const userPerms = user.permissions || [];

        // 2. Filter menu berdasarkan permission
        return this.allMenuItems.filter(item => {
            // Jika menu tidak butuh permission khusus (array kosong), tampilkan.
            if (!item.permissions || item.permissions.length === 0) {
                return true;
            }

            // Jika menu butuh permission, cek apakah user punya SALAH SATU-nya.
            // Contoh: Menu Loan bisa dibuka oleh Marketing (LOAN:CREATE) atau Admin (LOAN:READ_ALL)
            return item.permissions.some(requiredPerm => userPerms.includes(requiredPerm));
        });
    });
}
