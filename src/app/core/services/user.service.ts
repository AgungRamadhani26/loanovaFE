import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { UserData } from '../models/response/user-response.model';
import { UserRequest } from '../models/request/user-request.model';

/**
 * USER SERVICE
 * Menangani semua request API terkait manajemen pengguna.
 */
@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);

    // Base URL ditangani proxy.conf.json agar diarahkan ke http://localhost:9091
    private readonly API_URL = '/api/users';

    /**
     * Mengambil daftar seluruh pengguna
     * Endpoint: GET /api/users
     */
    getAllUsers(): Observable<ApiResponse<UserData[]>> {
        return this.http.get<ApiResponse<UserData[]>>(this.API_URL);
    }

    /**
     * Membuat pengguna baru
     * Endpoint: POST /api/users
     */
    createUser(request: UserRequest): Observable<ApiResponse<UserData>> {
        return this.http.post<ApiResponse<UserData>>(this.API_URL, request);
    }
}
