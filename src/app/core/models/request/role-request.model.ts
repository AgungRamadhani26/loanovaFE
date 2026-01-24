/**
 * Model untuk request pembuatan Role baru.
 * Mapping dari RoleRequest.java
 */
export interface RoleRequest {
    roleName: string;
    roleDescription: string;
    permissionIds: number[];
}
