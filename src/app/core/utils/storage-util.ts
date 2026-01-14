import * as CryptoJS from 'crypto-js';

/**
 * STORAGE UTILITY (SECURE VERSION)
 * Menggunakan AES Encryption (crypto-js) untuk mengamankan data di LocalStorage.
 */
export class StorageUtil {
    // Kunci enkripsi (Dalam produksi, sebaiknya ditaruh di environment variable atau didapat dari server)
    private static readonly SECRET_KEY = 'loanova-secret-key-2026';

    /**
     * Menyimpan data dengan enkripsi AES
     */
    static setItem(key: string, value: any): void {
        try {
            const jsonString = JSON.stringify(value);
            // Enkripsi string JSON menggunakan AES
            const encryptedData = CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY).toString();
            localStorage.setItem(key, encryptedData);
        } catch (e) {
            console.error('Error secure-saving to localStorage', e);
        }
    }

    /**
     * Mengambil data dan melakukan dekripsi AES
     */
    static getItem<T>(key: string): T | null {
        try {
            const encryptedData = localStorage.getItem(key);
            if (!encryptedData) return null;

            // Dekripsi data menggunakan kunci yang sama
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) return null;

            return JSON.parse(decryptedString) as T;
        } catch (e) {
            console.error('Error secure-reading from localStorage', e);
            // Jika data corrupt (misal key berubah), bersihkan storage agar tidak crash
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Menghapus data
     */
    static removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    /**
     * Membersihkan semua storage
     */
    static clear(): void {
        localStorage.clear();
    }
}
