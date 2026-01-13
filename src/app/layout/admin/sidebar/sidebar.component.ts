import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user-role.enum';
import { LayoutService } from '../../../core/services/layout.service';

/**
 * SIDEBAR COMPONENT
 * 
 * Menampilkan menu navigasi utama aplikasi di area Dashboard.
 * Dilengkapi dengan logika RBAC (Role-Based Access Control) untuk menyembunyikan
 * menu yang tidak sesuai dengan hak akses user.
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
     * Setiap menu memiliki properti 'roles' yang menentukan siapa saja yang boleh melihatnya.
     */
    private readonly allMenuItems = [
        {
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: 'dashboard',
            roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE, UserRole.MARKETING, UserRole.BRANCHMANAGER]
        },
        {
            label: 'Users',
            path: '/admin/users',
            icon: 'people',
            roles: [UserRole.SUPERADMIN]
        },
        {
            label: 'Branch',
            path: '/admin/branches',
            icon: 'business',
            roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE]
        },
        {
            label: 'Role Permission',
            path: '/admin/roles',
            icon: 'security',
            roles: [UserRole.SUPERADMIN]
        },
        {
            label: 'Loan Application',
            path: '/admin/loans',
            icon: 'assignment',
            roles: [UserRole.MARKETING, UserRole.BRANCHMANAGER, UserRole.BACKOFFICE]
        },
        {
            label: 'Application History',
            path: '/admin/history',
            icon: 'history',
            roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE, UserRole.MARKETING, UserRole.BRANCHMANAGER]
        },
        {
            label: 'Plafond',
            path: '/admin/plafond',
            icon: 'monetization_on',
            roles: [UserRole.SUPERADMIN, UserRole.BACKOFFICE, UserRole.BRANCHMANAGER]
        }
    ];

    /**
     * SIGNAL: MENU TERFILTER (REAKTIF)
     * Menggunakan 'computed' agar daftar menu otomatis terupdate jika role user berubah.
     */
    readonly filteredMenuItems = computed(() => {
        const user = this.authService.user();

        // Jika belum login, jangan tampilkan menu apapun
        if (!user.isAuthenticated) return [];

        // Filter menu: Ambil menu jika salah satu role user ada di dalam daftar 'roles' menu tersebut
        return this.allMenuItems.filter(item =>
            item.roles.some(role => user.roles.includes(role))
        );
    });
}
