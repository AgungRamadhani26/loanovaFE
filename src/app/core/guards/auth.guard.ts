import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AUTH GUARD
 *
 * Penjaga pintu untuk rute-rute yang membutuhkan login.
 * Jika user belum login, akan ditendang ke halaman login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. BYPASS SERVER-SIDE RENDERING (SSR)
  // Karena LocalStorage tidak ada di server, 'isAuthenticated' pasti false.
  // Kita biarkan lewat dulu, nanti browser yang akan cek ulang (Hydration).
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // 2. CEK STATUS LOGIN (BROWSER ONLY)
  if (authService.isAuthenticated()) {
    return true; // Bolehin masuk
  }

  // Kalau belum, redirect ke login
  // Kita simpan URL tujuan di queryParams biar nanti abis login bisa balik lagi ke sini (optional enhancement)
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false; // Dilarang masuk
};
