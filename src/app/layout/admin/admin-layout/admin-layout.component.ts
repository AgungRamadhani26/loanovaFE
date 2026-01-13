import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { LayoutService } from '../../../core/services/layout.service';

/**
 * ADMIN LAYOUT COMPONENT
 * 
 * Pengelola struktur utama untuk area Dashboard (setelah login).
 * Menyusun Sidebar, Header, Footer, dan Content Area (Outlet).
 * Menggunakan LayoutService untuk menangani responsivitas mobile.
 */
@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        SidebarComponent,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
    // Service untuk kontrol sidebar (buka/tutup di mobile)
    layoutService = inject(LayoutService);
}
