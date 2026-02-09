/**
 * =============================================================================
 * UNIT TEST UNTUK PLAFOND SERVICE
 * =============================================================================
 *
 * File ini berisi unit test untuk menguji semua method di PlafondService.
 *
 * KONSEP PENTING:
 * ---------------
 * 1. MOCKING: Karena PlafondService menggunakan HttpClient untuk memanggil API,
 *    kita TIDAK ingin benar-benar memanggil server saat testing.
 *    Solusinya: "Mock" atau simulasi HttpClient.
 *
 * 2. TestBed: Utility dari Angular untuk membuat lingkungan testing.
 *    Mirip seperti @NgModule, tapi khusus untuk test.
 *
 * 3. HttpClientTestingModule: Modul khusus Angular untuk testing HTTP.
 *    Ini menggantikan HttpClient asli dengan versi "palsu" yang bisa kita kontrol.
 *
 * STRUKTUR TEST:
 * --------------
 * - describe(): Mengelompokkan test yang terkait
 * - beforeEach(): Kode yang dijalankan SEBELUM setiap test case
 * - it(): Satu test case spesifik
 * - expect(): Assertion - memastikan hasil sesuai ekspektasi
 *
 * =============================================================================
 */

// ============================================================================
// IMPORT DEPENDENCIES
// ============================================================================

// TestBed: Kelas utama Angular untuk setup testing environment
// Ini mirip seperti membuat mini Angular module khusus untuk test
import { TestBed } from '@angular/core/testing';

// HttpClientTestingModule: Modul yang menyediakan HttpClient "palsu"
// HttpTestingController: Controller untuk mengontrol request HTTP dalam test
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';

// Service yang akan kita test
import { PlafondService } from './plafond.service';

// Type/Interface yang dibutuhkan untuk membuat mock data
import { ApiResponse } from '../models/response/api-response.model';
import { PlafondResponse } from '../models/response/plafond-response.model';
import { PlafondRequest } from '../models/request/plafond-request.model';

// ============================================================================
// TEST SUITE: PlafondService
// ============================================================================
// describe() mengelompokkan semua test untuk PlafondService
describe('PlafondService', () => {

    // ========================================================================
    // VARIABEL YANG DIGUNAKAN DI SEMUA TEST
    // ========================================================================

    // Service yang akan ditest (akan di-inject dari TestBed)
    let service: PlafondService;

    // Controller untuk mengontrol HTTP request palsu
    // Dengan ini kita bisa:
    // - Memeriksa URL apa yang dipanggil
    // - Memeriksa method HTTP apa yang digunakan (GET/POST/DELETE)
    // - Mengembalikan response palsu yang kita tentukan
    let httpMock: HttpTestingController;

    // Base URL yang digunakan service (harus sama dengan di PlafondService)
    const API_URL = '/api/plafonds';

    // ========================================================================
    // MOCK DATA (Data Palsu untuk Testing)
    // ========================================================================

    // Contoh data plafond untuk response mock
    // Data ini akan "dikembalikan" oleh HTTP mock seolah-olah dari server
    const mockPlafondList: PlafondResponse[] = [
        {
            id: 1,
            name: 'Plafond Gold',
            description: 'Plafond untuk nasabah premium',
            maxAmount: 500000000,      // 500 juta
            interestRate: 8.5,         // 8.5% per tahun
            tenorMin: 12,              // Minimal 12 bulan
            tenorMax: 60               // Maksimal 60 bulan
        },
        {
            id: 2,
            name: 'Plafond Silver',
            description: 'Plafond standar',
            maxAmount: 100000000,      // 100 juta
            interestRate: 10.0,        // 10% per tahun
            tenorMin: 6,               // Minimal 6 bulan
            tenorMax: 36               // Maksimal 36 bulan
        }
    ];

    // Mock response sukses (sesuai format ApiResponse<T>)
    const mockSuccessResponse: ApiResponse<PlafondResponse[]> = {
        success: true,
        message: 'Data berhasil diambil',
        data: mockPlafondList,
        code: 200,
        timestamp: '2026-02-09T09:00:00.000Z'
    };

    // ========================================================================
    // SETUP TEST ENVIRONMENT (beforeEach)
    // ========================================================================
    // beforeEach() dijalankan SEBELUM setiap test case (it())
    // Ini memastikan setiap test dimulai dengan kondisi yang bersih/fresh
    beforeEach(() => {
        // Konfigurasi TestBed (mirip @NgModule)
        TestBed.configureTestingModule({
            // Import modul yang dibutuhkan
            // HttpClientTestingModule menggantikan HttpClientModule untuk testing
            imports: [HttpClientTestingModule],

            // Provider/Service yang akan ditest
            providers: [PlafondService]
        });

        // Inject service dan controller dari TestBed
        // inject() mengambil instance yang sudah dikonfigurasi
        service = TestBed.inject(PlafondService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    // ========================================================================
    // CLEANUP SETELAH SETIAP TEST (afterEach)
    // ========================================================================
    // Memastikan tidak ada HTTP request yang "menggantung" (tidak di-handle)
    afterEach(() => {
        // verify() akan throw error jika ada request yang belum di-flush
        // Ini membantu mendeteksi jika ada request yang terlewat
        httpMock.verify();
    });

    // ========================================================================
    // TEST CASE 1: Service Harus Bisa Dibuat
    // ========================================================================
    // Test paling dasar - memastikan service bisa di-instantiate
    it('harus berhasil dibuat (instantiate)', () => {
        // toBeTruthy() memastikan service tidak null/undefined
        expect(service).toBeTruthy();
    });

    // ========================================================================
    // TEST CASE 2: getAllPlafonds()
    // ========================================================================
    // Menguji method untuk mengambil semua plafond
    describe('getAllPlafonds()', () => {

        it('harus memanggil GET ke /api/plafonds', () => {
            // ARRANGE & ACT:
            // Subscribe ke observable yang dikembalikan service
            // Ini akan memicu HTTP request
            service.getAllPlafonds().subscribe(response => {
                // ASSERT: Cek response yang diterima
                expect(response.success).toBe(true);
                expect(response.data.length).toBe(2);  // Ada 2 plafond di mock data
                expect(response.data[0].name).toBe('Plafond Gold');
            });

            // MOCK HTTP: Tangkap request yang dibuat oleh service
            // expectOne() memastikan hanya ada 1 request ke URL tersebut
            const req = httpMock.expectOne(API_URL);

            // ASSERT: Pastikan method yang digunakan adalah GET
            expect(req.request.method).toBe('GET');

            // FLUSH: Kirim response palsu ke subscriber
            // Ini mensimulasikan server mengembalikan data
            req.flush(mockSuccessResponse);
        });
    });

    // ========================================================================
    // TEST CASE 3: getPublicPlafonds()
    // ========================================================================
    // Menguji method untuk mengambil plafond publik (tanpa auth)
    describe('getPublicPlafonds()', () => {

        it('harus memanggil GET ke /api/plafonds/public', () => {
            // ACT: Panggil method
            service.getPublicPlafonds().subscribe(response => {
                // ASSERT
                expect(response.success).toBe(true);
                expect(response.data).toEqual(mockPlafondList);
            });

            // MOCK: Tangkap request ke endpoint /public
            const req = httpMock.expectOne(`${API_URL}/public`);

            // ASSERT: Harus GET
            expect(req.request.method).toBe('GET');

            // FLUSH: Kembalikan mock response
            req.flush(mockSuccessResponse);
        });
    });

    // ========================================================================
    // TEST CASE 4: createPlafond()
    // ========================================================================
    // Menguji method untuk membuat plafond baru
    describe('createPlafond()', () => {

        it('harus memanggil POST ke /api/plafonds dengan request body', () => {
            // ARRANGE: Siapkan data request (plafond baru)
            const newPlafond: PlafondRequest = {
                name: 'Plafond Bronze',
                description: 'Plafond untuk pemula',
                maxAmount: 50000000,
                interestRate: 12.0,
                tenorMin: 3,
                tenorMax: 24
            };

            // Mock response untuk created plafond (dengan id baru)
            const createdPlafond: ApiResponse<PlafondResponse> = {
                success: true,
                message: 'Plafond berhasil dibuat',
                data: { id: 3, ...newPlafond },  // Server mengembalikan dengan ID
                code: 201,
                timestamp: '2026-02-09T09:00:00.000Z'
            };

            // ACT: Panggil method create
            service.createPlafond(newPlafond).subscribe(response => {
                // ASSERT: Cek response
                expect(response.success).toBe(true);
                expect(response.data.id).toBe(3);
                expect(response.data.name).toBe('Plafond Bronze');
            });

            // MOCK: Tangkap request POST
            const req = httpMock.expectOne(API_URL);

            // ASSERT: Method harus POST
            expect(req.request.method).toBe('POST');

            // ASSERT: Body request harus sesuai dengan yang dikirim
            expect(req.request.body).toEqual(newPlafond);

            // FLUSH: Kembalikan response created
            req.flush(createdPlafond);
        });
    });

    // ========================================================================
    // TEST CASE 5: deletePlafond()
    // ========================================================================
    // Menguji method untuk menghapus plafond
    describe('deletePlafond()', () => {

        it('harus memanggil DELETE ke /api/plafonds/{id}', () => {
            // ARRANGE: ID plafond yang akan dihapus
            const plafondId = 1;

            // Mock response untuk delete (void/kosong)
            const deleteResponse: ApiResponse<void> = {
                success: true,
                message: 'Plafond berhasil dihapus',
                data: undefined as unknown as void,
                code: 200,
                timestamp: '2026-02-09T09:00:00.000Z'
            };

            // ACT: Panggil method delete
            service.deletePlafond(plafondId).subscribe(response => {
                // ASSERT
                expect(response.success).toBe(true);
                expect(response.message).toBe('Plafond berhasil dihapus');
            });

            // MOCK: Tangkap request DELETE ke URL dengan ID
            const req = httpMock.expectOne(`${API_URL}/${plafondId}`);

            // ASSERT: Method harus DELETE
            expect(req.request.method).toBe('DELETE');

            // FLUSH: Kembalikan response
            req.flush(deleteResponse);
        });
    });
});
