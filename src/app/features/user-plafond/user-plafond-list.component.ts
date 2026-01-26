import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { UserPlafondService } from '../../core/services/user-plafond.service';
import { PlafondService } from '../../core/services/plafond.service';
import { UserData } from '../../core/models/response/user-response.model';
import { UserPlafondData } from '../../core/models/response/user-plafond-response.model';
import { PlafondResponse } from '../../core/models/response/plafond-response.model';
import { AssignUserPlafondRequest } from '../../core/models/request/assign-user-plafond-request.model';

/**
 * USER PLAFOND LIST COMPONENT
 * Menampilkan daftar user CUSTOMER dan fitur untuk assign/view plafond.
 */
@Component({
    selector: 'app-user-plafond-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-plafond-list.component.html',
    styleUrl: './user-plafond-list.component.css'
})
export class UserPlafondListComponent implements OnInit {
    private userService = inject(UserService);
    private userPlafondService = inject(UserPlafondService);
    private plafondService = inject(PlafondService);
    private platformId = inject(PLATFORM_ID);

    protected readonly Math = Math;

    // STATE
    customers = signal<UserData[]>([]);
    plafonds = signal<PlafondResponse[]>([]);
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');
    successMessage = signal<string | null>(null);
    searchQuery = signal<string>('');

    // Pagination
    currentPage = signal<number>(1);
    pageSize = signal<number>(10);

    // View Active Modal
    isViewActiveModalOpen = signal<boolean>(false);
    viewingUser = signal<UserData | null>(null);
    activePlafond = signal<UserPlafondData | null>(null);
    isLoadingActive = signal<boolean>(false);
    activeError = signal<string | null>(null);

    // View History Modal
    isViewHistoryModalOpen = signal<boolean>(false);
    historyUser = signal<UserData | null>(null);
    plafondHistory = signal<UserPlafondData[]>([]);
    isLoadingHistory = signal<boolean>(false);
    historyError = signal<string | null>(null);

    // Assign Modal
    isAssignModalOpen = signal<boolean>(false);
    assigningUser = signal<UserData | null>(null);
    isSubmitting = signal<boolean>(false);
    formError = signal<string | null>(null);
    fieldErrors = signal<Record<string, string>>({});
    assignForm = signal<{ plafondId: number | null; maxAmount: number | null }>({
        plafondId: null,
        maxAmount: null
    });
    selectedPlafondMaxAmount = signal<number>(0);

    // COMPUTED: Filtered customers
    filteredCustomers = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const all = this.customers();
        if (!query) return all;
        return all.filter(u =>
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.branchCode && u.branchCode.toLowerCase().includes(query))
        );
    });

    // COMPUTED: Paginated customers
    paginatedCustomers = computed(() => {
        const filtered = this.filteredCustomers();
        const page = this.currentPage();
        const size = this.pageSize();
        const start = (page - 1) * size;
        return filtered.slice(start, start + size);
    });

    // Total pages
    totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCustomers().length / this.pageSize())));

    // Array of page numbers for pagination UI
    pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

    // Showing "X to Y of Z" info
    showingFrom = computed(() => {
        if (this.filteredCustomers().length === 0) return 0;
        return (this.currentPage() - 1) * this.pageSize() + 1;
    });

    showingTo = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredCustomers().length));

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadCustomers();
            this.loadPlafonds();
        }
    }

    loadCustomers(): void {
        this.isLoading.set(true);
        this.userService.getAllUsers().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Filter only CUSTOMER role
                    const customers = response.data.filter(u => u.roles.includes('CUSTOMER'));
                    this.customers.set(customers);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set(err.error?.message || 'Gagal memuat data customer');
                this.isLoading.set(false);
            }
        });
    }

    loadPlafonds(): void {
        this.plafondService.getAllPlafonds().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.plafonds.set(response.data);
                }
            },
            error: () => { }
        });
    }

    // VIEW ACTIVE PLAFOND
    openViewActiveModal(user: UserData): void {
        this.viewingUser.set(user);
        this.activePlafond.set(null);
        this.activeError.set(null);
        this.isLoadingActive.set(true);
        this.isViewActiveModalOpen.set(true);

        this.userPlafondService.getActiveUserPlafond(user.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.activePlafond.set(response.data);
                }
                this.isLoadingActive.set(false);
            },
            error: (err) => {
                this.activeError.set(err.error?.message || 'User tidak memiliki plafond aktif');
                this.isLoadingActive.set(false);
            }
        });
    }

    closeViewActiveModal(): void {
        this.isViewActiveModalOpen.set(false);
        this.viewingUser.set(null);
    }

    // VIEW HISTORY
    openViewHistoryModal(user: UserData): void {
        this.historyUser.set(user);
        this.plafondHistory.set([]);
        this.historyError.set(null);
        this.isLoadingHistory.set(true);
        this.isViewHistoryModalOpen.set(true);

        this.userPlafondService.getUserPlafondHistory(user.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.plafondHistory.set(response.data);
                }
                this.isLoadingHistory.set(false);
            },
            error: (err) => {
                this.historyError.set(err.error?.message || 'Gagal memuat riwayat plafond');
                this.isLoadingHistory.set(false);
            }
        });
    }

    closeViewHistoryModal(): void {
        this.isViewHistoryModalOpen.set(false);
        this.historyUser.set(null);
    }

    // ASSIGN PLAFOND
    openAssignModal(user: UserData): void {
        this.assigningUser.set(user);
        this.assignForm.set({ plafondId: null, maxAmount: null });
        this.selectedPlafondMaxAmount.set(0);
        this.formError.set(null);
        this.fieldErrors.set({});
        this.isAssignModalOpen.set(true);
    }

    closeAssignModal(): void {
        this.isAssignModalOpen.set(false);
        this.assigningUser.set(null);
    }

    onPlafondChange(plafondId: number): void {
        const form = this.assignForm();
        this.assignForm.set({ ...form, plafondId });
        const plafond = this.plafonds().find(p => p.id === plafondId);
        if (plafond) {
            this.selectedPlafondMaxAmount.set(plafond.maxAmount);
        }
    }



    submitAssign(): void {
        const user = this.assigningUser();
        const form = this.assignForm();
        const maxAmount = this.selectedPlafondMaxAmount();

        if (!user || !form.plafondId) {
            this.formError.set('Validasi gagal');
            if (!form.plafondId) {
                this.fieldErrors.set({ plafondId: 'Pilih plafond terlebih dahulu' });
            }
            return;
        }

        this.isSubmitting.set(true);
        this.formError.set(null);
        this.fieldErrors.set({});

        const request: AssignUserPlafondRequest = {
            userId: user.id,
            plafondId: form.plafondId,
            maxAmount: maxAmount
        };

        this.userPlafondService.assignPlafond(request).subscribe({
            next: (response) => {
                if (response.success) {
                    this.closeAssignModal();
                    this.successMessage.set(response.message || 'Plafond berhasil di-assign!');
                    setTimeout(() => this.successMessage.set(null), 4000);
                } else {
                    this.formError.set(response.message || 'Gagal assign plafond');
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

    // PAGINATION
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.set(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.set(this.currentPage() + 1);
        }
    }

    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.pageSize.set(Number(select.value));
        this.currentPage.set(1); // Reset to first page
    }

    // UTILS
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    getPlafondColorClass(plafondName: string | undefined): string {
        if (!plafondName) return 'default';
        const name = plafondName.toLowerCase();
        if (name.includes('bronze')) return 'bronze';
        if (name.includes('silver')) return 'silver';
        if (name.includes('gold')) return 'gold';
        if (name.includes('platinum')) return 'platinum';
        if (name.includes('red')) return 'red';
        return 'default';
    }
}
