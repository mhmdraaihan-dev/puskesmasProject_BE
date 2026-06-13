# API Documentation - Puskesmas Project (SiBidan)

Dokumentasi ini mencakup seluruh endpoint yang tersedia untuk integrasi Frontend.

## Base URL

`http://localhost:9090/api`

## Authentication

Hampir semua endpoint membutuhkan header `Authorization: Bearer <accessToken>`.

---

## 1. User Management

### 1.1 Login

- **URL**: `/api/login`
- **Method**: `POST`
- **Access**: Public
- **Body**:

```json
{
  "email": "admin@puskesmas.local",
  "password": "admin123"
}
```

### 1.2 Logout

- **URL**: `/api/logout`
- **Method**: `POST`
- **Access**: User terautentikasi.
- **Note**:
  - Token yang dipakai saat request logout akan dimasukkan ke blacklist backend.
  - Token yang sama tidak bisa dipakai lagi ke endpoint protected.
  - Frontend tetap wajib menghapus token dan state user dari storage lokal setelah logout sukses.

### 1.3 Get Profile

- **URL**: `/api/profile`
- **Method**: `GET`
- **Access**: User terautentikasi.

### 1.4 Update Profile

- **URL**: `/api/profile`
- **Method**: `PUT`
- **Access**: User terautentikasi.
- **Note**: Endpoint ini hanya untuk update profil user yang sedang login.

### 1.5 List Users

- **URL**: `/api/users`
- **Method**: `GET`
- **Access**: All Authenticated Users (untuk keperluan dropdown/list).

### 1.6 Get Detail User

- **URL**: `/api/users/:user_id`
- **Method**: `GET`
- **Access**: All Authenticated Users.

### 1.7 Create User (Admin)

- **URL**: `/api/users`
- **Method**: `POST`
- **Access**: ADMIN
- **Note**:
  - `role=ADMIN` tidak wajib `position_user`
  - `role=USER` wajib `position_user`
  - jika `position_user=bidan_desa`, maka `village_id` wajib diisi

### 1.8 Update User

- **URL**: `/api/users/:user_id`
- **Method**: `PUT`
- **Access**:
  - ADMIN: boleh update user mana saja
  - Non-admin: hanya boleh update dirinya sendiri, dan hanya field non-sensitif
- **Note**:
  - User biasa tidak boleh ubah `role`, `position_user`, `status_user`, `village_id`, atau field sensitif lain

### 1.9 Update Status User (Admin)

- **URL**: `/api/users/:user_id/status`
- **Method**: `PATCH`
- **Access**: ADMIN
- **Body**: `{ "status_user": "ACTIVE" | "INACTIVE" }`
- **Penting**:
  - Ini adalah mekanisme **activate / deactivate**
  - **Tidak ada endpoint hard delete user di backend saat ini**
  - Jika FE punya tombol "delete user", behavior yang benar untuk sekarang adalah memakai endpoint ini untuk ubah `status_user` menjadi `INACTIVE`, bukan menghapus record user dari database

### 1.10 Change Own Password

- **URL**: `/api/users/:user_id/password`
- **Method**: `PATCH`
- **Access**: User yang bersangkutan saja.
- **Body**: `{ "old_password": "...", "new_password": "..." }`

### 1.11 Reset Password by Admin

- **URL**: `/api/users/:user_id/reset-password`
- **Method**: `POST`
- **Access**: ADMIN
- **Body**: `{ "new_password": "..." }`

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
- **Response**:
  - `data`: daftar item feed
  - `summary`: akumulasi jumlah laporan sesuai scope dan modul yang dipilih

### 2.2 History Feed Bidan Desa

Mengambil riwayat keputusan pelayanan untuk desa yang di-assign. Default status adalah `APPROVED` dan `REJECTED`.

- **URL**: `/api/dashboard/history`
- **Method**: `GET`
- **Access**: Bidan Desa saja.
- **Query Parameters**:
  - `limit` (opsional)
  - `module`: `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`
  - `status`: `APPROVED`, `REJECTED`, atau kombinasi comma-separated seperti `APPROVED,REJECTED`
- **Response**:
  - `data`: histori laporan bidan praktik di desa yang di-assign
  - `summary`: akumulasi jumlah laporan di desa itu sesuai filter status/modul

### 2.3 Approved Feed Bidan Koordinator

Mengambil feed lintas desa yang hanya berisi data pelayanan berstatus `APPROVED`.

- **URL**: `/api/dashboard/approved-feed`
- **Method**: `GET`
- **Access**: Bidan Koordinator saja.
- **Query Parameters**:
  - `limit` (opsional)
  - `module`: `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`
  - `village_id` (opsional)
- **Response**:
  - `data`: feed laporan `APPROVED`
  - `summary`: akumulasi jumlah laporan seluruh desa atau per desa jika `village_id` dikirim

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
  - `bulan`: alias dari `month`. Jika `bulan` dikirim tanpa `year` / `tahun`, backend akan memakai **tahun berjalan**.
  - `tahun`: alias dari `year`.
  - `search`: Cari berdasarkan Nama Pasien atau NIK.
  - `pasien_id`: Cari riwayat pasien tertentu.
  - `practice_id`: Filter per tempat praktik.
  - `village_id`: Filter per Desa (Hanya Bidan Koordinator / Admin).
  - `tanggal_start`: tanggal mulai range filter.
  - `tanggal_end`: tanggal akhir range filter.
  - `dari_tanggal`: alias dari `tanggal_start`.
  - `sampai_tanggal`: alias dari `tanggal_end`.
- **Security**:
  - `bidan_praktik`: otomatis hanya data dari practice place sendiri
  - `bidan_desa`: otomatis hanya data dari desa yang di-assign
  - `bidan_koordinator`: lintas desa, default `APPROVED` only

### 3.2 Create Data (Inputter)

- **URL**: `/api/{modul}`
- **Method**: `POST`
- **Access**: Bidan Praktik.
- **Note**: `practice_id` otomatis terisi oleh backend dari data user yang login.
- **Khusus modul `keluarga-berencana`**:
  - Field `alat_kontrasepsi` menerima nilai canonical: `PIL`, `SUNTIK`, `IMPLANT`, `IUD`, `KONDOM`, `MOW`, `MOP`, `MAL`
  - Untuk kompatibilitas FE, backend juga menerima alias `SUNTIK 1 BULAN` dan `SUNTIK 3 BULAN`, lalu menyimpannya sebagai `SUNTIK`

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

### 3.7 Feed Revisi Bidan Praktik

Mengambil daftar data yang pernah ditolak untuk kebutuhan halaman revisi bidan praktik.

- **URL**: `/api/health-data-rejected`
- **Method**: `GET`
- **Access**: Bidan Praktik.
- **Query Parameters**:
  - `module`: `health-data` | `kehamilan` | `persalinan` | `keluarga-berencana` | `kb` | `imunisasi`
  - `search`: cari berdasarkan nama pasien / NIK. Untuk imunisasi juga mencocokkan `nama_orangtua`
  - `month`: (1-12) filter bulan berdasarkan `tanggal_verifikasi`
  - `year`: (YYYY) filter tahun berdasarkan `tanggal_verifikasi`
  - `bulan`: alias dari `month`. Jika `bulan` dikirim tanpa `year` / `tahun`, backend akan memakai **tahun berjalan**
  - `tahun`: alias dari `year`
  - `tanggal_start`: tanggal mulai range berdasarkan `tanggal_verifikasi`
  - `tanggal_end`: tanggal akhir range berdasarkan `tanggal_verifikasi`
  - `dari_tanggal`: alias dari `tanggal_start`
  - `sampai_tanggal`: alias dari `tanggal_end`
- **Note**:
  - Endpoint ini sekarang menggabungkan data `REJECTED` dari legacy `health-data` dan 4 modul utama: `KEHAMILAN`, `PERSALINAN`, `KELUARGA_BERENCANA`, `IMUNISASI`
  - Gunakan field `module` untuk menentukan detail layar revisi dan endpoint update yang dipakai FE
  - Setiap item menyediakan `id` dan `data_id` dengan nilai yang sama untuk kompatibilitas FE lama
  - Filter tanggal pada endpoint ini memakai **tanggal reject / verifikasi** (`tanggal_verifikasi`)
- **Response Item Fields**:
  - `id`
  - `data_id`
  - `module`
  - `status_verifikasi`
  - `alasan_penolakan`
  - `tanggal_verifikasi`
  - `tanggal_update`
  - `pasien_nama`
  - `pasien_nik`
  - `verifier`
  - `practice_place`

---

## 4. Master Data

### 4.1 Pasien

- **URL**: `/api/pasien`
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Note**: `GET /api/pasien/:id` mengembalikan data pasien beserta 5 histori medis terakhir dari tiap modul.
- **Access Scope**:
  - `ADMIN`: semua pasien
  - `bidan_koordinator`: semua pasien lintas desa sesuai kebutuhan lihat data approved
  - `bidan_desa`: pasien di desa yang di-assign
  - `bidan_praktik`: pasien yang terkait dengan practice place miliknya, bukan semua pasien di desa yang sama

### 4.2 Wilayah (Village)

- **URL**: `/api/villages`
- **Method**: `GET`

### 4.3 Tempat Praktik

- **URL**: `/api/practice-places`
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Access**:
  - `GET`: Semua user terautentikasi.
  - `POST`, `PUT`, `DELETE`: ADMIN.
- **Query Parameters**:
  - `village_id` (opsional) untuk filter daftar tempat praktik per desa
- **Note**: Satu Tempat Praktik berada di satu Desa dan sekarang bisa memiliki banyak Bidan Praktik.
- **Assignment**: Gunakan field `user_ids` untuk meng-assign banyak bidan praktik ke satu tempat praktik saat create/update.
- **Catatan Endpoint**:
  - FE boleh memakai `GET /api/practice-places?village_id=<village_id>`
  - Endpoint path `GET /api/practice-places/village/:village_id` tetap tersedia

---

## 5. Village Access Control (Security)

Aplikasi menerapkan penguncian data berdasarkan wilayah (Desa).

- **ADMIN**: Memiliki akses ke **seluruh desa**.
- **Bidan Koordinator**: Memiliki akses view ke data `APPROVED` di **seluruh desa**.
- **Bidan Desa**: Hanya bisa mengakses/verifikasi data di **Desa yang ditugaskan**.
- **Bidan Desa**: Tidak bisa membuat, mengubah, atau menghapus data pada **4 modul pelayanan utama**.
- **Bidan Praktik**: Hanya bisa mengakses/input data di **Tempat Praktik miliknya**.
- **Midwife Unassigned**: Jika user belum di-assign ke Desa atau Tempat Praktik, maka akses ke data kesehatan (Pasien, Kehamilan, dll) akan **DIBLOKIR** sama sekali.

### Catatan Sinkronisasi FE-BE

- Untuk user management, backend saat ini memakai konsep **status user** (`ACTIVE` / `INACTIVE`), bukan hard delete user.
- Jika UI FE saat ini memakai istilah "Delete User", sebaiknya diubah menjadi:
  - `Deactivate User` jika memakai endpoint `/api/users/:user_id/status`
  - atau tetap tampil "Hapus" tetapi implementasinya harus dijelaskan ke user sebagai nonaktifkan akun
- Jangan asumsikan ada endpoint `DELETE /api/users/:user_id`, karena backend **belum menyediakan** endpoint tersebut.

---

## 6. Reports (Excel Export)

Endpoint untuk mendownload data dalam format Excel (.xlsx).

### 6.1 Export Pemeriksaan Kehamilan

Mendownload data pemeriksaan kehamilan yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/pemeriksaan-kehamilan/export`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.
- **Scope**:
  - `bidan_desa`: backend otomatis mengunci export ke desa assignment user, walaupun request mengirim `village_id` lain
  - `bidan_koordinator`: bisa export seluruh desa atau per desa
  - `ADMIN`: bisa export seluruh desa atau per desa

### 6.2 Export Persalinan

Mendownload data persalinan yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/persalinan/export`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.
- **Scope**:
  - `bidan_desa`: backend otomatis mengunci export ke desa assignment user, walaupun request mengirim `village_id` lain

### 6.3 Export Keluarga Berencana (KB)

Mendownload data KB yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/keluarga-berencana/export`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.
- **Scope**:
  - `bidan_desa`: backend otomatis mengunci export ke desa assignment user, walaupun request mengirim `village_id` lain

### 6.4 Export Imunisasi

Mendownload data imunisasi yang sudah **APPROVED** ke file Excel.

- **URL**: `/api/reports/imunisasi/export`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.
- **Scope**:
  - `bidan_desa`: backend otomatis mengunci export ke desa assignment user, walaupun request mengirim `village_id` lain

### 6.5 Export Pemeriksaan Kehamilan (PDF)

Mendownload laporan kehamilan dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/pemeriksaan-kehamilan/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.

### 6.6 Export Persalinan (PDF)

Mendownload laporan persalinan dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/persalinan/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.

### 6.7 Export Keluarga Berencana (PDF)

Mendownload laporan KB dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/keluarga-berencana/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.

### 6.8 Export Imunisasi (PDF)

Mendownload laporan imunisasi dalam format PDF (A4 Landscape, siap cetak).

- **URL**: `/api/reports/imunisasi/export-pdf`
- **Method**: `GET`
- **Access**: Bidan Desa / Bidan Koordinator / ADMIN.
- **Query Parameters**:
  - `village_id`: ID Desa (opsional).
  - `month`: (1-12) Filter bulan.
  - `year`: (YYYY) Filter tahun.
  - `bulan`: alias dari `month`.
  - `tahun`: alias dari `year`.
