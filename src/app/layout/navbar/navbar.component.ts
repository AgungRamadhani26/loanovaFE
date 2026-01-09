import { Component } from '@angular/core';

/**
 * NavbarComponent
 * Komponen navigasi utama yang diletakkan di bagian atas aplikasi.
 * Bersifat standalone untuk modularitas maksimal.
 */
@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
    // Komponen ini saat ini bersifat statis, namun siap untuk ditambahkan logic navigasi ke depannya.
}
