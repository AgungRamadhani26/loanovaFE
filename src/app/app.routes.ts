import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';

/**
 * Konfigurasi Routing Aplikasi
 * Mendefinisikan pemetaan antara URL path dan komponen yang ditampilkan.
 */
export const routes: Routes = [
    // Rute utama (home) diarahkan ke LandingPageComponent
    { path: '', component: LandingPageComponent },

    // Wildcard route: Jika path tidak ditemukan, arahkan kembali ke Beranda
    { path: '**', redirectTo: '' }
];
