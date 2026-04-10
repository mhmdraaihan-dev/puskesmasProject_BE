# API Documentation - Puskesmas Project (SiBidan)

Dokumentasi ini mencakup seluruh endpoint yang tersedia untuk integrasi Frontend.

## Base URL

`http://localhost:9090/api`

## Authentication

Hampir semua endpoint membutuhkan header `Authorization: Bearer <accessToken>`.

---

## 1. User Management

### 1.1 List Users

- **URL**: `/api/users`
- **Method**: `GET`
- **Access**: All Authenticated Users (untuk keperluan dropdown/list).

### 1.2 Get Detail User

- **URL**: `/api/users/:user_id`
- **Method**: `GET`
- **Access**: All Authenticated Users.

### 1.3 Update Status User (Admin)

- **URL**: `/api/users/:user_id/status`
- **Method**: `PATCH`
- **Access**: ADMIN
- **Body**: `{ "status_user": "ACTIVE" | "INACTIVE" }`

### 1.4 Change Password

- **URL**: `/api/users/:user_id/password`
- **Method**: `PATCH`
- **Access**: User yang bersangkutan saja.
- **Body**: `{ "old_password": "...", "new_password": "..." }`

---

## 2. Dashboard

### 2.1 Pending Tasks (Verifikasi Desa)

Mengambil daftar tugas yang menunggu persetujuan (PENDING) dari 4 modul pelayanan.

- **URL**: `/api/dashboard/pending-tasks`
- **Method**: `GET`
- **Access**: Bidan Desa saja.
- **Query Parameters**:
  - `limit` (opsional)
  - `module`: `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`

### 2.2 History Feed Bidan Desa

Mengambil riwayat keputusan pelayanan untuk desa yang di-assign. Default status adalah `APPROVED` dan `REJECTED`.

- **URL**: `/api/dashboard/history`
- **Method**: `GET`
- **Access**: Bidan Desa saja.
- **Query Parameters**:
  - `limit` (opsional)
  - `module`: `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`
  - `status`: `APPROVED`, `REJECTED`, atau kombinasi comma-separated seperti `APPROVED,REJECTED`

### 2.3 Approved Feed Bidan Koordinator

Mengambil feed lintas desa yang hanya berisi data pelayanan berstatus `APPROVED`.

- **URL**: `/api/dashboard/approved-feed`
- **Method**: `GET`
- **Access**: Bidan Koordinator saja.
- **Query Parameters**:
  - `limit` (opsional)
  - `module`: `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`
  - `village_id` (opsional)

### 2.4 Stats (Akumulasi Data)

Mengambil angka statistik total dan bulan ini.

- **URL**: `/api/dashboard/stats`
- **Method**: `GET`
- **Access**: Semua Role (Data terfilter otomatis sesuai role dan wilayahnya).

---

## 3. Pelayanan Kesehatan (4 Modul Utama)

Modul: `pemeriksaan-kehamilan`, `persalinan`, `keluarga-berencana`, `imunisasi`.

### 3.1 List & Filter Data (All Roles)

Mengambil daftar data kesehatan dengan berbagai filter.

- **URL**: `/api/{modul}`
- **Method**: `GET`
- **Access**: Semua user terautentikasi sesuai filter wilayah/role.
- **Default status per role jika `status_verifikasi` tidak dikirim**:
  - `ADMIN`: semua status
  - `bidan_praktik`: semua status di practice place miliknya
  - `bidan_desa`: `APPROVED` + `REJECTED`
  - `bidan_koordinator`: `APPROVED`
- **Query Parameters**:
  - `page`, `limit` (Pagination)
  - `status_verifikasi`: `PENDING` | `APPROVED` | `REJECTED`
  - `month`: (1-12) Filter bulan rekapitulasi.
  - `year`: (YYYY) Filter tahun rekapitulasi.
  - `search`: Cari berdasarkan Nama Pasien atau NIK.
  - `pasien_id`: Cari riwayat pasien tertentu.
  - `practice_id`: Filter per tempat praktik.
  - `village_id`: Filter per Desa (Hanya Bidan Koordinator / Admin).
- **Security**:
  - `bidan_praktik`: otomatis hanya data dari practice place sendiri
  - `bidan_desa`: otomatis hanya data dari desa yang di-assign
  - `bidan_koordinator`: lintas desa, default `APPROVED` only

### 3.2 Create Data (Inputter)

- **URL**: `/api/{modul}`
- **Method**: `POST`
- **Access**: Bidan Praktik.
- **Note**: `practice_id` otomatis terisi oleh backend dari data user yang login.

### 3.3 Update Data (Revision)

- **URL**: `/api/{modul}/:id`
- **Method**: `PUT`
- **Access**: Bidan Praktik.
- **Condition**: Hanya bisa jika status = `REJECTED`. Setelah disave, status otomatis balik jadi `PENDING`.

### 3.4 Delete Data

- **URL**: `/api/{modul}/:id`
- **Method**: `DELETE`
- **Access**: Bidan Praktik.
- **Condition**: Hanya bisa jika status = `PENDING` atau `REJECTED`. Data `APPROVED` terkunci dan tidak dapat dihapus.

### 3.5 Verify Data (Approver)

- **URL**: `/api/{modul}/:id/verify`
- **Method**: `PATCH`
- **Access**: Bidan Desa.
- **Body**:

```json
{
  "status": "APPROVED" | "REJECTED",
  "alasan": "Wajib diisi jika REJECTED"
}
```

### 3.6 Rekapitulasi (Bidan Koordinator)

Untuk fitur rekapitulasi, gunakan endpoint **3.1 (List & Filter Data)** dengan parameter tambahan:

- **Contoh URL**: `/api/pemeriksaan-kehamilan?status_verifikasi=APPROVED&month=02&year=2026`
- **Result**: Maka akan mengembalikan seluruh data lengkap sesuai modulnya (termasuk relasi `pasien`, `practice_place`, `ceklab_report`, `creator`, dll) yang sudah berstatus `APPROVED` di bulan tersebut.

---

## 4. Master Data

### 4.1 Pasien

- **URL**: `/api/pasien`
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Note**: `GET /api/pasien/:id` mengembalikan data pasien beserta 5 histori medis terakhir dari tiap modul.

### 4.2 Wilayah (Village)

- **URL**: `/api/villages`
- **Method**: `GET`

### 4.3 Tempat Praktik

- **URL**: `/api/practice-places`
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Access**:
  - `GET`: Semua user terautentikasi.
  - `POST`, `PUT`, `DELETE`: ADMIN.
- **Note**: Satu Tempat Praktik berada di satu Desa dan sekarang bisa memiliki banyak Bidan Praktik.
- **Assignment**: Gunakan field `user_ids` untuk meng-assign banyak bidan praktik ke satu tempat praktik saat create/update.

---

## 5. Village Access Control (Security)

Aplikasi menerapkan penguncian data berdasarkan wilayah (Desa).

- **ADMIN**: Memiliki akses ke **seluruh desa**.
- **Bidan Koordinator**: Memiliki akses view ke data `APPROVED` di **seluruh desa**.
- **Bidan Desa**: Hanya bisa mengakses/verifikasi data di **Desa yang ditugaskan**.
- **Bidan Desa**: Tidak bisa membuat, mengubah, atau menghapus data pada **4 modul pelayanan utama**.
- **Bidan Praktik**: Hanya bisa mengakses/input data di **Tempat Praktik miliknya**.
- **Midwife Unassigned**: Jika user belum di-assign ke Desa atau Tempat Praktik, maka akses ke data kesehatan (Pasien, Kehamilan, dll) akan **DIBLOKIR** sama sekali.

---

## 6. Reports (Excel Export)

Endpoint untuk mendownload data dalam format Excel (.xlsx).

### 6.1 Export Pemeriksaan Kehamilan

Mendownload data pemeriksaan kehamilan yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/pemeriksaan-kehamilan/export`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.2 Export Persalinan

Mendownload data persalinan yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/persalinan/export`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.3 Export Keluarga Berencana (KB)

Mendownload data KB yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/keluarga-berencana/export`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.4 Export Imunisasi

Mendownload data imunisasi yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/imunisasi/export`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.5 Export Pemeriksaan Kehamilan (PDF)

Mendownload laporan kehamilan dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/pemeriksaan-kehamilan/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.6 Export Persalinan (PDF)

Mendownload laporan persalinan dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/persalinan/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.7 Export Keluarga Berencana (PDF)

Mendownload laporan KB dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/keluarga-berencana/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.

### 6.8 Export Imunisasi (PDF)

Mendownload laporan imunisasi dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/imunisasi/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
