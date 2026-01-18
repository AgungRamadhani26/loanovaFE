import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { BranchData } from '../models/response/branch-response.model';
import { BranchRequest } from '../models/request/branch-request.model';

/**
 * BRANCH SERVICE
 * Menangani semua request API terkait manajemen cabang (branches).
 *
 * Endpoint: /api/branches
 * Authorization: Membutuhkan Bearer token (otomatis ditangani oleh auth.interceptor.ts)
 */
@Injectable({
    providedIn: 'root'
})
export class BranchService {
    private http = inject(HttpClient);

    // Base URL ditangani proxy.conf.json agar diarahkan ke http://localhost:9091
    private readonly API_URL = '/api/branches';

    /**
     * Mengambil daftar seluruh cabang
     * Endpoint: GET /api/branches
     */
    getAllBranches(): Observable<ApiResponse<BranchData[]>> {
        return this.http.get<ApiResponse<BranchData[]>>(this.API_URL);
    }

    /**
     * Membuat cabang baru
     * Endpoint: POST /api/branches
     * Body: { branchCode, branchName, address }
     */
    createBranch(data: BranchRequest): Observable<ApiResponse<BranchData>> {
        return this.http.post<ApiResponse<BranchData>>(this.API_URL, data);
    }

    /**
     * Memperbarui data cabang
     * Endpoint: PUT /api/branches/{id}
     */
    updateBranch(id: number, data: BranchRequest): Observable<ApiResponse<BranchData>> {
        return this.http.put<ApiResponse<BranchData>>(`${this.API_URL}/${id}`, data);
    }

    /**
     * Menghapus data cabang (Soft Delete)
     * Endpoint: DELETE /api/branches/{id}
     */
    deleteBranch(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
    }
}
