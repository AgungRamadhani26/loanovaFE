/**
 * Request untuk review/approval Loan Application.
 * Mapping dari LoanReviewRequest.java di backend.
 */
export interface LoanReviewRequest {
    action: 'PROCEED' | 'REJECT' | 'APPROVE';
    comment?: string;
}
