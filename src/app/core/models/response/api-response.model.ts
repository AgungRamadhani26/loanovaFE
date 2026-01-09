/**
 * Base interface untuk standar response API Loanova.
 * @template T Tipe payload yang ada di properti 'data'
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    code: number;
    timestamp: string;
}
