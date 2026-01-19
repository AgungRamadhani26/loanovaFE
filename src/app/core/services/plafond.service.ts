import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { PlafondResponse } from '../models/response/plafond-response.model';
import { PlafondRequest } from '../models/request/plafond-request.model';

@Injectable({
    providedIn: 'root'
})
export class PlafondService {
    private http = inject(HttpClient);
    private readonly API_URL = '/api/plafonds';

    /**
     * Mengambil daftar plafond
     * Endpoint: GET /api/plafonds
     */
    getAllPlafonds(): Observable<ApiResponse<PlafondResponse[]>> {
        return this.http.get<ApiResponse<PlafondResponse[]>>(this.API_URL);
    }

    /**
     * Membuat plafond baru
     * Endpoint: POST /api/plafonds
     */
    createPlafond(request: PlafondRequest): Observable<ApiResponse<PlafondResponse>> {
        return this.http.post<ApiResponse<PlafondResponse>>(this.API_URL, request);
    }

    /**
     * Menghapus plafond
     * Endpoint: DELETE /api/plafonds/{id}
     */
    deletePlafond(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
    }
}
