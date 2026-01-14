# � PANDUAN LENGKUP & DETAIL: MANAJEMEN USER & KEAMANAN STORAGE (AES)

Tutorial ini mendokumentasikan seluruh kode dan logika yang dibangun untuk fitur **Manajemen User** dan **Sistem Keamanan LocalStorage (AES)** pada project Loanova Frontend.

---

## 🔐 BAGIAN 1: KEAMANAN STORAGE (AES ENCRYPTION)

Kita menggunakan **AES (Advanced Encryption Standard)** untuk mengamankan data JWT dan informasi user di browser.

### 1.1 Storage Utility (`src/app/core/utils/storage-util.ts`)
Fungsi utama file ini adalah sebagai *wrapper* untuk `localStorage` yang melakukan enkripsi otomatis saat menyimpan data dan dekripsi saat mengambil data.

```typescript
import * as CryptoJS from 'crypto-js';

/**
 * STORAGE UTILITY (SECURE VERSION)
 * Menggunakan AES Encryption (crypto-js) untuk mengamankan data di LocalStorage.
 */
export class StorageUtil {
    // Kunci enkripsi (Dalam produksi, sebaiknya ditaruh di environment variable)
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

    static removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    static clear(): void {
        localStorage.clear();
    }
}
```

**Analisis Kode:**
- **`SECRET_KEY`**: Digunakan sebagai gembok digital. Tanpa kunci ini, data yang ada di `localStorage` hanyalah teks acak yang tidak bermakna.
- **`CryptoJS.AES.encrypt`**: Mengubah objek Javascript (setelah di-stringified) menjadi *ciphertext*.
- **`CryptoJS.AES.decrypt`**: Mengembalikan ciphertext menjadi teks asli, lalu diubah kembali menjadi objek melalui `JSON.parse`.
- **`Error Handling`**: Jika data diubah paksa oleh user lewat console browser, dekripsi akan gagal (`decryptedString` kosong), maka sistem otomatis menghapus data tersebut (`removeItem`) untuk mencegah error pada aplikasi.

---

## 🤝 BAGIAN 2: INTEGRASI KE AUTH SERVICE

`AuthService` diupdate agar selalu menggunakan `StorageUtil` alih-alih `localStorage` langsung.

### 2.1 Update AuthService (`src/app/core/services/auth.service.ts`)

```typescript
// ... (imports)
import { StorageUtil } from '../utils/storage-util';

export class AuthService {
    // ... (signals)

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            // AMAN: Mengambil data terenkripsi dan otomatis dekripsi
            const authData = StorageUtil.getItem<any>('loanova_auth');
            if (authData) {
                this.userState.set({ ...authData, isAuthenticated: true });
            }
        }
    }

    // ... (login/logout)

    /**
     * PENYIMPANAN STATE (HELPER)
     */
    saveState(state: UserState) {
        this.userState.set(state);

        if (isPlatformBrowser(this.platformId)) {
            const { isAuthenticated, ...saveData } = state; 
            // AMAN: Simpan ke storage dengan enkripsi AES otomatis
            StorageUtil.setItem('loanova_auth', saveData);
        }
    }
}
```

---

## 📡 BAGIAN 3: USER SERVICE & MODELS

### 3.1 UserService (`src/app/core/services/user.service.ts`)
Menangani pengambilan data mentah dari API.

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private readonly API_URL = '/api/users';

    getAllUsers(): Observable<ApiResponse<UserData[]>> {
        return this.http.get<ApiResponse<UserData[]>>(this.API_URL);
    }
}
```

---

## 🧠 BAGIAN 4: LOGIC USER LIST (SIGNALS & FILTERING)

File: `src/app/features/users/user-list.component.ts`

### 4.1 State & Filters
Kita menggunakan banyak Signal untuk mengatur kondisi tabel secara reaktif.

```typescript
export class UserListComponent implements OnInit {
    // State Data
    users = signal<UserData[]>([]);
    isLoading = signal<boolean>(false);
    
    // State Filter & Search
    searchQuery = signal<string>('');
    selectedBranch = signal<string>('ALL');
    selectedRole = signal<string>('ALL');
    selectedStatus = signal<string>('ALL');
    isFilterVisible = signal<boolean>(false);

    // State Pagination
    currentPage = signal<number>(1);
    pageSize = signal<number>(5);

    // ... (computed properties)
}
```

### 4.2 Mesin Filtering (Computed)
Ini adalah bagian terpenting. `filteredUsers` akan otomatis menghitung ulang isinya setiap kali salah satu filter di atas berubah nilainya.

```typescript
filteredUsers = computed(() => {
    let results = this.users();
    const query = this.searchQuery().toLowerCase().trim();
    const branch = this.selectedBranch();
    const role = this.selectedRole();
    const status = this.selectedStatus();

    // 1. FILTER SEARCH (Cari di semua kolom)
    if (query) {
        results = results.filter(user => {
            const searchStr = `${user.username} ${user.email} ${user.branchCode || ''} ${user.roles.join(' ')}`.toLowerCase();
            return searchStr.includes(query);
        });
    }

    // 2. FILTER BRANCH
    if (branch !== 'ALL') {
        results = results.filter(user => user.branchCode === branch);
    }

    // 3. FILTER ROLE
    if (role !== 'ALL') {
        results = results.filter(user => user.roles.includes(role));
    }

    // 4. FILTER STATUS
    if (status !== 'ALL') {
        results = results.filter(user => user.isActive === (status === 'ACTIVE'));
    }

    return results;
});
```

---

## 🖼️ BAGIAN 5: TAMPILAN UI (HTML & DATA BINDING)

File: `src/app/features/users/user-list.component.html`

### 5.1 Search Bar & Toggle Filter
```html
<div class="search-box">
    <span class="material-icons-outlined">search</span>
    <input type="text" placeholder="..." 
        [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)">
</div>
<button (click)="toggleFilter()">Filter</button>
```

### 5.2 Dynamic Filter Panel
Menggunakan selektor yang di-bind ke Signal pilihan user.
```html
@if (isFilterVisible()) {
    <div class="filter-panel animate-slide-down">
        <select [ngModel]="selectedBranch()" (ngModelChange)="selectedBranch.set($event); onFilterChange()">
            @for (branch of availableBranches(); track branch) {
                <option [value]="branch">{{ branch }}</option>
            }
        </select>
        <!-- ... filter lainnya ... -->
    </div>
}
```

### 5.3 Smart Numbering di Tabel
Mengenali nomor urut berdasarkan posisi halaman.
```html
@for (user of paginatedUsers(); track user.id; let i = $index) {
    <tr>
        <td>{{ (currentPage() - 1) * pageSize() + i + 1 }}</td>
        <!-- ... data user ... -->
    </tr>
}
```

---

## 🎨 BAGIAN 6: STYLING & ANIMASI (CSS)

File: `src/app/features/users/user-list.component.css`

Beberapa teknik kunci yang digunakan:
1.  **Skeleton Loading**: Animasi bar bergerak saat data sedang dimuat (`@keyframes loading`).
2.  **Slide Down Filter**: Panel filter muncul dengan efek meluncur halus (`@keyframes slideDown`).
3.  **Avatar Dinamis**: Menggunakan variabel CSS untuk memberikan warna acak pada inisial user berdasarkan ID-nya.
4.  **Role Badges**: Warna yang berbeda untuk setiap peran (misal: Merah untuk Superadmin, Hijau untuk BM).

---

### 📝 Rangkuman Alur Kerja Developer
1.  **Modifikasi Storage**: Jika ingin menambah data baru untuk disimpan di LocalStorage, gunakan `StorageUtil.setItem` agar data langsung terenkripsi.
2.  **Menambah Filter Baru**: Tambahkan signal baru di `.ts`, masukkan logikanya ke dalam `computed filteredUsers`, lalu tambahkan elemen inputnya di `.html`.
3.  **Keamanan**: Selalu panggil API di dalam blok `if (isPlatformBrowser(this.platformId))` agar aplikasi tidak error saat dijalankan di server (SSR).

---
*Dokumentasi Lengkap Loanova User Management & Security System*
