import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { BranchData } from '../models/response/branch-response.model';

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
     * Authorization: Bearer token (SUPERADMIN only di backend)
     * 
     * @returns Observable berisi ApiResponse dengan array BranchData
     */
    getAllBranches(): Observable<ApiResponse<BranchData[]>> {
        return this.http.get<ApiResponse<BranchData[]>>(this.API_URL);
    }
}
