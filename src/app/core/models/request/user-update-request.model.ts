/**
 * Model untuk request Update User
 * Sesuai dengan UserUpdateRequest.java di backend
 * Tidak memerlukan password karena update tidak mengubah password
 */
export interface UserUpdateRequest {
    username: string;
    email: string;
    branchId: number | null;
    isActive: boolean;
    roleIds: number[];
}
