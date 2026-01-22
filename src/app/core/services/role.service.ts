import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { RoleData } from '../models/response/role-response.model';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = '/api/roles';

    getAllRoles(): Observable<ApiResponse<RoleData[]>> {
        return this.http.get<ApiResponse<RoleData[]>>(this.API_URL);
    }
}
