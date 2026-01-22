import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { BranchService } from '../../core/services/branch.service';
import { RoleService } from '../../core/services/role.service';
import { UserData } from '../../core/models/response/user-response.model';
import { BranchData } from '../../core/models/response/branch-response.model';
import { RoleData } from '../../core/models/response/role-response.model';
import { UserRequest } from '../../core/models/request/user-request.model';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    private readonly userService = inject(UserService);
    private readonly branchService = inject(BranchService);
    private readonly roleService = inject(RoleService);
    private readonly platformId = inject(PLATFORM_ID);

    // Ekspos Math ke template
    protected readonly Math = Math;

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    users = signal<UserData[]>([]);
    branches = signal<BranchData[]>([]);
    roles = signal<RoleData[]>([]);
    isLoading = signal<boolean>(false);
    searchQuery = signal<string>('');

    /**
     * CREATE USER MODAL STATE
     */
    isCreateModalOpen = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    successMessage = signal<string>('');
    formError = signal<string | null>(null); // Error utama untuk alert box
    fieldErrors = signal<Record<string, string>>({});
    createUserForm = signal<{
        username: string;
        email: string;
        password: string; // Password manual dari form
        roleIds: number[];
        branchId: number | null;
    }>({
        username: '',
        email: '',
        password: '', // Default kosong
        roleIds: [],
        branchId: null
    });

    // Roles yang bisa multi-select
    private readonly MULTI_SELECT_ROLES = ['SUPERADMIN', 'BACKOFFICE'];

    // Roles yang membutuhkan branch assignment
    private readonly ROLES_REQUIRING_BRANCH = ['BRANCHMANAGER', 'MARKETING'];

    // Computed: Cek apakah role yang dipilih membutuhkan branch
    needsBranch = computed(() => {
        const selectedRoleIds = this.createUserForm().roleIds;
        const allRoles = this.roles();
        const selectedRoleNames = allRoles
            .filter(r => selectedRoleIds.includes(r.id))
            .map(r => r.roleName);
        return selectedRoleNames.some(name => this.ROLES_REQUIRING_BRANCH.includes(name));
    });

    /**
     * FILTER STATE
     */
    selectedBranch = signal<string>('ALL');
    selectedRole = signal<string>('ALL');
    selectedStatus = signal<string>('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'
    isFilterVisible = signal<boolean>(false);

    /**
     * PAGINATION STATE
     */
    currentPage = signal<number>(1);
    pageSize = signal<number>(5);

    /**
     * COMPUTED PROPERTIES (REACTIVE)
     */

    // 1. Daftar Cabang dari API (untuk dropdown filter)
    availableBranches = computed(() => {
        // Ambil dari signal branches yang sudah di-load dari API
        const branchCodes = this.branches().map(b => b.branchCode);
        return ['ALL', ...branchCodes].sort((a, b) => a.localeCompare(b));
    });

    // 2. Daftar Role yang Unik (untuk dropdown filter)
    availableRoles = computed(() => {
        // Ambil dari signal roles yang sudah di-load dari API
        const roleNames = this.roles().map(r => r.roleName);
        return ['ALL', ...new Set(roleNames)].sort((a, b) => String(a).localeCompare(String(b)));
    });

    // 3. Proses Filtering Utama (Combine Search + Dropdown Filters)
    filteredUsers = computed(() => {
        let results = this.users();
        const query = this.searchQuery().toLowerCase().trim();
        const branch = this.selectedBranch();
        const role = this.selectedRole();
        const status = this.selectedStatus();

        // Filter 1: Search Query
        if (query) {
            results = results.filter(user => {
                const searchStr = `${user.username} ${user.email} ${user.branchCode || ''} ${user.roles.join(' ')}`.toLowerCase();
                return searchStr.includes(query);
            });
        }

        // Filter 2: Branch
        if (branch !== 'ALL') {
            results = results.filter(user => user.branchCode === branch);
        }

        // Filter 3: Role
        if (role !== 'ALL') {
            results = results.filter(user => user.roles.includes(role));
        }

        // Filter 4: Status
        if (status !== 'ALL') {
            const isActive = status === 'ACTIVE';
            results = results.filter(user => user.isActive === isActive);
        }

        return results;
    });

    // 4. Potong data sesuai dengan halaman saat ini (Pagination)
    paginatedUsers = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.pageSize();
        const endIndex = startIndex + this.pageSize();
        return this.filteredUsers().slice(startIndex, endIndex);
    });

    // 5. Hitung total halaman
    totalPages = computed(() =>
        Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize()))
    );

    // 6. Buat list nomor halaman
    pages = computed(() =>
        Array.from({ length: this.totalPages() }, (_, i) => i + 1)
    );

    // 7. Informasi "Showing X to Y of Z"
    showingFrom = computed(() => {
        if (this.filteredUsers().length === 0) return 0;
        return (this.currentPage() - 1) * this.pageSize() + 1;
    });

    showingTo = computed(() => {
        return Math.min(this.currentPage() * this.pageSize(), this.filteredUsers().length);
    });

    // Stats Summary
    activeUserCount = computed(() =>
        this.users().filter(u => u.isActive).length
    );

    adminCount = computed(() =>
        this.users().filter(u => u.roles.includes('SUPERADMIN')).length
    );

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUsers();
            this.loadBranches();
            this.loadRoles();
        }
    }

    /**
     * API CALLS
     */
    loadRoles(): void {
        this.roleService.getAllRoles().subscribe({
            next: (response) => {
                if (response.success) {
                    this.roles.set(response.data);
                }
            },
            error: (err) => console.error('Error fetching roles:', err)
        });
    }

    loadBranches(): void {
        this.branchService.getAllBranches().subscribe({
            next: (response) => {
                if (response.success) {
                    this.branches.set(response.data);
                }
            },
            error: (err) => console.error('Error fetching branches:', err)
        });
    }

    loadUsers(): void {
        this.isLoading.set(true);
        this.userService.getAllUsers().subscribe({
            next: (response) => {
                if (response.success) {
                    this.users.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching users:', err);
                this.isLoading.set(false);
            }
        });
    }

    /**
     * PAGINATION CONTROLS
     */
    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
        }
    }

    goToPage(page: number): void {
        this.currentPage.set(page);
    }

    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.pageSize.set(Number(select.value));
        this.currentPage.set(1);
    }

    /**
     * EVENT HANDLERS
     */
    onSearch(value: string): void {
        this.searchQuery.set(value);
        this.currentPage.set(1);
    }

    toggleFilter(): void {
        this.isFilterVisible.update(v => !v);
    }

    resetFilters(): void {
        this.selectedBranch.set('ALL');
        this.selectedRole.set('ALL');
        this.selectedStatus.set('ALL');
        this.searchQuery.set('');
        this.currentPage.set(1);
    }

    onFilterChange(): void {
        this.currentPage.set(1);
    }

    /**
     * CREATE USER MODAL HANDLERS
     */
    openCreateModal(): void {
        this.resetCreateForm();
        this.isCreateModalOpen.set(true);
    }

    closeCreateModal(): void {
        this.isCreateModalOpen.set(false);
        this.resetCreateForm();
    }

    resetCreateForm(): void {
        this.createUserForm.set({
            username: '',
            email: '',
            password: '', // Reset password juga
            roleIds: [],
            branchId: null
        });
        this.formError.set(null);
        this.fieldErrors.set({});
    }

    updateFormField(field: string, value: any): void {
        this.createUserForm.update(form => ({ ...form, [field]: value }));
        // Clear field error when user types
        if (this.fieldErrors()[field]) {
            this.fieldErrors.update(errors => {
                const newErrors = { ...errors };
                delete newErrors[field];
                return newErrors;
            });
        }
    }

    getFieldError(field: string): string {
        return this.fieldErrors()[field] || '';
    }

    toggleRoleSelection(roleId: number): void {
        const clickedRole = this.roles().find(r => r.id === roleId);
        if (!clickedRole) return;

        const isMultiSelectRole = this.MULTI_SELECT_ROLES.includes(clickedRole.roleName);

        this.createUserForm.update(form => {
            let newRoles: number[];

            if (isMultiSelectRole) {
                // Untuk SUPERADMIN/BACKOFFICE: bisa multi-select sesama multi-select role
                // Hapus semua non-multi-select roles terlebih dahulu
                const currentMultiSelectRoles = form.roleIds.filter(id => {
                    const role = this.roles().find(r => r.id === id);
                    return role && this.MULTI_SELECT_ROLES.includes(role.roleName);
                });

                if (currentMultiSelectRoles.includes(roleId)) {
                    newRoles = currentMultiSelectRoles.filter(id => id !== roleId);
                } else {
                    newRoles = [...currentMultiSelectRoles, roleId];
                }
            } else {
                // Untuk role lain (MARKETING, BRANCHMANAGER, CUSTOMER): single select only
                newRoles = form.roleIds.includes(roleId) ? [] : [roleId];
            }

            // Cek apakah masih butuh branch
            const selectedRoleNames = this.roles()
                .filter(r => newRoles.includes(r.id))
                .map(r => r.roleName);
            const stillNeedsBranch = selectedRoleNames.some(name =>
                this.ROLES_REQUIRING_BRANCH.includes(name)
            );

            return {
                ...form,
                roleIds: newRoles,
                branchId: stillNeedsBranch ? form.branchId : null
            };
        });
    }

    isRoleSelected(roleId: number): boolean {
        return this.createUserForm().roleIds.includes(roleId);
    }

    onCreateUser(): void {
        const form = this.createUserForm();
        this.formError.set(null);
        this.fieldErrors.set({});
        this.isSubmitting.set(true);
        const request: UserRequest = {
            username: form.username,
            email: form.email,
            password: form.password, // Gunakan password dari form, bukan username
            branchId: this.needsBranch() ? form.branchId : null,
            isActive: true,
            roleIds: form.roleIds
        };
        this.userService.createUser(request).subscribe({
            next: (response) => {
                if (response.success) {
                    this.closeCreateModal();
                    this.loadUsers();
                    this.successMessage.set(response.message || 'User berhasil dibuat!');
                    setTimeout(() => this.successMessage.set(''), 4000);
                } else {
                    this.formError.set(response.message || 'Gagal membuat user');
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                const errorResponse = err.error;
                if (errorResponse?.data?.errors) {
                    this.formError.set(errorResponse.message || 'Validasi gagal');
                    this.fieldErrors.set(errorResponse.data.errors);
                } else {
                    this.formError.set(errorResponse?.message || 'Terjadi kesalahan saat membuat user');
                    this.fieldErrors.set({});
                }
                this.isSubmitting.set(false);
            }
        });
    }
}
