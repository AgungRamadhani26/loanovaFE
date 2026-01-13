import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

/**
 * MainLayoutComponent
 * Menyediakan layout standar aplikasi yang menyertakan Navbar dan Footer.
 * Digunakan sebagai pembungkus untuk halaman umum dan dashboard.
 */
@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, FooterComponent],
    template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `
})
export class MainLayoutComponent { }
