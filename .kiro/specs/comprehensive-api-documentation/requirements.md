# Requirements Document - Dokumentasi API Komprehensif SiBidan

## Introduction

Dokumentasi API Komprehensif untuk sistem informasi bidan (SiBidan) Puskesmas adalah sebuah dokumentasi teknis lengkap yang dirancang untuk memungkinkan tim Frontend memahami seluruh alur aplikasi backend dengan benar tanpa kebingungan. Dokumentasi ini mencakup konsep bisnis, struktur role-based access control, detail endpoint API, data models & relationships, error handling, dan best practices untuk integrasi Frontend.

Target utama dokumentasi ini adalah developer Frontend yang belum familiar dengan backend SiBidan dapat langsung memahami dan mulai develop tanpa memerlukan penjelasan tambahan dari tim Backend.

## Glossary

- **SiBidan_System**: Sistem informasi bidan untuk mengelola data kesehatan ibu dan anak di Puskesmas
- **API_Documentation**: Dokumentasi teknis yang menjelaskan seluruh endpoint, request/response, dan integrasi API
- **Frontend_Team**: Tim developer yang bertanggung jawab mengembangkan user interface aplikasi SiBidan
- **Role**: Peran pengguna dalam sistem (ADMIN, Bidan Koordinator, Bidan Desa, Bidan Praktik)
- **Workflow**: Alur kerja proses verifikasi data pelayanan kesehatan dari input hingga approval
- **Verification_Status**: Status verifikasi data pelayanan (PENDING, APPROVED, REJECTED)
- **Practice_Place**: Tempat praktik bidan di mana pelayanan kesehatan dilakukan
- **Village**: Desa sebagai unit administratif untuk pembagian wilayah kerja bidan
- **Service_Module**: Modul pelayanan kesehatan (Pemeriksaan Kehamilan, Persalinan, Keluarga Berencana, Imunisasi)
- **Master_Data**: Data referensi yang digunakan di seluruh sistem (User, Pasien, Village, Practice Place)
- **JWT_Token**: JSON Web Token untuk autentikasi dan autorisasi API
- **Access_Control**: Mekanisme pembatasan akses data berdasarkan role dan wilayah kerja
- **Endpoint**: URL API yang menerima request HTTP untuk operasi tertentu
- **Request_Body**: Data yang dikirim client ke server dalam format JSON
- **Response_Body**: Data yang dikembalikan server ke client dalam format JSON
- **HTTP_Method**: Jenis operasi HTTP (GET, POST, PUT, PATCH, DELETE)
- **Query_Parameter**: Parameter yang dikirim melalui URL untuk filtering dan pagination
- **Error_Response**: Response yang dikembalikan server ketika terjadi error
- **Pagination**: Mekanisme membagi data besar menjadi halaman-halaman kecil
- **Filtering**: Mekanisme menyaring data berdasarkan kriteria tertentu
- **Data_Model**: Struktur data entity yang disimpan di database
- **Relationship**: Hubungan antar entity dalam database (one-to-one, one-to-many, many-to-many)
- **Best_Practice**: Panduan terbaik untuk implementasi integrasi API di Frontend

## Requirements

### Requirement 1: Business Concept & Workflow Overview

**User Story:** Sebagai Frontend Developer, saya ingin memahami konsep bisnis dan alur kerja sistem SiBidan, sehingga saya dapat mengembangkan UI yang sesuai dengan proses bisnis yang sebenarnya.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan penjelasan overview sistem SiBidan yang mencakup tujuan aplikasi, domain bisnis, dan konteks penggunaan
2. THE API_Documentation SHALL menjelaskan 4 role utama (ADMIN, Bidan Koordinator, Bidan Desa, Bidan Praktik) beserta tanggung jawab dan hak akses masing-masing role
3. THE API_Documentation SHALL menjelaskan 4 modul pelayanan utama (Pemeriksaan Kehamilan, Persalinan, Keluarga Berencana, Imunisasi) beserta karakteristik masing-masing modul
4. THE API_Documentation SHALL menjelaskan workflow verifikasi data dari input Bidan Praktik (PENDING) → verifikasi Bidan Desa (APPROVE/REJECT) → visibility Koordinator untuk rekapitulasi
5. THE API_Documentation SHALL menjelaskan alur revisi data ketika status REJECTED dan mekanisme re-submit sebagai PENDING
6. THE API_Documentation SHALL menyediakan diagram visual alur workflow verifikasi data pelayanan kesehatan

### Requirement 2: Role-Based Permission Matrix

**User Story:** Sebagai Frontend Developer, saya ingin memahami permission matrix berdasarkan role, sehingga saya dapat mengimplementasikan conditional rendering dan access control di UI dengan benar.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan tabel permission matrix yang menunjukkan operasi CRUD untuk setiap endpoint berdasarkan role
2. THE API_Documentation SHALL menjelaskan konsep Village-based Access Control untuk Bidan Desa (hanya akses desa yang di-assign)
3. THE API_Documentation SHALL menjelaskan konsep Practice Place-based Access Control untuk Bidan Praktik (hanya akses practice place sendiri)
4. THE API_Documentation SHALL menjelaskan special access Bidan Koordinator untuk view data APPROVED lintas desa
5. THE API_Documentation SHALL menjelaskan kondisi Midwife Unassigned (user belum di-assign ke Village atau Practice Place akan diblokir)
6. THE API_Documentation SHALL menyediakan contoh skenario access control untuk setiap role pada operasi endpoint tertentu

### Requirement 3: Authentication & Authorization

**User Story:** Sebagai Frontend Developer, saya ingin memahami mekanisme authentication dan authorization, sehingga saya dapat mengimplementasikan login, token management, dan protected routes dengan benar.

#### Acceptance Criteria

1. THE API_Documentation SHALL menjelaskan flow login dan struktur response yang berisi accessToken JWT
2. THE API_Documentation SHALL menjelaskan cara mengirim JWT token dalam header Authorization untuk protected endpoints
3. THE API_Documentation SHALL menjelaskan mekanisme logout dan token blacklist di backend
4. THE API_Documentation SHALL menjelaskan error response ketika token invalid, expired, atau blacklisted (401 Unauthorized)
5. THE API_Documentation SHALL menyediakan best practice untuk token storage di Frontend (localStorage vs sessionStorage)
6. THE API_Documentation SHALL menyediakan contoh kode implementasi interceptor untuk attach token dan handle 401 response

### Requirement 4: Endpoint Documentation - User Management

**User Story:** Sebagai Frontend Developer, saya ingin dokumentasi lengkap endpoint User Management, sehingga saya dapat mengimplementasikan fitur user CRUD dengan benar.

#### Acceptance Criteria

1. FOR ALL endpoints User Management, THE API_Documentation SHALL mencakup URL, HTTP method, access role, authentication requirement
2. FOR ALL endpoints User Management, THE API_Documentation SHALL menyediakan contoh request body lengkap dengan semua field dan tipe data
3. FOR ALL endpoints User Management, THE API_Documentation SHALL menyediakan contoh response body lengkap untuk success dan error cases
4. FOR ALL endpoints User Management, THE API_Documentation SHALL menjelaskan validation rules untuk setiap field (required, optional, format, constraint)
5. THE API_Documentation SHALL menjelaskan perbedaan endpoint update profile (user sendiri) vs update user (admin)
6. THE API_Documentation SHALL menjelaskan bahwa tidak ada hard delete user dan endpoint status user harus dipakai untuk deactivate
7. THE API_Documentation SHALL menyediakan contoh flow lengkap create user dengan role USER + position bidan_desa + village assignment

### Requirement 5: Endpoint Documentation - Dashboard

**User Story:** Sebagai Frontend Developer, saya ingin dokumentasi lengkap endpoint Dashboard, sehingga saya dapat mengimplementasikan halaman dashboard dengan data yang sesuai role user.

#### Acceptance Criteria

1. FOR ALL endpoints Dashboard, THE API_Documentation SHALL mencakup URL, HTTP method, access role, authentication requirement
2. FOR ALL endpoints Dashboard, THE API_Documentation SHALL menyediakan contoh response structure lengkap dengan nested objects dan arrays
3. THE API_Documentation SHALL menjelaskan endpoint pending tasks untuk Bidan Desa dengan query parameter module dan limit
4. THE API_Documentation SHALL menjelaskan endpoint history feed untuk Bidan Desa dengan query parameter module, status, dan limit
5. THE API_Documentation SHALL menjelaskan endpoint approved feed untuk Bidan Koordinator dengan query parameter module, village_id, dan limit
6. THE API_Documentation SHALL menjelaskan endpoint stats dengan breakdown data per role (data terfilter otomatis)
7. THE API_Documentation SHALL menyediakan contoh penggunaan query parameter untuk filtering data dashboard

### Requirement 6: Endpoint Documentation - Service Modules

**User Story:** Sebagai Frontend Developer, saya ingin dokumentasi lengkap endpoint 4 modul pelayanan kesehatan, sehingga saya dapat mengimplementasikan fitur CRUD data pelayanan dengan benar.

#### Acceptance Criteria

1. FOR ALL endpoints Service_Module (pemeriksaan-kehamilan, persalinan, keluarga-berencana, imunisasi), THE API_Documentation SHALL mencakup URL, HTTP method, access role, authentication requirement
2. FOR ALL endpoints Service_Module, THE API_Documentation SHALL menyediakan contoh request body lengkap dengan semua field specific ke modul tersebut
3. FOR ALL endpoints Service_Module, THE API_Documentation SHALL menyediakan contoh response body lengkap termasuk relasi pasien, practice_place, creator, verifier
4. THE API_Documentation SHALL menjelaskan default filter status_verifikasi per role (praktik: all, desa: APPROVED+REJECTED, koordinator: APPROVED)
5. THE API_Documentation SHALL menjelaskan query parameters untuk list endpoint (page, limit, status_verifikasi, month, year, search, pasien_id, practice_id, village_id)
6. THE API_Documentation SHALL menjelaskan constraint update hanya untuk data REJECTED dan akan auto-reset ke PENDING setelah update
7. THE API_Documentation SHALL menjelaskan constraint delete hanya untuk data PENDING atau REJECTED, data APPROVED terkunci
8. THE API_Documentation SHALL menjelaskan endpoint verify dengan body status (APPROVED/REJECTED) dan alasan wajib jika REJECTED
9. THE API_Documentation SHALL menjelaskan special handling untuk keluarga-berencana dengan canonical values alat_kontrasepsi dan alias compatibility
10. THE API_Documentation SHALL menyediakan contoh full flow input data → verify REJECTED → revisi → verify APPROVED

### Requirement 7: Endpoint Documentation - Master Data

**User Story:** Sebagai Frontend Developer, saya ingin dokumentasi lengkap endpoint Master Data, sehingga saya dapat mengimplementasikan fitur master data management dengan benar.

#### Acceptance Criteria

1. FOR ALL endpoints Master_Data (pasien, village, practice-places), THE API_Documentation SHALL mencakup URL, HTTP method, access role, authentication requirement
2. THE API_Documentation SHALL menjelaskan access scope Pasien per role (admin: all, koordinator: all approved, desa: desa assigned, praktik: practice place sendiri)
3. THE API_Documentation SHALL menjelaskan endpoint GET pasien/:id mengembalikan data pasien dengan 5 histori medis terakhir dari setiap modul
4. THE API_Documentation SHALL menjelaskan endpoint Village hanya read-only (GET) untuk semua user authenticated
5. THE API_Documentation SHALL menjelaskan endpoint Practice Place dengan query parameter village_id untuk filter per desa
6. THE API_Documentation SHALL menjelaskan field user_ids untuk assign banyak bidan praktik ke satu practice place
7. THE API_Documentation SHALL menyediakan contoh create/update practice place dengan multiple user assignment

### Requirement 8: Endpoint Documentation - Reports

**User Story:** Sebagai Frontend Developer, saya ingin dokumentasi lengkap endpoint Reports, sehingga saya dapat mengimplementasikan fitur export Excel dan PDF dengan benar.

#### Acceptance Criteria

1. FOR ALL endpoints Reports (Excel export dan PDF export untuk 4 modul), THE API_Documentation SHALL mencakup URL, HTTP method, access role, authentication requirement
2. THE API_Documentation SHALL menjelaskan query parameters untuk filtering report (village_id, month, year)
3. THE API_Documentation SHALL menjelaskan bahwa report hanya berisi data APPROVED
4. THE API_Documentation SHALL menjelaskan response type adalah file download (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet untuk Excel, application/pdf untuk PDF)
5. THE API_Documentation SHALL menjelaskan access terbatas untuk Bidan Koordinator dan ADMIN
6. THE API_Documentation SHALL menyediakan contoh implementasi download file di Frontend menggunakan fetch API atau axios

### Requirement 9: Data Models & Relationships

**User Story:** Sebagai Frontend Developer, saya ingin memahami struktur data models dan relationships, sehingga saya dapat memahami struktur response API dan relationships antar entity.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan diagram ERD (Entity Relationship Diagram) yang menunjukkan semua entity dan relationships
2. FOR ALL entity (user, village, practice_place, pasien, pemeriksaan_kehamilan, persalinan, keluarga_berencana, imunisasi), THE API_Documentation SHALL menjelaskan struktur field lengkap dengan tipe data
3. THE API_Documentation SHALL menjelaskan enum values untuk field tertentu (Role, StatusUser, PositionUser, VerificationStatus, dll)
4. THE API_Documentation SHALL menjelaskan relationships one-to-one (pemeriksaan_kehamilan ↔ ceklab_report, persalinan ↔ keadaan_ibu_persalinan, dll)
5. THE API_Documentation SHALL menjelaskan relationships one-to-many (village → users, practice_place → pemeriksaan_kehamilan, dll)
6. THE API_Documentation SHALL menjelaskan foreign key constraints dan cascade behavior (onDelete: Cascade, onDelete: SetNull)
7. THE API_Documentation SHALL menjelaskan audit trail fields (created_by, updated_by, created_at, updated_at, diverifikasi_oleh, tanggal_verifikasi)

### Requirement 10: HTTP Status Codes & Error Handling

**User Story:** Sebagai Frontend Developer, saya ingin memahami HTTP status codes dan error response structure, sehingga saya dapat mengimplementasikan error handling yang tepat di Frontend.

#### Acceptance Criteria

1. THE API_Documentation SHALL menjelaskan HTTP status codes yang dipakai sistem (200, 201, 400, 401, 403, 404, 500)
2. THE API_Documentation SHALL menjelaskan semantic meaning dari setiap status code (200: success, 201: created, 400: validation error, 401: unauthorized, 403: forbidden, 404: not found, 500: server error)
3. THE API_Documentation SHALL menyediakan struktur standard error response format dengan field error message dan details
4. THE API_Documentation SHALL menyediakan contoh error response untuk berbagai skenario (validation error, unauthorized, forbidden, not found)
5. THE API_Documentation SHALL menjelaskan perbedaan 401 Unauthorized (token invalid/expired) vs 403 Forbidden (access denied by role/permission)
6. THE API_Documentation SHALL menyediakan best practice handle error di Frontend dengan try-catch dan error notification

### Requirement 11: Pagination & Filtering

**User Story:** Sebagai Frontend Developer, saya ingin memahami mekanisme pagination dan filtering, sehingga saya dapat mengimplementasikan list data dengan pagination dan filter di Frontend.

#### Acceptance Criteria

1. THE API_Documentation SHALL menjelaskan query parameters untuk pagination (page, limit)
2. THE API_Documentation SHALL menjelaskan default values pagination jika tidak dikirim (page: 1, limit: 10)
3. THE API_Documentation SHALL menjelaskan struktur response pagination lengkap dengan metadata (currentPage, totalPages, totalItems, itemsPerPage)
4. THE API_Documentation SHALL menjelaskan query parameters untuk filtering (status_verifikasi, month, year, search, pasien_id, practice_id, village_id)
5. THE API_Documentation SHALL menjelaskan behavior kombinasi multiple filters (AND logic)
6. THE API_Documentation SHALL menjelaskan search behavior (case-insensitive partial match pada field tertentu)
7. THE API_Documentation SHALL menyediakan contoh request URL lengkap dengan kombinasi pagination dan filtering

### Requirement 12: Frontend Integration Best Practices

**User Story:** Sebagai Frontend Developer, saya ingin panduan best practices untuk integrasi API, sehingga saya dapat mengimplementasikan Frontend dengan standar kualitas tinggi.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan best practice token management (storage, attach to request, refresh strategy)
2. THE API_Documentation SHALL menyediakan best practice handle token expiration dan auto-logout
3. THE API_Documentation SHALL menyediakan best practice refresh data setelah approve/reject untuk sinkronisasi state
4. THE API_Documentation SHALL menyediakan best practice implement loading state dan error state di UI
5. THE API_Documentation SHALL menyediakan best practice validation di Frontend sebelum submit (client-side validation matching backend validation)
6. THE API_Documentation SHALL menyediakan best practice optimistic update vs pessimistic update untuk operasi CRUD
7. THE API_Documentation SHALL menyediakan contoh implementasi API service layer dengan axios atau fetch
8. THE API_Documentation SHALL menyediakan contoh implementasi custom hooks untuk data fetching (React) atau composables (Vue)

### Requirement 13: API Response Examples & Snippets

**User Story:** Sebagai Frontend Developer, saya ingin contoh-contoh response API yang realistis, sehingga saya dapat memahami struktur data yang akan saya terima dari backend.

#### Acceptance Criteria

1. FOR ALL major endpoints, THE API_Documentation SHALL menyediakan contoh success response lengkap dengan data realistis
2. FOR ALL major endpoints, THE API_Documentation SHALL menyediakan contoh error response untuk skenario common errors
3. THE API_Documentation SHALL menyediakan contoh response dengan nested relationships (pasien dengan practice_place, pemeriksaan dengan ceklab_report, dll)
4. THE API_Documentation SHALL menyediakan contoh response pagination dengan multiple items
5. THE API_Documentation SHALL menyediakan contoh curl command untuk testing endpoint dari terminal
6. THE API_Documentation SHALL menyediakan contoh JavaScript fetch code untuk calling endpoint
7. THE API_Documentation SHALL menyediakan contoh TypeScript interface untuk typing response data

### Requirement 14: Quick Start Guide

**User Story:** Sebagai Frontend Developer yang baru bergabung, saya ingin quick start guide, sehingga saya dapat segera mulai develop tanpa harus membaca seluruh dokumentasi.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan quick start section di bagian awal dokumentasi
2. THE API_Documentation SHALL menyediakan checklist langkah-langkah setup environment (base URL, CORS, dependencies)
3. THE API_Documentation SHALL menyediakan contoh flow lengkap authentication (login → get profile → call protected endpoint)
4. THE API_Documentation SHALL menyediakan link ke section penting dokumentasi sesuai task developer (implement dashboard → link ke Dashboard section)
5. THE API_Documentation SHALL menyediakan troubleshooting common issues (CORS error, 401 error, validation error)
6. THE API_Documentation SHALL menyediakan contact information tim Backend untuk support

### Requirement 15: Changelog & Versioning

**User Story:** Sebagai Frontend Developer, saya ingin mengetahui perubahan API dari waktu ke waktu, sehingga saya dapat menyesuaikan implementasi Frontend dengan versi API terbaru.

#### Acceptance Criteria

1. THE API_Documentation SHALL menyediakan section changelog yang mencatat perubahan API
2. THE API_Documentation SHALL mencatat breaking changes dengan jelas dan cara migrasi dari versi lama ke baru
3. THE API_Documentation SHALL mencatat penambahan endpoint baru
4. THE API_Documentation SHALL mencatat deprecation endpoint lama dan timeline penghapusan
5. THE API_Documentation SHALL menyediakan tanggal dan versi untuk setiap perubahan
6. THE API_Documentation SHALL menyediakan migration guide untuk breaking changes yang signifikan

