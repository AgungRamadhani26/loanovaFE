import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

/**
 * INTERFACE: STAT CARD
 * Mendefinisikan struktur data untuk kartu statistik di dashboard.
 * Menjamin keamanan tipe data (Type Safety).
 */
interface StatCard {
  label: string;
  value: string;
  icon: string;
  bgClass: string;
  trend: string;
}

/**
 * DASHBOARD COMPONENT (Best Practice Version)
 * 
 * Halaman utama area terautentikasi.
 * Mengikuti standar Angular v21:
 * 1. File terpisah (HTML, CSS, TS)
 * 2. Injeksi modern menggunakan inject()
 * 3. State management berbasis Signals & Computed
 * 4. Pemakaian Control Flow modern (@for)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // 1. INJEKSI SERVICE
  // Mangambil data auth untuk salam pembuka (welcome message)
  private authService = inject(AuthService);

  /**
   * STATE: USERNAME (Computed Signal)
   * Mengambil data username secara reaktif. Jika user logout/ganti,
   * tampilan dashboard akan otomatis menyesuaikan.
   */
  readonly username = computed(() => this.authService.user().username || 'User');

  /**
   * STATE: STATISTIK (Signal)
   * Data statistik dibungkus dalam Signal agar reaktif.
   * Nantinya data ini bisa diambil dari API menggunakan Resource atau Effect.
   */
  readonly stats = signal<StatCard[]>([
    {
      label: 'Total Loan',
      value: '128',
      icon: 'assignment',
      bgClass: 'bg-indigo-500',
      trend: '+12% MOM'
    },
    {
      label: 'Active Users',
      value: '1.2k',
      icon: 'people',
      bgClass: 'bg-blue-500',
      trend: '+5% MOM'
    },
    {
      label: 'Total Branch',
      value: '45',
      icon: 'business',
      bgClass: 'bg-cyan-500',
      trend: 'STABLE'
    },
    {
      label: 'Pending Apps',
      value: '12',
      icon: 'history',
      bgClass: 'bg-orange-500',
      trend: 'HIGH PRIO'
    }
  ]);

  /**
   * FUNGSI ACTIONS (Contoh logic masa depan)
   */
  refreshData() {
    console.log('Me-refresh data dashboard...');
    // Logic ambil data dari API bisa ditaruh di sini
  }
}
