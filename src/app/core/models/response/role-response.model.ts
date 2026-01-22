/**
 * Model untuk data Role sesuai dengan response dari backend.
 * Mapping dari RoleResponse.java
 */
export interface RoleData {
    id: number;
    roleName: string;
    roleDescription: string;
    permissions: string[];
}
