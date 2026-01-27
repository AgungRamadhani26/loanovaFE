import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlafondService } from '../../core/services/plafond.service';
import { PlafondResponse } from '../../core/models/response/plafond-response.model';
import { PlafondRequest } from '../../core/models/request/plafond-request.model';

@Component({
  selector: 'app-plafond-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plafond-list.component.html',
  styleUrls: ['./plafond-list.component.css']
})
export class PlafondListComponent implements OnInit {
  private plafondService = inject(PlafondService);
  private platformId = inject(PLATFORM_ID);

  // State
  plafonds = signal<PlafondResponse[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  errorMessage = signal<string>(''); // Global error (Toast)
  successMessage = signal<string | null>(null);

  // Modal & Form State
  isAddModalOpen = signal<boolean>(false);
  formError = signal<string>(''); // Specific form error (Modal Alert)

  isSubmitting = signal<boolean>(false);
  validationErrors = signal<{ [key: string]: string }>({});

  initialPlafondState: PlafondRequest = {
    name: '',
    description: '',
    maxAmount: 0,
    interestRate: 0,
    tenorMin: 0,
    tenorMax: 0
  };

  addPlafondForm = signal<PlafondRequest>({ ...this.initialPlafondState });

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);

  /**
   * COMPUTED PROPERTIES
   */
  filteredPlafonds = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.plafonds();

    // Helper untuk membersihkan format angka/persen dari query (misal: "5.5%" -> "5.5")
    const cleanQuery = query.replace(/[^0-9.,-]/g, '');

    return this.plafonds().filter(p => {
      // 1. Text Search (Name & Desc)
      if (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) {
        return true;
      }

      // 2. Numeric Search (Max Amount, Interest, Tenor)
      // Cek jika query mengandung angka
      if (cleanQuery) {
        const maxAmountStr = p.maxAmount.toString();
        const interestStr = p.interestRate.toString();
        const tenorMinStr = p.tenorMin.toString();
        const tenorMaxStr = p.tenorMax.toString();

        // Cek match langsung angka
        if (maxAmountStr.includes(cleanQuery) ||
          interestStr.includes(cleanQuery) ||
          tenorMinStr.includes(cleanQuery) ||
          tenorMaxStr.includes(cleanQuery)) {
          return true;
        }

        // Cek Range Tenor (misal user ketik "12-60")
        // Format tampilan: "12 - 60"
        const tenorRangeStr = `${p.tenorMin}-${p.tenorMax}`;
        if (tenorRangeStr.includes(cleanQuery.replace(/\s/g, ''))) {
          return true;
        }
      }

      return false;
    });
  });

  paginatedPlafonds = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredPlafonds().slice(startIndex, endIndex);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPlafonds().length / this.pageSize()))
  );

  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  showingFrom = computed(() => {
    if (this.filteredPlafonds().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredPlafonds().length);
  });

  getRowNumber(index: number): number {
    return (this.currentPage() - 1) * this.pageSize() + index + 1;
  }

  getRowClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('platinum')) return 'row-platinum';
    if (lowerName.includes('gold')) return 'row-gold';
    if (lowerName.includes('silver')) return 'row-silver';
    if (lowerName.includes('bronze')) return 'row-bronze';
    return '';
  }

  getAccentClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('platinum')) return 'accent-platinum';
    if (lowerName.includes('gold')) return 'accent-gold';
    if (lowerName.includes('silver')) return 'accent-silver';
    if (lowerName.includes('bronze')) return 'accent-bronze';
    return 'accent-default';
  }

  getIconClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('platinum')) return 'icon-platinum';
    if (lowerName.includes('gold')) return 'icon-gold';
    if (lowerName.includes('silver')) return 'icon-silver';
    if (lowerName.includes('bronze')) return 'icon-bronze';
    return 'icon-default';
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPlafonds();
    }
  }

  loadPlafonds(): void {
    this.isLoading.set(true);
    this.plafondService.getAllPlafonds().subscribe({
      next: (response) => {
        if (response.success) {
          this.plafonds.set(response.data);
          // Set error message if empty? No, filtered view handles it.
        } else {
          this.errorMessage.set(response.message);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching plafonds', error);
        this.errorMessage.set('Gagal memuat data plafond. Silakan coba lagi.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * FORM & MODAL ACTIONS
   */
  openAddModal(): void {
    this.addPlafondForm.set({ ...this.initialPlafondState });
    this.validationErrors.set({});
    this.formError.set(''); // Reset form specific error
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
    this.formError.set('');
  }

  // Helper used by html to close whatever is open (if any generic close button exists, though specific is better)
  closeModal(): void {
    this.closeAddModal();
  }

  submitAddPlafond(): void {
    this.isSubmitting.set(true);
    this.validationErrors.set({});
    this.formError.set('');

    this.plafondService.createPlafond(this.addPlafondForm()).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPlafonds();
          this.closeAddModal();
          this.addPlafondForm.set({ ...this.initialPlafondState });

          this.successMessage.set(response.message || 'Plafond berhasil ditambahkan!');
          setTimeout(() => this.successMessage.set(''), 3000);
        }
        this.isSubmitting.set(false);
      },
      error: (err) => this.handleFormError(err)
    });
  }

  deletePlafond(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete plafond "${name}"? This action cannot be undone.`)) {
      this.isLoading.set(true);
      this.plafondService.deletePlafond(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set(response.message || 'Plafond berhasil dihapus');
            setTimeout(() => this.successMessage.set(null), 3000);
            this.loadPlafonds();
          } else {
            this.errorMessage.set(response.message);
            setTimeout(() => this.errorMessage.set(''), 5000);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error deleting plafond', error);
          this.errorMessage.set(error.error?.message || 'Gagal menghapus plafond');
          setTimeout(() => this.errorMessage.set(''), 5000);
          this.isLoading.set(false);
        }
      });
    }
  }

  private handleFormError(err: any): void {
    this.isSubmitting.set(false);
    const errorResponse = err.error;

    if (err.status === 400 && errorResponse?.data?.errors) {
      this.formError.set('Validasi gagal');
      this.validationErrors.set(errorResponse.data.errors);
    } else if (err.status === 409) {
      this.formError.set('Validasi gagal');
      this.validationErrors.set({ name: errorResponse.message });
    } else if (err.status === 400 && errorResponse?.message) {
      this.formError.set(errorResponse.message);
    } else {
      this.formError.set(errorResponse?.message || 'Terjadi kesalahan sistem');
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

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

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(Number(select.value));
    this.currentPage.set(1);
  }
}
