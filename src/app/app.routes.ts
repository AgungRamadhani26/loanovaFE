import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout.component';

/**
 * Konfigurasi Routing Aplikasi
 * Menggunakan pola Nested Routes untuk membedakan halaman dengan dan tanpa Layout.
 */
export const routes: Routes = [
    // Rute yang menggunakan Navbar & Footer (Pembungkus MainLayout)
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: LandingPageComponent }
        ]
    },

    // Rute Mandiri (Tanpa Navbar & Footer)
    { path: 'login', component: LoginComponent },

    // Wildcard route
    { path: '**', redirectTo: '' }
];
