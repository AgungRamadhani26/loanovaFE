import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { PermissionData } from '../models/response/permission-response.model';

/**
 * PERMISSION SERVICE
 * Menangani semua request API terkait manajemen permission.
 */
@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = '/api/permissions';

    /**
     * Mengambil daftar seluruh permission
     * Endpoint: GET /api/permissions
     */
    getAllPermissions(): Observable<ApiResponse<PermissionData[]>> {
        return this.http.get<ApiResponse<PermissionData[]>>(this.API_URL);
    }
}
