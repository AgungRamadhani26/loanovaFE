/**
 * Model untuk request update Role.
 * Mapping dari RoleUpdateRequest.java
 * Note: roleName tidak bisa diubah, hanya roleDescription dan permissions
 */
export interface RoleUpdateRequest {
    roleDescription: string;
    permissionIds: number[];
}
