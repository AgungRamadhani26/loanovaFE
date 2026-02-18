import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanApplicationService } from '../../core/services/loan-application.service';
import { AuthService } from '../../core/services/auth.service';
import { LoanApplicationData } from '../../core/models/response/loan-application-response.model';
import { ApplicationHistoryData } from '../../core/models/response/application-history-response.model';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';

@Component({
    selector: 'app-loan-list',
    standalone: true,
    imports: [CommonModule, FormsModule, SafeUrlPipe],
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
    readonly searchQuery = signal('');
    readonly currentPage = signal(1);
    readonly pageSize = signal(10);

    // View mode: 'all' = semua aplikasi, 'actionable' = hanya yang perlu diaksi
    readonly viewMode = signal<'all' | 'actionable'>('all');

    // Modal states
    readonly isDetailModalOpen = signal(false);
    readonly isActionModalOpen = signal(false);
    readonly selectedApplication = signal<LoanApplicationData | null>(null);
    readonly applicationHistory = signal<ApplicationHistoryData[]>([]);
    readonly isHistoryLoading = signal(false);
    readonly isDetailLoading = signal(false);
    readonly actionType = signal<'review' | 'approve' | 'disburse' | null>(null);
    actionComment = '';
    readonly isSubmitting = signal(false);

    // Confirmation Dialog
    readonly isConfirmationOpen = signal(false);
    readonly confirmationDecision = signal<'PROCEED' | 'APPROVE' | 'REJECT' | null>(null);

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

    // Role checks for action button
    readonly isMarketing = computed(() => this.userRoles().some(r => r === 'MARKETING'));
    readonly isBranchManager = computed(() => this.userRoles().some(r => r === 'BRANCHMANAGER'));
    readonly isBackoffice = computed(() => this.userRoles().some(r => r === 'BACKOFFICE'));
    readonly isSuperAdmin = computed(() => this.userRoles().some(r => r === 'SUPERADMIN'));

    // Get action button label based on role
    readonly actionButtonLabel = computed(() => {
        if (this.isMarketing()) return 'Lihat Pending Review';
        if (this.isBranchManager()) return 'Lihat Waiting Approval';
        if (this.isBackoffice()) return 'Lihat Waiting Disbursement';
        return null;
    });

    // Show action button only for non-superadmin roles with specific permissions
    readonly showActionButton = computed(() => {
        return this.isMarketing() || this.isBranchManager() || this.isBackoffice();
    });

    // Filtered applications based on search - searches all columns
    readonly filteredApplications = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        let results = this.applications();

        if (query) {
            results = results.filter(app => {
                // Build search string from all relevant fields
                const searchStr = [
                    app.id?.toString(),
                    app.fullNameSnapshot,
                    app.username,
                    app.branchCode,
                    app.plafondName,
                    app.amount?.toString(),
                    app.tenor?.toString(),
                    app.status,
                    app.submittedAt,
                    app.occupation,
                    app.companyName,
                    app.nikSnapshot,
                    app.phoneNumberSnapshot,
                    app.rekeningNumber
                ].filter(Boolean).join(' ').toLowerCase();

                return searchStr.includes(query);
            });
        }

        return results;
    });

    readonly totalPages = computed(() =>
        Math.max(1, Math.ceil(this.filteredApplications().length / this.pageSize()))
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

    // Check what action can be performed on an application
    canPerformAction(app: LoanApplicationData): { canReview: boolean; canApprove: boolean; canDisburse: boolean } {
        const hasReviewPermission = this.userPermissions().includes('LOAN:REVIEW');
        const hasApprovePermission = this.userPermissions().includes('LOAN:APPROVE');
        const hasDisbursePermission = this.userPermissions().includes('LOAN:DISBURSE');

        return {
            canReview: hasReviewPermission && app.status === 'PENDING_REVIEW',
            canApprove: hasApprovePermission && app.status === 'WAITING_APPROVAL',
            canDisburse: hasDisbursePermission && app.status === 'WAITING_DISBURSEMENT'
        };
    }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadApplications();
        }
    }

    // Load all applications
    loadApplications() {
        this.isLoading.set(true);
        this.error.set(null);
        this.viewMode.set('all');

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

    // Load actionable applications based on role
    loadActionableApplications() {
        this.isLoading.set(true);
        this.error.set(null);
        this.viewMode.set('actionable');

        let apiCall;
        if (this.isMarketing()) {
            apiCall = this.loanService.getPendingReview();
        } else if (this.isBranchManager()) {
            apiCall = this.loanService.getWaitingApproval();
        } else if (this.isBackoffice()) {
            apiCall = this.loanService.getWaitingDisbursement();
        } else {
            this.isLoading.set(false);
            return;
        }

        apiCall.subscribe({
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

    // Detail Modal - now calls API for fresh data
    openDetailModal(app: LoanApplicationData) {
        this.isDetailModalOpen.set(true);
        this.isDetailLoading.set(true);
        this.error.set(null);

        // Call API to get fresh detail data
        this.loanService.getApplicationDetail(app.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.selectedApplication.set(response.data);
                    // Load history after detail is loaded
                    this.loadApplicationHistory(app.id);
                } else {
                    this.error.set(response.message || 'Gagal memuat detail aplikasi');
                    this.isDetailLoading.set(false);
                }
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Terjadi kesalahan saat memuat detail');
                this.isDetailLoading.set(false);
            }
        });
    }

    closeDetailModal() {
        this.isDetailModalOpen.set(false);
        this.selectedApplication.set(null);
        this.applicationHistory.set([]);
        this.isDetailLoading.set(false);
    }

    loadApplicationHistory(appId: number) {
        this.isHistoryLoading.set(true);
        this.loanService.getApplicationHistory(appId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.applicationHistory.set(response.data || []);
                }
                this.isHistoryLoading.set(false);
                this.isDetailLoading.set(false);
            },
            error: () => {
                this.isHistoryLoading.set(false);
                this.isDetailLoading.set(false);
            }
        });
    }

    // Action Modal
    openActionModal(app: LoanApplicationData, type: 'review' | 'approve' | 'disburse') {
        this.selectedApplication.set(app);
        this.actionType.set(type);
        this.actionComment = '';
        this.isActionModalOpen.set(true);
    }

    closeActionModal() {
        this.isActionModalOpen.set(false);
        this.actionType.set(null);
        this.actionComment = '';
    }

    getActionTitle(): string {
        switch (this.actionType()) {
            case 'review': return 'Review Application';
            case 'approve': return 'Approve Application';
            case 'disburse': return 'Disburse Application';
            default: return 'Action';
        }
    }

    // Show confirmation dialog before action
    submitAction(decision: 'PROCEED' | 'APPROVE' | 'REJECT') {
        const app = this.selectedApplication();
        if (!app) return;

        if (decision === 'REJECT' && !this.actionComment.trim()) {
            this.error.set('Komentar wajib diisi untuk penolakan');
            return;
        }

        // Show confirmation dialog
        this.confirmationDecision.set(decision);
        this.isConfirmationOpen.set(true);
    }

    // Cancel confirmation dialog
    cancelConfirmation() {
        this.isConfirmationOpen.set(false);
        this.confirmationDecision.set(null);
    }

    // Get confirmation message based on action type and decision
    getConfirmationMessage(): string {
        const decision = this.confirmationDecision();
        const actionType = this.actionType();
        const appName = this.selectedApplication()?.fullNameSnapshot || 'pemohon';

        if (decision === 'REJECT') {
            return `Apakah Anda yakin ingin MENOLAK pengajuan dari "${appName}"? Tindakan ini tidak dapat dibatalkan.`;
        }

        switch (actionType) {
            case 'review':
                return `Apakah Anda yakin ingin MELANJUTKAN pengajuan dari "${appName}" ke proses approval?`;
            case 'approve':
                return `Apakah Anda yakin ingin MENYETUJUI pengajuan dari "${appName}"? Pengajuan akan dilanjutkan ke proses pencairan.`;
            case 'disburse':
                return `Apakah Anda yakin ingin MENCAIRKAN dana untuk "${appName}"? Pastikan data rekening sudah benar.`;
            default:
                return 'Apakah Anda yakin ingin melanjutkan aksi ini?';
        }
    }

    // Confirm and execute the action
    confirmAction() {
        const app = this.selectedApplication();
        const decision = this.confirmationDecision();
        if (!app || !decision) return;

        this.isConfirmationOpen.set(false);
        this.isSubmitting.set(true);

        let apiCall;
        const request: { action: 'PROCEED' | 'REJECT' | 'APPROVE'; comment?: string } = {
            action: decision,
            comment: this.actionComment
        };

        switch (this.actionType()) {
            case 'review':
                apiCall = this.loanService.reviewApplication(app.id, request);
                break;
            case 'approve':
                apiCall = this.loanService.approveApplication(app.id, request);
                break;
            case 'disburse':
                if (decision === 'REJECT') {
                    apiCall = this.loanService.rejectByBackoffice(app.id, request);
                } else {
                    apiCall = this.loanService.disburseApplication(app.id);
                }
                break;
            default:
                this.isSubmitting.set(false);
                return;
        }

        apiCall.subscribe({
            next: (response) => {
                if (response.success) {
                    // Set appropriate success message
                    let successMsg = response.message || 'Berhasil!';
                    if (decision === 'REJECT') {
                        successMsg = 'Pengajuan berhasil ditolak!';
                    } else if (this.actionType() === 'review') {
                        successMsg = 'Pengajuan berhasil dilanjutkan ke proses approval!';
                    } else if (this.actionType() === 'approve') {
                        successMsg = 'Pengajuan berhasil disetujui!';
                    } else if (this.actionType() === 'disburse') {
                        successMsg = 'Dana berhasil dicairkan!';
                    }

                    this.successMessage.set(successMsg);
                    this.closeActionModal();
                    // Reload based on current view mode
                    if (this.viewMode() === 'actionable') {
                        this.loadActionableApplications();
                    } else {
                        this.loadApplications();
                    }
                    setTimeout(() => this.successMessage.set(null), 4000);
                } else {
                    this.error.set(response.message || 'Gagal melakukan aksi');
                }
                this.isSubmitting.set(false);
                this.confirmationDecision.set(null);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Terjadi kesalahan');
                this.isSubmitting.set(false);
                this.confirmationDecision.set(null);
            }
        });
    }

    // Helper functions
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatBirthDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    getStatusColor(status: string): { bg: string; text: string } {
        const colors: Record<string, { bg: string; text: string }> = {
            'PENDING_REVIEW': { bg: '#fef3c7', text: '#b45309' },
            'WAITING_APPROVAL': { bg: '#e0e7ff', text: '#4338ca' },
            'WAITING_DISBURSEMENT': { bg: '#ede9fe', text: '#6d28d9' },
            'DISBURSED': { bg: '#d1fae5', text: '#047857' },
            'REJECTED': { bg: '#fee2e2', text: '#b91c1c' }
        };
        return colors[status] || { bg: '#f1f5f9', text: '#475569' };
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'PENDING_REVIEW': 'Pending Review',
            'WAITING_APPROVAL': 'Waiting Approval',
            'WAITING_DISBURSEMENT': 'Waiting Disbursement',
            'DISBURSED': 'Disbursed',
            'REJECTED': 'Rejected'
        };
        return labels[status] || status;
    }

    // Generate Google Maps embed URL
    // Generate Google Maps embed URL
    getGoogleMapsUrl(lat: number, lng: number): string {
        // Menggunakan format query sederhana agar marker merah muncul tepat di koordinat
        return `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=15&output=embed`;
    }

    // Helper to resolve image URL from backend
    getImageUrl(path: string | undefined): string {
        if (!path) return 'assets/images/placeholder-document.png'; // Fallback
        if (path.startsWith('http')) return path;

        // Clean path if it starts with / or \
        const cleanPath = path.replace(/^[/\\]+/, '');
        // Backend serves uploads at /uploads/**
        // Jika path sudah mengandung 'uploads/', kita sesuaikan
        // Namun biasanya path di database disimpan relatif 'uploads/dir/file.jpg' atau 'dir/file.jpg'

        // Gunakan relative path kosong agar request gambar melalui proxy Vercel (HTTPS -> HTTP)
        // Proxy akan mem-proxy request /uploads/** ke http://localhost:9091/uploads/**
        const BACKEND_URL = '';

        // Cek apakah path sudah include 'uploads' di depannya
        if (cleanPath.startsWith('uploads')) {
            return `${BACKEND_URL}/${cleanPath}`;
        }

        // Jika tidak, tambahkan uploads/ (asumsi default folder)
        return `${BACKEND_URL}/uploads/${cleanPath}`;
    }


    // Image Preview Modal State
    readonly previewImageUrl = signal<string | null>(null);

    // Open image in popup modal
    openImagePreview(imageUrl: string) {
        const fullUrl = this.getImageUrl(imageUrl);
        this.previewImageUrl.set(fullUrl);
    }

    closeImagePreview() {
        this.previewImageUrl.set(null);
    }

    // Calculation Helpers
    // Asumsi: Interest Rate adalah Bunga Flat per Bulan sesuai request user
    calculateTotalInterest(amount: number, rate: number, tenor: number): number {
        return amount * (rate / 100) * tenor;
    }

    calculateTotalRepayment(amount: number, rate: number, tenor: number): number {
        const totalInterest = this.calculateTotalInterest(amount, rate, tenor);
        return amount + totalInterest;
    }

    calculateMonthlyInstallment(amount: number, rate: number, tenor: number): number {
        if (tenor === 0) return 0;
        const totalRepayment = this.calculateTotalRepayment(amount, rate, tenor);
        return totalRepayment / tenor;
    }
}
