/**
 * Forgot Password Request DTO
 * Digunakan untuk mengirim request lupa password ke backend.
 * Endpoint: POST /api/auth/forgot-password
 */
export interface ForgotPasswordRequestDTO {
    email: string;
}
