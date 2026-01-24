import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { RoleData } from '../../core/models/response/role-response.model';

/**
 * ROLE LIST COMPONENT
 * Menampilkan daftar role dalam bentuk card grid (corporate view).
 * Masing-masing card menampilkan nama role, deskripsi, dan permissions.
 */
@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './role-list.component.html',
    styleUrl: './role-list.component.css'
})
export class RoleListComponent implements OnInit {
    private roleService = inject(RoleService);
    private platformId = inject(PLATFORM_ID);

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    roles = signal<RoleData[]>([]);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');
    successMessage = signal<string | null>(null);

    /**
     * LIFECYCLE HOOK
     */
    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadRoles();
        }
    }

    /**
     * LOAD DATA DARI API
     */
    loadRoles(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.roleService.getAllRoles().subscribe({
            next: (response) => {
                if (response.success) {
                    this.roles.set(response.data);
                } else {
                    this.errorMessage.set(response.message || 'Gagal mengambil data role');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching roles:', err);
                this.errorMessage.set(err.error?.message || 'Terjadi kesalahan saat mengambil data role');
                this.isLoading.set(false);
            }
        });
    }

    /**
     * GET ICON BERDASARKAN ROLE NAME
     */
    getRoleIcon(roleName: string): string {
        const iconMap: { [key: string]: string } = {
            'SUPERADMIN': 'admin_panel_settings',
            'BACKOFFICE': 'support_agent',
            'BRANCHMANAGER': 'business_center',
            'MARKETING': 'campaign',
            'CUSTOMER': 'person'
        };
        return iconMap[roleName.toUpperCase()] || 'security';
    }

    /**
     * GET COLOR CLASS BERDASARKAN ROLE NAME
     */
    getRoleColorClass(roleName: string): string {
        const colorMap: { [key: string]: string } = {
            'SUPERADMIN': 'role-superadmin',
            'BACKOFFICE': 'role-backoffice',
            'BRANCHMANAGER': 'role-branchmanager',
            'MARKETING': 'role-marketing',
            'CUSTOMER': 'role-customer'
        };
        return colorMap[roleName.toUpperCase()] || 'role-default';
    }

    /**
     * PLACEHOLDER HANDLERS (UNTUK IMPLEMENTASI KEDEPAN)
     */
    editRole(role: RoleData): void {
        console.log('Edit role (belum diimplementasi):', role);
    }

    deleteRole(role: RoleData): void {
        console.log('Delete role (belum diimplementasi):', role);
    }
}
