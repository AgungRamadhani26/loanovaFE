/**
 * Model untuk detail error validasi dari API.
 */
export interface ValidationError {
    errors: {
        [key: string]: string;
    };
}
