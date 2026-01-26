/**
 * Request untuk assign plafond ke user.
 * Mapping dari AssignUserPlafondRequest.java
 */
export interface AssignUserPlafondRequest {
    userId: number;
    plafondId: number;
    maxAmount: number;
}
