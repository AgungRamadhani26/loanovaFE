import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/shared/main-layout.component';
import { AdminLayoutComponent } from './layout/admin/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

/**
 * Konfigurasi Routing Aplikasi
 * Menggunakan pola Nested Routes untuk membedakan halaman:
 * 1. Landing Page (MainLayout)
 * 2. Auth (No Layout)
 * 3. Dashboard Admin (AdminLayout)
 */
export const routes: Routes = [
    // 🏠 PUBLIC AREA: Landing Page
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: LandingPageComponent }
        ]
    },

    // 🔑 AUTH AREA
    { path: 'auth/login', component: LoginComponent },
    // Redirect /login ke /auth/login biar rapi
    { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },

    // 🔒 PROTECTED AREA: Dashboard (Admin & Internal)
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },

            /**
             * PLACEHOLDER UNTUK MENU LAIN
             * Nantinya setiap menu ini akan punya komponen masing-masing.
             */
            { path: 'users', component: DashboardComponent },
            { path: 'branches', component: DashboardComponent },
            { path: 'roles', component: DashboardComponent },
            { path: 'loans', component: DashboardComponent },
            { path: 'history', component: DashboardComponent },
            { path: 'plafond', component: DashboardComponent },
        ]
    },

    // 🚨 WILDCARD
    { path: '**', redirectTo: '' }
];
