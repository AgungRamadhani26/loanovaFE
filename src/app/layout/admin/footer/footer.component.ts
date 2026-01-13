import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FOOTER COMPONENT (Admin Area)
 * 
 * Menampilkan baris bawah dashboard dengan informasi hak cipta 
 * dan versi aplikasi.
 */
@Component({
    selector: 'app-admin-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css'
})
export class FooterComponent {
    readonly currentYear = new Date().getFullYear();
}
