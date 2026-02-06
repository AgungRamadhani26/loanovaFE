/**
 * Status enum dan helper untuk Loan Application
 */
export type LoanStatus =
    | 'PENDING_REVIEW'
    | 'WAITING_APPROVAL'
    | 'WAITING_DISBURSEMENT'
    | 'DISBURSED'
    | 'REJECTED';

export const STATUS_LABELS: Record<LoanStatus, string> = {
    'PENDING_REVIEW': 'Pending Review',
    'WAITING_APPROVAL': 'Waiting Approval',
    'WAITING_DISBURSEMENT': 'Waiting Disbursement',
    'DISBURSED': 'Disbursed',
    'REJECTED': 'Rejected'
};

export const STATUS_COLORS: Record<LoanStatus, { bg: string; text: string }> = {
    'PENDING_REVIEW': { bg: '#fef3c7', text: '#d97706' },
    'WAITING_APPROVAL': { bg: '#dbeafe', text: '#2563eb' },
    'WAITING_DISBURSEMENT': { bg: '#e0e7ff', text: '#4f46e5' },
    'DISBURSED': { bg: '#dcfce7', text: '#16a34a' },
    'REJECTED': { bg: '#fee2e2', text: '#dc2626' }
};
