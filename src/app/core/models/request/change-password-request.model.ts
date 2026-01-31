/**
 * DTO untuk request ganti password.
 * Sesuai dengan backend ChangePasswordRequest.java
 */
export interface ChangePasswordRequestDTO {
    currentPassword: string;
    newPassword: string;
}
