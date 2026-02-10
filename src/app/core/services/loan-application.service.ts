import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response/api-response.model';
import { LoanApplicationData } from '../models/response/loan-application-response.model';
import { ApplicationHistoryData } from '../models/response/application-history-response.model';
import { LoanReviewRequest } from '../models/request/loan-review-request.model';

import { environment } from '../../../environments/environment';

/**
 * LOAN APPLICATION SERVICE
 * Service untuk mengelola data pengajuan pinjaman
 */
@Injectable({
    providedIn: 'root'
})
export class LoanApplicationService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}loan-applications`;

    /**
     * Get all loan applications (filtered by role in backend)
     */
    getAllApplications(): Observable<ApiResponse<LoanApplicationData[]>> {
        return this.http.get<ApiResponse<LoanApplicationData[]>>(this.API_URL);
    }

    /**
     * Get pending review applications (MARKETING)
     */
    getPendingReview(): Observable<ApiResponse<LoanApplicationData[]>> {
        return this.http.get<ApiResponse<LoanApplicationData[]>>(`${this.API_URL}/pending-review`);
    }

    /**
     * Get waiting approval applications (BRANCHMANAGER)
     */
    getWaitingApproval(): Observable<ApiResponse<LoanApplicationData[]>> {
        return this.http.get<ApiResponse<LoanApplicationData[]>>(`${this.API_URL}/waiting-approval`);
    }

    /**
     * Get waiting disbursement applications (BACKOFFICE)
     */
    getWaitingDisbursement(): Observable<ApiResponse<LoanApplicationData[]>> {
        return this.http.get<ApiResponse<LoanApplicationData[]>>(`${this.API_URL}/waiting-disbursement`);
    }

    /**
     * Get application detail by ID
     */
    getApplicationDetail(id: number): Observable<ApiResponse<LoanApplicationData>> {
        return this.http.get<ApiResponse<LoanApplicationData>>(`${this.API_URL}/${id}`);
    }

    /**
     * Get application history
     */
    getApplicationHistory(id: number): Observable<ApiResponse<ApplicationHistoryData[]>> {
        return this.http.get<ApiResponse<ApplicationHistoryData[]>>(`${this.API_URL}/${id}/history`);
    }

    /**
     * Review application (MARKETING: PROCEED/REJECT)
     */
    reviewApplication(id: number, request: LoanReviewRequest): Observable<ApiResponse<LoanApplicationData>> {
        return this.http.put<ApiResponse<LoanApplicationData>>(`${this.API_URL}/${id}/review`, request);
    }

    /**
     * Approve application (BRANCHMANAGER: APPROVE/REJECT)
     */
    approveApplication(id: number, request: LoanReviewRequest): Observable<ApiResponse<LoanApplicationData>> {
        return this.http.put<ApiResponse<LoanApplicationData>>(`${this.API_URL}/${id}/approve`, request);
    }

    /**
     * Disburse application (BACKOFFICE)
     */
    disburseApplication(id: number): Observable<ApiResponse<LoanApplicationData>> {
        return this.http.put<ApiResponse<LoanApplicationData>>(`${this.API_URL}/${id}/disburse`, {});
    }

    /**
     * Reject by backoffice
     */
    rejectByBackoffice(id: number, request: LoanReviewRequest): Observable<ApiResponse<LoanApplicationData>> {
        return this.http.put<ApiResponse<LoanApplicationData>>(`${this.API_URL}/${id}/backoffice-reject`, request);
    }
}
