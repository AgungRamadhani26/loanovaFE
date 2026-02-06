/**
 * Response data untuk Application History.
 * Mapping dari ApplicationHistoryResponse.java di backend.
 */
export interface ApplicationHistoryData {
    id: number;
    loanApplicationId: number;
    actionByUserId: number;
    actionByUsername: string;
    actionByRole: string;
    status: string;
    comment: string;
    createdAt: string;
}
