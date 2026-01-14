import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class LandingPageComponent {
    /**
     * State Management menggunakan Signals: Jumlah Pinjaman
     * Default: 10,000,000
     */
    readonly amount = signal(10000000);

    /**
     * State Management menggunakan Signals: Tenor (Bulan)
     * Default: 12 Bulan
     */
    readonly months = signal(12);

    /**
     * Computed Signal: Menghitung total bunga secara otomatis berdasarkan amount & months
     * Rumus: Pokok * 12% * (Tenor dalam tahun)
     */
    readonly interest = computed(() => this.amount() * 0.12 * (this.months() / 12));

    /**
     * Computed Signal: Menghitung total pengembalian (Pokok + Bunga)
     */
    readonly total = computed(() => this.amount() + this.interest());

    /**
     * Computed Signal: Menghitung cicilan bulanan
     */
    readonly monthly = computed(() => Math.round(this.total() / this.months()));

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
}
