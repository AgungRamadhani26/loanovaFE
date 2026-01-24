/**
 * Model untuk data Permission sesuai dengan response dari backend.
 * Mapping dari PermissionResponse.java
 */
export interface PermissionData {
    id: number;
    permissionName: string;
    permissionDescription: string;
}
