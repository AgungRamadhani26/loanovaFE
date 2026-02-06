import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanApplicationService } from '../../core/services/loan-application.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user-role.enum';
import { LoanApplicationData } from '../../core/models/response/loan-application-response.model';
import { ApplicationHistoryData } from '../../core/models/response/application-history-response.model';
import {
    LoanStatus,
    STATUS_LABELS,
    STATUS_COLORS
} from '../../core/models/loan-status.model';
import { LoanReviewRequest } from '../../core/models/request/loan-review-request.model';



@Component({
    selector: 'app-loan-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './loan-list.component.html',
    styleUrls: ['./loan-list.component.css']
})
export class LoanListComponent implements OnInit {
    private loanService = inject(LoanApplicationService);
    private authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID);

    // State signals
    readonly applications = signal<LoanApplicationData[]>([]);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);
    readonly successMessage = signal<string | null>(null);
    readonly statusFilter = signal<string>('all');
    readonly searchQuery = signal('');
    readonly currentPage = signal(1);
    readonly pageSize = signal(10);

    // Modal states
    readonly isDetailModalOpen = signal(false);
    readonly isActionModalOpen = signal(false);
    readonly selectedApplication = signal<LoanApplicationData | null>(null);
    readonly applicationHistory = signal<ApplicationHistoryData[]>([]);
    readonly isHistoryLoading = signal(false);
    readonly actionType = signal<'review' | 'approve' | 'disburse' | null>(null);
    readonly actionComment = signal('');
    readonly isSubmitting = signal(false);

    // User info
    readonly userRoles = computed(() => this.authService.user().roles || []);
    readonly userPermissions = computed(() => this.authService.user().permissions || []);

    // Stats counts by status
    readonly pendingCount = computed(() =>
        this.applications().filter(a => a.status === 'PENDING_REVIEW').length
    );
    readonly waitingApprovalCount = computed(() =>
        this.applications().filter(a => a.status === 'WAITING_APPROVAL').length
    );
    readonly waitingDisbursementCount = computed(() =>
        this.applications().filter(a => a.status === 'WAITING_DISBURSEMENT').length
    );
    readonly disbursedCount = computed(() =>
        this.applications().filter(a => a.status === 'DISBURSED').length
    );
    readonly rejectedCount = computed(() =>
        this.applications().filter(a => a.status === 'REJECTED').length
    );

    // Available status options for filter dropdown
    readonly statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'PENDING_REVIEW', label: 'Pending Review' },
        { value: 'WAITING_APPROVAL', label: 'Waiting Approval' },
        { value: 'WAITING_DISBURSEMENT', label: 'Waiting Disbursement' },
        { value: 'DISBURSED', label: 'Disbursed' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    // Check if current user can perform action on a specific application
    canPerformAction(app: LoanApplicationData): { canReview: boolean; canApprove: boolean; canDisburse: boolean } {
        const roles = this.userRoles();
        return {
            canReview: app.status === 'PENDING_REVIEW' && roles.includes(UserRole.MARKETING),
            canApprove: app.status === 'WAITING_APPROVAL' && roles.includes(UserRole.BRANCHMANAGER),
            canDisburse: app.status === 'WAITING_DISBURSEMENT' && roles.includes(UserRole.BACKOFFICE)
        };
    }

    // Filtered applications based on search AND status filter
    readonly filteredApplications = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const status = this.statusFilter();

        // First filter by status
        let filtered = this.applications();
        if (status !== 'all') {
            filtered = filtered.filter(app => app.status === status);
        }

        // Then apply search filter
        return filtered.filter(app =>
            app.fullNameSnapshot?.toLowerCase().includes(query) ||
            app.username?.toLowerCase().includes(query) ||
            app.branchCode?.toLowerCase().includes(query) ||
            app.status?.toLowerCase().includes(query) ||
            app.plafondName?.toLowerCase().includes(query)
        );
    });

    // Pagination computed
    readonly totalPages = computed(() =>
        Math.ceil(this.filteredApplications().length / this.pageSize()) || 1
    );

    readonly paginatedApplications = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize();
        return this.filteredApplications().slice(start, start + this.pageSize());
    });

    readonly pages = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            pages.push(i);
        }
        return pages;
    });

    readonly showingFrom = computed(() =>
        this.filteredApplications().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
    );

    readonly showingTo = computed(() =>
        Math.min(this.currentPage() * this.pageSize(), this.filteredApplications().length)
    );

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadApplications();
        }
    }

    // Load applications - always uses getAllApplications (backend filters by role)
    loadApplications() {
        this.isLoading.set(true);
        this.error.set(null);

        this.loanService.getAllApplications().subscribe({
            next: (response) => {
                if (response.success) {
                    this.applications.set(response.data || []);
                } else {
                    this.error.set(response.message || 'Gagal memuat data');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Terjadi kesalahan');
                this.isLoading.set(false);
            }
        });
    }

    // Status filter change handler
    onStatusFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.statusFilter.set(select.value);
        this.currentPage.set(1);
    }

    // Search handler
    onSearch(query: string) {
        this.searchQuery.set(query);
        this.currentPage.set(1);
    }

    // Pagination handlers
    goToPage(page: number) {
        this.currentPage.set(page);
    }

    previousPage() {
        if (this.currentPage() > 1) {
            this.currentPage.set(this.currentPage() - 1);
        }
    }

    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.set(this.currentPage() + 1);
        }
    }

    onPageSizeChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.pageSize.set(Number(select.value));
        this.currentPage.set(1);
    }

    getRowNumber(index: number): number {
        return (this.currentPage() - 1) * this.pageSize() + index + 1;
    }

    // Status helpers
    getStatusLabel(status: string): string {
        return STATUS_LABELS[status as LoanStatus] || status;
    }

    getStatusColor(status: string): { bg: string; text: string } {
        return STATUS_COLORS[status as LoanStatus] || { bg: '#f1f5f9', text: '#64748b' };
    }

    // Format currency
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Format date
    formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Open detail modal
    openDetailModal(app: LoanApplicationData) {
        this.selectedApplication.set(app);
        this.isDetailModalOpen.set(true);
        this.loadHistory(app.id);
    }

    closeDetailModal() {
        this.isDetailModalOpen.set(false);
        this.selectedApplication.set(null);
        this.applicationHistory.set([]);
    }

    loadHistory(id: number) {
        this.isHistoryLoading.set(true);
        this.loanService.getApplicationHistory(id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.applicationHistory.set(response.data || []);
                }
                this.isHistoryLoading.set(false);
            },
            error: () => {
                this.isHistoryLoading.set(false);
            }
        });
    }

    // Action modal
    openActionModal(app: LoanApplicationData, type: 'review' | 'approve' | 'disburse') {
        this.selectedApplication.set(app);
        this.actionType.set(type);
        this.actionComment.set('');
        this.isActionModalOpen.set(true);
    }

    closeActionModal() {
        this.isActionModalOpen.set(false);
        this.actionType.set(null);
        this.actionComment.set('');
    }

    // Submit action (PROCEED/APPROVE/DISBURSE)
    submitAction(action: 'PROCEED' | 'APPROVE' | 'REJECT') {
        const app = this.selectedApplication();
        if (!app) return;

        // Validation: Comment wajib untuk REJECT
        if (action === 'REJECT' && !this.actionComment().trim()) {
            this.error.set('Komentar wajib diisi untuk penolakan');
            setTimeout(() => this.error.set(null), 3000);
            return;
        }

        this.isSubmitting.set(true);
        const request: LoanReviewRequest = {
            action,
            comment: this.actionComment() || undefined
        };

        let request$;
        switch (this.actionType()) {
            case 'review':
                request$ = this.loanService.reviewApplication(app.id, request);
                break;
            case 'approve':
                request$ = this.loanService.approveApplication(app.id, request);
                break;
            case 'disburse':
                if (action === 'REJECT') {
                    request$ = this.loanService.rejectByBackoffice(app.id, request);
                } else {
                    request$ = this.loanService.disburseApplication(app.id);
                }
                break;
            default:
                this.isSubmitting.set(false);
                return;
        }

        request$.subscribe({
            next: (response) => {
                if (response.success) {
                    this.successMessage.set('Aksi berhasil diproses');
                    setTimeout(() => this.successMessage.set(null), 3000);
                    this.closeActionModal();
                    this.loadApplications();
                } else {
                    this.error.set(response.message || 'Gagal memproses aksi');
                    setTimeout(() => this.error.set(null), 3000);
                }
                this.isSubmitting.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Terjadi kesalahan');
                setTimeout(() => this.error.set(null), 3000);
                this.isSubmitting.set(false);
            }
        });
    }

    // Get action button label
    getActionLabel(): string {
        switch (this.actionType()) {
            case 'review': return 'Proceed';
            case 'approve': return 'Approve';
            case 'disburse': return 'Disburse';
            default: return 'Submit';
        }
    }

    // Get action modal title
    getActionTitle(): string {
        switch (this.actionType()) {
            case 'review': return 'Review Application';
            case 'approve': return 'Approve Application';
            case 'disburse': return 'Disburse Loan';
            default: return 'Process Application';
        }
    }
}
