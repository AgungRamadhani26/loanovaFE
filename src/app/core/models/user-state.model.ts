import { UserRole } from './user-role.enum';

/**
 * Model untuk melacak state user di frontend.
 */
export interface UserState {
    isAuthenticated: boolean;
    token: string | null;
    refreshToken: string | null;
    username: string | null;
    roles: UserRole[];
}
