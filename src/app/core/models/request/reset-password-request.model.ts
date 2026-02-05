/**
 * Reset Password Request DTO
 * Digunakan untuk mengirim request reset password ke backend.
 * Endpoint: POST /api/auth/reset-password
 */
export interface ResetPasswordRequestDTO {
    token: string;
    newPassword: string;
}
