/**
 * Response data untuk user plafond.
 * Mapping dari UserPlafondResponse.java
 */
export interface UserPlafondData {
    id: number;
    userId: number;
    username: string;
    plafondId: number;
    plafondName: string;
    maxAmount: number;
    remainingAmount: number;
    isActive: boolean;
    assignedAt: string;
}
