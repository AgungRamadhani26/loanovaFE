export interface PlafondResponse {
    id: number;
    name: string;
    description: string;
    maxAmount: number;
    interestRate: number;
    tenorMin: number;
    tenorMax: number;
}
