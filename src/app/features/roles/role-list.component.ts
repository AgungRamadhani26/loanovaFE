import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { PermissionService } from '../../core/services/permission.service';
import { RoleData } from '../../core/models/response/role-response.model';
import { PermissionData } from '../../core/models/response/permission-response.model';
import { RoleRequest } from '../../core/models/request/role-request.model';
import { RoleUpdateRequest } from '../../core/models/request/role-update-request.model';

/**
 * ROLE LIST COMPONENT
 * Menampilkan daftar role dalam bentuk card grid (corporate view).
 * Masing-masing card menampilkan nama role, deskripsi, dan permissions.
 */
@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './role-list.component.html',
    styleUrl: './role-list.component.css'
})
export class RoleListComponent implements OnInit {
    private roleService = inject(RoleService);
    private permissionService = inject(PermissionService);
    private platformId = inject(PLATFORM_ID);

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    roles = signal<RoleData[]>([]);
    permissions = signal<PermissionData[]>([]);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');
    successMessage = signal<string | null>(null);

    /**
     * CREATE ROLE MODAL STATE
     */
    isCreateModalOpen = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    formError = signal<string | null>(null);
    fieldErrors = signal<Record<string, string>>({});
    createRoleForm = signal<{
        roleName: string;
        roleDescription: string;
        permissionIds: number[];
    }>({
        roleName: '',
        roleDescription: '',
        permissionIds: []
    });

    /**
     * EDIT ROLE MODAL STATE
     */
    isEditModalOpen = signal<boolean>(false);
    editingRoleId = signal<number | null>(null);
    editingRoleName = signal<string>('');
    editRoleForm = signal<{
        roleDescription: string;
        permissionIds: number[];
    }>({
        roleDescription: '',
        permissionIds: []
    });

    /**
     * LIFECYCLE HOOK
     */
    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadRoles();
            this.loadPermissions();
        }
    }

    /**
     * LOAD ROLES DARI API
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
     * LOAD PERMISSIONS DARI API
     */
    loadPermissions(): void {
        this.permissionService.getAllPermissions().subscribe({
            next: (response) => {
                if (response.success) {
                    this.permissions.set(response.data);
                }
            },
            error: (err) => {
                console.error('Error fetching permissions:', err);
            }
        });
    }

    /**
     * OPEN CREATE MODAL
     */
    openCreateModal(): void {
        this.createRoleForm.set({
            roleName: '',
            roleDescription: '',
            permissionIds: []
        });
        this.formError.set(null);
        this.fieldErrors.set({});
        this.isCreateModalOpen.set(true);
    }

    /**
     * CLOSE CREATE MODAL
     */
    closeCreateModal(): void {
        this.isCreateModalOpen.set(false);
    }

    /**
     * UPDATE FORM FIELD HELPERS
     */
    updateRoleName(value: string): void {
        const current = this.createRoleForm();
        this.createRoleForm.set({ ...current, roleName: value });
    }

    updateRoleDescription(value: string): void {
        const current = this.createRoleForm();
        this.createRoleForm.set({ ...current, roleDescription: value });
    }

    /**
     * TOGGLE PERMISSION SELECTION
     */
    togglePermission(permissionId: number): void {
        const current = this.createRoleForm();
        const ids = [...current.permissionIds];
        const index = ids.indexOf(permissionId);

        if (index > -1) {
            ids.splice(index, 1);
        } else {
            ids.push(permissionId);
        }

        this.createRoleForm.set({ ...current, permissionIds: ids });
    }

    /**
     * CHECK IF PERMISSION IS SELECTED
     */
    isPermissionSelected(permissionId: number): boolean {
        return this.createRoleForm().permissionIds.includes(permissionId);
    }

    /**
     * SUBMIT CREATE ROLE
     */
    submitCreateRole(): void {
        this.isSubmitting.set(true);
        this.formError.set(null);
        this.fieldErrors.set({});

        const form = this.createRoleForm();
        const request: RoleRequest = {
            roleName: form.roleName,
            roleDescription: form.roleDescription,
            permissionIds: form.permissionIds
        };

        this.roleService.createRole(request).subscribe({
            next: (response) => {
                if (response.success) {
                    this.closeCreateModal();
                    this.loadRoles();
                    this.successMessage.set(response.message || 'Role berhasil dibuat!');
                    setTimeout(() => this.successMessage.set(null), 4000);
                } else {
                    this.formError.set(response.message || 'Gagal membuat role');
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                const errorResponse = err.error;
                if (errorResponse?.data?.errors) {
                    this.formError.set(errorResponse.message || 'Validasi gagal');
                    this.fieldErrors.set(errorResponse.data.errors);
                } else {
                    this.formError.set(errorResponse?.message || 'Terjadi kesalahan');
                }
                this.isSubmitting.set(false);
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
     * EDIT ROLE MODAL HANDLERS
     */
    openEditModal(role: RoleData): void {
        // Role name tidak bisa diubah, hanya ditampilkan
        this.editingRoleName.set(role.roleName);
        this.editingRoleId.set(role.id);

        // Ambil permission IDs dari permission names
        const permissionIds = this.permissions()
            .filter(p => role.permissions.includes(p.permissionName))
            .map(p => p.id);

        this.editRoleForm.set({
            roleDescription: role.roleDescription,
            permissionIds: permissionIds
        });

        this.formError.set(null);
        this.fieldErrors.set({});
        this.isEditModalOpen.set(true);
    }

    closeEditModal(): void {
        this.isEditModalOpen.set(false);
        this.editingRoleId.set(null);
    }

    updateEditDescription(value: string): void {
        const current = this.editRoleForm();
        this.editRoleForm.set({ ...current, roleDescription: value });
    }

    toggleEditPermission(permissionId: number): void {
        const current = this.editRoleForm();
        const ids = [...current.permissionIds];
        const index = ids.indexOf(permissionId);

        if (index > -1) {
            ids.splice(index, 1);
        } else {
            ids.push(permissionId);
        }

        this.editRoleForm.set({ ...current, permissionIds: ids });
    }

    isEditPermissionSelected(permissionId: number): boolean {
        return this.editRoleForm().permissionIds.includes(permissionId);
    }

    submitEditRole(): void {
        const id = this.editingRoleId();
        if (!id) return;

        this.isSubmitting.set(true);
        this.formError.set(null);
        this.fieldErrors.set({});

        const form = this.editRoleForm();
        const request: RoleUpdateRequest = {
            roleDescription: form.roleDescription,
            permissionIds: form.permissionIds
        };

        this.roleService.updateRole(id, request).subscribe({
            next: (response) => {
                if (response.success) {
                    this.closeEditModal();
                    this.loadRoles();
                    this.successMessage.set(response.message || 'Role berhasil diperbarui!');
                    setTimeout(() => this.successMessage.set(null), 4000);
                } else {
                    this.formError.set(response.message || 'Gagal memperbarui role');
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                const errorResponse = err.error;
                if (errorResponse?.data?.errors) {
                    this.formError.set(errorResponse.message || 'Validasi gagal');
                    this.fieldErrors.set(errorResponse.data.errors);
                } else {
                    this.formError.set(errorResponse?.message || 'Terjadi kesalahan');
                }
                this.isSubmitting.set(false);
            }
        });
    }

    deleteRole(role: RoleData): void {
        console.log('Delete role (belum diimplementasi):', role);
    }
}
