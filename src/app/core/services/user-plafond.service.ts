import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { UserPlafondData } from '../models/response/user-plafond-response.model';
import { AssignUserPlafondRequest } from '../models/request/assign-user-plafond-request.model';

/**
 * USER PLAFOND SERVICE
 * Menangani semua request API terkait manajemen plafond user.
 */
@Injectable({
    providedIn: 'root'
})
export class UserPlafondService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = '/api/user-plafonds';

    /**
     * Assign plafond ke user
     * Endpoint: POST /api/user-plafonds/assign
     */
    assignPlafond(request: AssignUserPlafondRequest): Observable<ApiResponse<UserPlafondData>> {
        return this.http.post<ApiResponse<UserPlafondData>>(`${this.API_URL}/assign`, request);
    }

    /**
     * Mendapatkan plafond aktif dari user
     * Endpoint: GET /api/user-plafonds/users/{userId}/active
     */
    getActiveUserPlafond(userId: number): Observable<ApiResponse<UserPlafondData>> {
        return this.http.get<ApiResponse<UserPlafondData>>(`${this.API_URL}/users/${userId}/active`);
    }

    /**
     * Mendapatkan semua riwayat plafond dari user (active + inactive)
     * Endpoint: GET /api/user-plafonds/users/{userId}/history
     */
    getUserPlafondHistory(userId: number): Observable<ApiResponse<UserPlafondData[]>> {
        return this.http.get<ApiResponse<UserPlafondData[]>>(`${this.API_URL}/users/${userId}/history`);
    }
}
