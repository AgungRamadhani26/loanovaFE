import { Injectable, signal } from '@angular/core';

/**
 * LAYOUT SERVICE
 * 
 * Mengelola state global untuk tata letak (Layout), 
 * seperti membuka/menutup sidebar di perangkat mobile.
 */
@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    // Signal untuk status sidebar (terbuka/tertutup)
    readonly isSidebarOpen = signal(false);

    toggleSidebar() {
        this.isSidebarOpen.update(state => !state);
    }

    closeSidebar() {
        this.isSidebarOpen.set(false);
    }
}
