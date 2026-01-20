import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlafondService } from '../../core/services/plafond.service';
import { PlafondResponse } from '../../core/models/response/plafond-response.model';

/**
 * LandingPageComponent
 * Komponen utama untuk halaman depan (Landing Page).
 * Menggunakan Angular Signals untuk kalkulasi simulasi pinjaman secara reaktif.
 */
@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './landing-page.component.html',
    styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements OnInit {
    private plafondService = inject(PlafondService);
    private platformId = inject(PLATFORM_ID);

    // State Management for Plafonds
    plafonds = signal<PlafondResponse[]>([]);
    isLoadingPlafonds = signal<boolean>(true);

    /**
     * Data statis untuk Alur Pengajuan
     * Digunakan di template HTML dengan direktif @for
     */
    readonly steps = [
        { title: 'Daftar & Login', desc: 'Buat akun dengan nomor telepon Anda.' },
        { title: 'Upload Data', desc: 'Unggah KTP dan dokumen pendukung.' },
        { title: 'Verifikasi', desc: 'Tim kami akan memverifikasi data Anda.' },
        { title: 'Cair', desc: 'Dana langsung masuk ke rekening Anda.' }
    ];

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadPublicPlafonds();
        }
    }

    loadPublicPlafonds() {
        this.isLoadingPlafonds.set(true);
        this.plafondService.getPublicPlafonds().subscribe({
            next: (response) => {
                if (response.success) {
                    this.plafonds.set(response.data);
                }
                this.isLoadingPlafonds.set(false);
            },
            error: (err) => {
                console.error('Failed to load public plafonds', err);
                this.isLoadingPlafonds.set(false);
            }
        });
    }

    // Helper functions for dynamic styling based on Plafond Name
    getPlafondIcon(name: string): string {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('bronze')) return '🥉';
        if (lowerName.includes('silver')) return '🥈';
        if (lowerName.includes('gold')) return '🥇';
        if (lowerName.includes('platinum')) return '💎';
        return '💰';
    }

    isPopular(name: string): boolean {
        return name.toLowerCase().includes('silver');
    }

    getThemeColor(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('bronze')) return 'amber';
        if (lower.includes('silver')) return 'slate'; // or blue for border
        if (lower.includes('gold')) return 'yellow';
        if (lower.includes('platinum')) return 'purple';
        return 'blue'; // default
    }
}
