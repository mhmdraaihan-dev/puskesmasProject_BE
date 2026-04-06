# Dokumentasi User Management & Health Data System untuk Frontend

## 📋 Overview Sistem

Sistem ini memiliki 4 jenis user dengan akses berbeda:

1. **ADMIN** - Full access ke semua data
2. **Bidan Praktik** - Lihat & kelola data dari practice place sendiri
3. **Bidan Desa** - Lihat & verifikasi data dari semua practice place di desa yang di-assign
4. **Bidan Koordinator** - Lihat & verifikasi semua data lintas desa

---

## 🏗️ Struktur Data Hierarki

```
Village (Desa)
├── Users (Bidan Desa yang di-assign ke desa ini)
│   └── village_id: "xxx" (Foreign Key ke Village)
│
└── Practice Places (Tempat praktik di desa ini)
    ├── village_id: "xxx" (Foreign Key ke Village)
    ├── user_id: "yyy" (Foreign Key ke User - Bidan Praktik pemilik)
    │
    └── Health Data (Data kesehatan dari practice place ini)
        └── practice_id: "zzz" (Foreign Key ke Practice Place)
```

---

## 👥 User Management

### 1. Create User (Admin Only)

**Endpoint:** `POST /api/users`

**Headers:**

```
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

#### A. Create ADMIN

```json
{
  "full_name": "Admin Utama",
  "email": "admin@example.com",
  "password": "password123",
  "phone_number": "081234567890",
  "address": "Alamat Admin",
  "role": "ADMIN",
  "status_user": "ACTIVE"
}
```

**Catatan:** Admin TIDAK perlu `position_user` dan `village_id`

---

#### B. Create Bidan Praktik

```json
{
  "full_name": "Bidan Praktik A",
  "email": "bidan.praktik@example.com",
  "password": "password123",
  "phone_number": "081234567890",
  "address": "Alamat Bidan",
  "position_user": "bidan_praktik",
  "role": "USER",
  "status_user": "ACTIVE"
}
```

**⚠️ PENTING untuk Bidan Praktik:**

- Setelah user dibuat, **WAJIB** buat `practice_place` untuk user ini
- Bidan praktik TIDAK BISA akses health data jika belum punya practice place
- Endpoint create practice place: `POST /api/practice-places`

**Contoh Create Practice Place:**

```json
POST /api/practice-places
{
  "nama_praktik": "Praktek Bidan A",
  "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6",
  "alamat": "Jl. Contoh No. 123",
  "user_ids": [
    "ad0f65c3-9e01-4da7-a44e-889609b70d06",
    "b7b8c9d0-1111-2222-3333-444455556666"
  ]
}
```

---

#### C. Create Bidan Desa

```json
{
  "full_name": "Bidan Desa Sukahaji",
  "email": "bidan.desa@example.com",
  "password": "password123",
  "phone_number": "081234567890",
  "address": "Desa Sukahaji",
  "position_user": "bidan_desa",
  "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6", // WAJIB!
  "role": "USER",
  "status_user": "ACTIVE"
}
```

**⚠️ PENTING untuk Bidan Desa:**

- `village_id` **WAJIB** diisi
- Village harus sudah ada di database (buat dulu via `POST /api/villages`)
- Bidan desa TIDAK BISA akses health data jika `village_id` NULL

**Validasi di Form Frontend:**

```javascript
// Pseudocode
if (position_user === "bidan_desa") {
  // village_id field jadi REQUIRED
  // Tampilkan dropdown village
  // Fetch villages dari: GET /api/villages
}
```

---

#### D. Create Bidan Koordinator

```json
{
  "full_name": "Bidan Koordinator",
  "email": "bidan.koordinator@example.com",
  "password": "password123",
  "phone_number": "081234567890",
  "address": "Alamat Koordinator",
  "position_user": "bidan_koordinator",
  "role": "USER",
  "status_user": "ACTIVE"
}
```

**Catatan:** Bidan Koordinator TIDAK perlu `village_id` (bisa lihat semua data)

---

## 🏥 Village Management

### 1. List All Villages

**Endpoint:** `GET /api/villages`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6",
      "nama_desa": "SUKAHAJI",
      "created_at": "2026-02-07T15:09:45.782Z",
      "updated_at": "2026-02-07T15:09:45.782Z"
    }
  ]
}
```

### 2. Create Village (Admin Only)

**Endpoint:** `POST /api/villages`

**Request:**

```json
{
  "nama_desa": "SUKAHAJI"
}
```

---

## 🏥 Practice Place Management

### 1. Create Practice Place (Admin Only)

**Endpoint:** `POST /api/practice-places`

**Request:**

```json
{
  "nama_praktik": "Praktek Bidan A",
  "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6",
  "alamat": "Jl. Contoh No. 123",
  "user_ids": [
    "ad0f65c3-9e01-4da7-a44e-889609b70d06",
    "b7b8c9d0-1111-2222-3333-444455556666"
  ]
}
```

**⚠️ PENTING:**

- Setiap item pada `user_ids` harus user dengan `position_user = "bidan_praktik"`
- Satu tempat praktik bisa memiliki banyak bidan praktik
- Satu user bidan praktik hanya bisa terhubung ke 1 tempat praktik pada saat yang sama

---

## 📊 Health Data Access Rules

### Akses Berdasarkan Role/Position:

| Role/Position         | Akses Data                                            | Keterangan                 |
| --------------------- | ----------------------------------------------------- | -------------------------- |
| **ADMIN**             | Semua data                                            | Tidak ada filter           |
| **Bidan Praktik**     | Data dari practice place sendiri                      | Harus punya practice place |
| **Bidan Desa**        | Data dari semua practice place di desa yang di-assign | Harus punya village_id     |
| **Bidan Koordinator** | Semua data (default: APPROVED saja)                   | Bisa filter status         |

### Endpoint Health Data:

```
GET /api/health-data
POST /api/health-data
GET /api/health-data/:data_id
PUT /api/health-data/:data_id
DELETE /api/health-data/:data_id
PUT /api/health-data/:data_id/revise
PATCH /api/health-data/:data_id/approve
PATCH /api/health-data/:data_id/reject
GET /api/health-data-pending
GET /api/health-data-rejected
```

**Semua endpoint memerlukan:**

```
Authorization: Bearer <TOKEN>
```

---

## 🔐 Authentication Flow

### 1. Login

**Endpoint:** `POST /api/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "xxx",
      "full_name": "User Name",
      "email": "user@example.com",
      "role": "USER",
      "position_user": "bidan_praktik",
      "status_user": "ACTIVE"
    }
  }
}
```

### 2. Get Profile

**Endpoint:** `GET /api/profile`

**Headers:**

```
Authorization: Bearer <TOKEN>
```

---

## ⚠️ Common Errors & Solutions

### Error 1: "Anda tidak memiliki akses ke resource ini"

**Penyebab:**

- User dengan role USER mencoba akses endpoint yang hanya untuk ADMIN
- Contoh: `GET /api/users` (hanya ADMIN)

**Solusi:**

- Pastikan endpoint yang di-hit sesuai dengan role user

---

### Error 2: "Role tidak memiliki akses ke data kesehatan"

**Penyebab:**

- User tidak punya `position_user` yang valid
- User role USER tapi `position_user` NULL

**Solusi:**

- Update user untuk set `position_user` yang benar

---

### Error 3: Bidan Praktik dapat data kosong `[]`

**Penyebab:**

- User belum punya `practice_place`

**Solusi:**

- Buat practice place untuk user tersebut via `POST /api/practice-places`

---

### Error 4: Bidan Desa dapat data kosong `[]` atau error

**Penyebab:**

- User `village_id` masih NULL

**Solusi:**

- Update user untuk set `village_id` via `PUT /api/users/:user_id`

---

## 📝 Checklist untuk Form Create User di Frontend

### Form Fields:

```javascript
// Base fields (semua user)
- full_name (required)
- email (required, unique)
- password (required, min 6 char)
- phone_number (optional)
- address (required)
- role (required, dropdown: ADMIN | USER)
- status_user (required, dropdown: ACTIVE | INACTIVE)

// Conditional fields
if (role === "USER") {
  - position_user (required, dropdown: bidan_praktik | bidan_desa | bidan_koordinator)

  if (position_user === "bidan_desa") {
    - village_id (required, dropdown dari GET /api/villages)
  }
}
```

### Validasi:

```javascript
// Pseudocode validasi
if (role === "USER" && !position_user) {
  error("Position user wajib diisi untuk role USER");
}

if (position_user === "bidan_desa" && !village_id) {
  error("Bidan desa wajib di-assign ke village");
}

if (role === "ADMIN" && position_user) {
  warning("Admin tidak perlu position user");
}
```

---

## 🔄 Update User Flow

### Scenario: User sudah dibuat tapi data kurang lengkap

**Endpoint:** `PUT /api/users/:user_id`

**Headers:**

```
Authorization: Bearer <ADMIN_TOKEN>
```

**Contoh 1: Update village_id untuk bidan desa**

```json
{
  "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6"
}
```

**Contoh 2: Update position_user**

```json
{
  "position_user": "bidan_desa",
  "village_id": "fdbc66ee-b684-4cb2-966a-e614fb1957d6"
}
```

---

## 🎯 Best Practices

1. **Urutan Pembuatan Data:**

   ```
   1. Buat Village dulu (jika belum ada)
   2. Buat User
   3. Jika user = bidan_praktik, buat Practice Place
   ```

2. **Validasi di Frontend:**
   - Validasi required fields sebelum submit
   - Disable submit button jika validasi gagal
   - Tampilkan error message yang jelas

3. **Error Handling:**
   - Tampilkan error message dari backend
   - Jangan hardcode error message di frontend

4. **User Experience:**
   - Jika create bidan_praktik, redirect ke form create practice place
   - Jika create bidan_desa, pastikan village sudah dipilih
   - Tampilkan loading state saat submit

---

## 📞 Contact Backend Team

Jika ada pertanyaan atau butuh endpoint tambahan, hubungi backend team.

**Endpoint Documentation:**

- API Base URL: `http://localhost:9090/api`
- All endpoints require `Content-Type: application/json`
- Protected endpoints require `Authorization: Bearer <TOKEN>`

## Tambahan Akses Modul Pelayanan

Untuk 4 modul pelayanan utama (`pemeriksaan-kehamilan`, `persalinan`, `keluarga-berencana`, `imunisasi`), frontend perlu membedakan hak akses berikut:

- **Bidan Praktik**: boleh `create`, `update`, dan `delete` data pelayanan miliknya sendiri sesuai aturan status verifikasi.
- **Bidan Desa**: hanya `view` dan `verify` data pelayanan di desa yang di-assign.
- **Bidan Koordinator**: hanya `view` dan `verify` data pelayanan dari semua desa.
- **ADMIN**: tidak menjadi inputter maupun verifier pada 4 modul pelayanan.

### Aturan Tombol Aksi

- Tampilkan tombol `Input Data`, `Edit`, dan `Hapus` hanya untuk `bidan_praktik`.
- Sembunyikan seluruh tombol mutasi untuk `bidan_desa` dan `bidan_koordinator`.
- Tampilkan tombol `Approve` dan `Reject` hanya untuk `bidan_desa` dan `bidan_koordinator` saat status data masih `PENDING`.
- Untuk `bidan_praktik`, tombol `Edit` hanya muncul saat status `REJECTED`.
- Untuk `bidan_praktik`, tombol `Hapus` hanya muncul saat status `PENDING` atau `REJECTED`.

---

**Last Updated:** 2026-02-07
**Backend Version:** 1.0.0
