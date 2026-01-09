import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App Component (Root)
 * Komponen utama yang menjadi kontainer untuk seluruh aplikasi.
 * Sekarang hanya berisi RouterOutlet, layout dikelola melalui App Routing.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Signal untuk judul aplikasi
  protected readonly title = signal('loanovafe');
}
