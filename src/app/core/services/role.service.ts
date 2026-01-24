import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { RoleData } from '../models/response/role-response.model';
import { RoleRequest } from '../models/request/role-request.model';
import { RoleUpdateRequest } from '../models/request/role-update-request.model';

/**
 * ROLE SERVICE
 * Menangani semua request API terkait manajemen role.
 */
@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = '/api/roles';

    /**
     * Mengambil daftar seluruh role
     * Endpoint: GET /api/roles
     */
    getAllRoles(): Observable<ApiResponse<RoleData[]>> {
        return this.http.get<ApiResponse<RoleData[]>>(this.API_URL);
    }

    /**
     * Membuat role baru
     * Endpoint: POST /api/roles
     */
    createRole(request: RoleRequest): Observable<ApiResponse<RoleData>> {
        return this.http.post<ApiResponse<RoleData>>(this.API_URL, request);
    }

    /**
     * Memperbarui role
     * Endpoint: PUT /api/roles/{id}
     */
    updateRole(id: number, request: RoleUpdateRequest): Observable<ApiResponse<RoleData>> {
        return this.http.put<ApiResponse<RoleData>>(`${this.API_URL}/${id}`, request);
    }

    /**
     * Menghapus role
     * Endpoint: DELETE /api/roles/{id}
     */
    deleteRole(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
    }
}
