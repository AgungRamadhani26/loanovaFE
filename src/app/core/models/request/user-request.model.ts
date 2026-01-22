/**
 * Model untuk request Create User
 * Sesuai dengan UserRequest.java di backend
 */
export interface UserRequest {
    username: string;
    email: string;
    password: string;
    branchId: number | null;
    isActive: boolean;
    roleIds: number[];
}
