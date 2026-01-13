/**
 * Enum untuk mendefinisikan role user di aplikasi.
 * Sesuai dengan spesifikasi terbaru untuk hak akses staf internal (Admin Panel):
 * 1. SUPERADMIN - Akses penuh ke seluruh sistem.
 * 2. BRANCHMANAGER - Manajemen operasional di level cabang.
 * 3. MARKETING - Pengguna lapangan untuk pengajuan pinjaman.
 * 4. BACKOFFICE - Verifikasi data dan administrasi pusat.
 */
export enum UserRole {
    SUPERADMIN = 'SUPERADMIN',
    BRANCHMANAGER = 'BRANCHMANAGER',
    MARKETING = 'MARKETING',
    BACKOFFICE = 'BACKOFFICE',
    // Role CUSTOMER dipertahankan untuk kebutuhan portal peminjam di masa depan
    CUSTOMER = 'CUSTOMER'
}
