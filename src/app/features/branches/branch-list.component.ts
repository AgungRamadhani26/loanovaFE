import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../core/services/branch.service';
import { BranchData } from '../../core/models/response/branch-response.model';

/**
 * BRANCH LIST COMPONENT
 *
 * Komponen untuk menampilkan daftar cabang (branches) dari API backend.
 * Fitur:
 * - Menampilkan data cabang dalam bentuk tabel
 * - Search/filter cabang berdasarkan kode, nama, atau alamat
 * - Pagination untuk navigasi data
 * - Loading state saat mengambil data
 *
 * State Management: Menggunakan Angular Signals (Reactive Programming)
 */
@Component({
    selector: 'app-branch-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './branch-list.component.html',
    styleUrl: './branch-list.component.css'
})
export class BranchListComponent implements OnInit {
    // Dependency Injection
    private branchService = inject(BranchService);
    private platformId = inject(PLATFORM_ID);

    // Ekspos Math ke template untuk operasi matematika di HTML
    protected readonly Math = Math;

    /**
     * STATE MANAGEMENT (ANGULAR SIGNALS)
     * Signals adalah reactive state yang otomatis update UI ketika data berubah
     */
    branches = signal<BranchData[]>([]);
    isLoading = signal<boolean>(false);
    searchQuery = signal<string>('');

    /**
     * PAGINATION STATE
     */
    currentPage = signal<number>(1);
    pageSize = signal<number>(5); // Jumlah data per halaman

    /**
     * COMPUTED PROPERTIES (REACTIVE)
     * Computed signals otomatis re-evaluate ketika dependency-nya berubah
     */

    // 1. Filter data berdasarkan search query
    filteredBranches = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();

        // Jika tidak ada query, return semua data
        if (!query) {
            return this.branches();
        }

        // Filter berdasarkan branchCode, branchName, atau address
        return this.branches().filter(branch => {
            const searchStr = `${branch.branchCode} ${branch.branchName} ${branch.address}`.toLowerCase();
            return searchStr.includes(query);
        });
    });

    // 2. Potong data sesuai halaman saat ini (Pagination)
    paginatedBranches = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.pageSize();
        const endIndex = startIndex + this.pageSize();
        return this.filteredBranches().slice(startIndex, endIndex);
    });

    // 3. Hitung total halaman
    totalPages = computed(() =>
        Math.max(1, Math.ceil(this.filteredBranches().length / this.pageSize()))
    );

    // 4. Buat array nomor halaman untuk pagination UI
    pages = computed(() =>
        Array.from({ length: this.totalPages() }, (_, i) => i + 1)
    );

    // 5. Informasi "Showing X to Y of Z"
    showingFrom = computed(() => {
        if (this.filteredBranches().length === 0) return 0;
        return (this.currentPage() - 1) * this.pageSize() + 1;
    });

    showingTo = computed(() => {
        return Math.min(this.currentPage() * this.pageSize(), this.filteredBranches().length);
    });

    /**
     * Menghitung nomor urut untuk setiap row berdasarkan halaman dan index
     */
    getRowNumber(index: number): number {
        return (this.currentPage() - 1) * this.pageSize() + index + 1;
    }

    /**
     * LIFECYCLE HOOK
     * Dipanggil otomatis saat komponen pertama kali diinisialisasi
     */
    ngOnInit(): void {
        // Cek apakah kita di browser (bukan di server-side rendering)
        if (isPlatformBrowser(this.platformId)) {
            this.loadBranches();
        }
    }

    /**
     * LOAD DATA DARI API
     * Mengambil daftar cabang dari backend
     */
    loadBranches(): void {
        this.isLoading.set(true);
        this.branchService.getAllBranches().subscribe({
            next: (response) => {
                if (response.success) {
                    this.branches.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching branches:', err);
                this.isLoading.set(false);
                // TODO: Tambahkan notifikasi error untuk user
            }
        });
    }

    /**
     * SEARCH HANDLER
     * Dipanggil setiap kali user mengetik di search box
     */
    onSearch(query: string): void {
        this.searchQuery.set(query);
        // Reset ke halaman pertama ketika melakukan search
        this.currentPage.set(1);
    }

    /**
     * PAGINATION HANDLERS
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(page => page + 1);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(page => page - 1);
        }
    }

    /**
     * PAGE SIZE HANDLER
     * Mengubah jumlah data yang ditampilkan per halaman
     */
    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.pageSize.set(Number(select.value));
        this.currentPage.set(1); // Reset ke halaman pertama
    }

    /**
     * ACTION HANDLERS
     */
    viewBranch(branch: BranchData): void {
        console.log('View branch:', branch);
        // TODO: Implement view details
    }

    editBranch(branch: BranchData): void {
        console.log('Edit branch:', branch);
        // TODO: Implement edit functionality
    }
}
