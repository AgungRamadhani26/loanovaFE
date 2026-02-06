/**
 * Response data untuk Loan Application.
 * Mapping dari LoanApplicationResponse.java di backend.
 */
export interface LoanApplicationData {
    id: number;
    userId: number;
    username: string;
    branchId: number;
    branchCode: string;
    plafondId: number;
    plafondName: string;
    amount: number;
    tenor: number;
    interestRateSnapshot: number;
    status: string;
    submittedAt: string;

    // Snapshot data pribadi
    fullNameSnapshot: string;
    phoneNumberSnapshot: string;
    userAddressSnapshot: string;
    nikSnapshot: string;
    birthDateSnapshot: string;
    npwpNumberSnapshot?: string;

    // Data pekerjaan
    occupation: string;
    companyName: string;

    // Data keuangan
    rekeningNumber: string;

    // Dokumen foto
    ktpPhotoSnapshot?: string;
    npwpPhotoSnapshot?: string;
    savingBookCover?: string;
    payslipPhoto?: string;

    // Lokasi pengajuan
    latitude?: number;
    longitude?: number;
}
