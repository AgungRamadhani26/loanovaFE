/**
 * DASHBOARD STATISTICS MODEL
 * Response dari API /api/dashboard/statistics
 */
export interface DashboardStatisticsResponse {
    totalSubmissionAmount: number;
    totalDisbursedAmount: number;
    estimatedPrincipal: number;
    estimatedInterest: number;
    estimatedTotalIncome: number;
    statusDistribution: StatusDistribution[];
    plafondDistribution: PlafondDistribution[];
}

export interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

export interface PlafondDistribution {
    plafondName: string;
    count: number;
}
