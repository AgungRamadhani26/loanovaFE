import { UserRole } from '../user-role.enum';

/**
 * Model data respons sukses setelah login.
 */
export interface LoginData {
    accessToken: string;
    refreshToken: string;
    type: string;
    username: string;
    roles: UserRole[];
    permissions: string[];
}
