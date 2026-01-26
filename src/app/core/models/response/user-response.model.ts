/**
 * User Data Model
 * Representasi data user yang diterima dari API /api/users
 * Sesuai dengan UserResponse.java di backend
 */
export interface UserData {
    id: number;
    username: string;
    email: string;
    branchCode: string | null;
    isActive: boolean;
    roles: string[];
}
