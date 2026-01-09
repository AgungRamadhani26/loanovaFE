import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';

/**
 * App Component (Root)
 * Komponen utama yang menjadi kontainer untuk seluruh aplikasi.
 * Mengintegrasikan Navbar dan Footer yang muncul secara global.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Signal untuk judul aplikasi, dapat digunakan di template atau meta tags
  protected readonly title = signal('loanovafe');
}
