/**
 * Enum untuk mendefinisikan role user di aplikasi.
 * Digunakan baik dalam request maupun response.
 */
export enum UserRole {
    SUPERADMIN = 'SUPERADMIN',
    BACKOFFICE = 'BACKOFFICE',
    CUSTOMER = 'CUSTOMER',
    MARKETING = 'MARKETING',
    BRANCHMANAGER = 'BRANCHMANAGER'
}
