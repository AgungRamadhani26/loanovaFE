import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { DashboardStatisticsResponse } from '../models/response/dashboard-statistics.model';

/**
 * DASHBOARD SERVICE
 * Service untuk mengambil data statistik dashboard
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API_URL = '/api/dashboard';

    /**
     * Get dashboard statistics
     * Role-based filtered data from backend
     */
    getStatistics(): Observable<ApiResponse<DashboardStatisticsResponse>> {
        return this.http.get<ApiResponse<DashboardStatisticsResponse>>(
            `${this.API_URL}/statistics`
        );
    }
}
