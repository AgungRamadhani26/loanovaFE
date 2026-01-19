import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { PlafondResponse } from '../models/response/plafond-response.model';

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
}
