export interface PlafondRequest {
    name: string;
    description: string;
    maxAmount: number;
    interestRate: number;
    tenorMin: number;
    tenorMax: number;
}
