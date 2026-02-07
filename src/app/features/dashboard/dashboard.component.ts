import { Component, inject, computed, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStatisticsResponse, StatusDistribution, PlafondDistribution } from '../../core/models/response/dashboard-statistics.model';

/**
 * DASHBOARD COMPONENT
 * Halaman utama dashboard dengan statistik:
 * - Cards: Total Pengajuan, Total Pencairan, Estimasi Pendapatan
 * - Pie Chart: Distribusi Status
 * - Bar Chart: Distribusi Plafond
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private platformId = inject(PLATFORM_ID);

  // User info
  readonly username = computed(() => this.authService.user().username || 'User');
  readonly userRoles = computed(() => this.authService.user().roles || []);

  // State
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statistics = signal<DashboardStatisticsResponse | null>(null);

  // Colors for pie chart (semantic colors based on status meaning)
  readonly statusColors: Record<string, string> = {
    'PENDING_REVIEW': '#f59e0b',      // amber-500 (pending)
    'WAITING_APPROVAL': '#3b82f6',    // blue-500 (in progress)
    'WAITING_DISBURSEMENT': '#8b5cf6', // violet-500 (almost done)
    'DISBURSED': '#10b981',           // emerald-500 (success)
    'REJECTED': '#ef4444'             // red-500 (failed)
  };

  // Status labels in Indonesian
  readonly statusLabels: Record<string, string> = {
    'PENDING_REVIEW': 'Pending Review',
    'WAITING_APPROVAL': 'Menunggu Approval',
    'WAITING_DISBURSEMENT': 'Menunggu Pencairan',
    'DISBURSED': 'Dicairkan',
    'REJECTED': 'Ditolak'
  };

  // Plafond colors (actual metal/tier colors)
  readonly plafondColors: Record<string, string> = {
    'Bronze': '#cd7f32',    // bronze color
    'Silver': '#a8a9ad',    // silver color
    'Gold': '#ffd700',      // gold color
    'Platinum': '#e5e4e2',  // platinum color
    'Red': '#dc2626'        // red-600
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStatistics();
    }
  }

  loadStatistics(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat statistik');
        this.isLoading.set(false);
      }
    });
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Calculate SVG pie chart path
  getPieSlicePath(distribution: StatusDistribution[], index: number): string {
    if (!distribution || distribution.length === 0) return '';

    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (distribution[i].percentage / 100) * 360;
    }

    const angle = (distribution[index].percentage / 100) * 360;
    const endAngle = startAngle + angle;

    const cx = 100, cy = 100, r = 80;

    const x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  // Get max count for bar chart scaling
  getMaxPlafondCount(): number {
    const stats = this.statistics();
    if (!stats || !stats.plafondDistribution) return 1;
    return Math.max(...stats.plafondDistribution.map(p => p.count), 1);
  }

  // Get bar width percentage
  getBarWidth(count: number): number {
    return (count / this.getMaxPlafondCount()) * 100;
  }

  // Get plafond color
  getPlafondColor(name: string): string {
    return this.plafondColors[name] || '#60a5fa';
  }

  // Get total applications count
  getTotalApplicationsCount(): number {
    const stats = this.statistics();
    if (!stats || !stats.statusDistribution) return 0;
    return stats.statusDistribution.reduce((sum, s) => sum + s.count, 0);
  }
}
