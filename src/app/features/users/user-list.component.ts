import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { UserData } from '../../core/models/response/user-response.model';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private platformId = inject(PLATFORM_ID);

    // Ekspos Math ke template
    protected readonly Math = Math;

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     */
    users = signal<UserData[]>([]);
    isLoading = signal<boolean>(false);
    searchQuery = signal<string>('');

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

    // 1. Daftar Cabang yang Unik (untuk dropdown filter)
    availableBranches = computed(() => {
        const branches = this.users()
            .map(u => u.branchCode)
            .filter((b): b is string => !!b);
        return ['ALL', ...new Set(branches)].sort();
    });

    // 2. Daftar Role yang Unik (untuk dropdown filter)
    availableRoles = computed(() => {
        const roles = this.users().flatMap(u => u.roles);
        return ['ALL', ...new Set(roles)].sort();
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
        }
    }

    /**
     * API CALLS
     */
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
}
