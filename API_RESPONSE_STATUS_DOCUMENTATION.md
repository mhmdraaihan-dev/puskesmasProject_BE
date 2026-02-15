# API Response Status Documentation

Dokumen ini mencatat daftar Status Code dan Pesan Error (Message) yang digunakan dalam aplikasi SiBidan.

## 🟢 Success Responses (2xx)

| Status          | Code  | Message                  | Deskripsi                               |
| --------------- | ----- | ------------------------ | --------------------------------------- |
| **200 OK**      | `200` | "Data berhasil diambil"  | General success for GET requests.       |
| **201 Created** | `201` | "Data berhasil dibuat"   | General success for POST requests.      |
| **200 OK**      | `200` | "Data berhasil diupdate" | General success for PUT/PATCH requests. |

---

## 🟡 Client Errors (4xx)

### 1. Authentication & Authorization

| Status               | Code  | Message                                                 | Deskripsi                                                       |
| -------------------- | ----- | ------------------------------------------------------- | --------------------------------------------------------------- |
| **401 Unauthorized** | `401` | "Access denied. No token provided."                     | Header Authorization kosong.                                    |
| **403 Forbidden**    | `403` | "Akses ditolak. Anda tidak memiliki izin."              | Role user tidak sesuai dengan middleware `authorizeRole`.       |
| **403 Forbidden**    | `403` | "Anda hanya diperbolehkan mengedit profil sendiri"      | User mencoba mengedit `user_id` milik orang lain.               |
| **403 Forbidden**    | `403` | "Anda tidak memiliki izin untuk mengubah data sensitif" | User non-admin mencoba mengirim field `role`, `status`, dsb.    |
| **403 Forbidden**    | `403` | "Anda tidak memiliki akses ke data [modul] desa lain"   | User mencoba akses data di luar wilayah tugasnya.               |
| **403 Forbidden**    | `403` | "Anda belum ditugaskan ke Desa/Tempat Praktik manapun"  | User (Bidan) belum memiliki `village_id` atau `practice_place`. |

### 2. Validation & Business Logic

| Status              | Code  | Message                                          | Deskripsi                                                           |
| ------------------- | ----- | ------------------------------------------------ | ------------------------------------------------------------------- |
| **400 Bad Request** | `400` | "ID Pasien tidak valid"                          | Frontend mengirim ID "undefined" atau format salah.                 |
| **400 Bad Request** | `400` | "NIK sudah terdaftar"                            | Duplikasi data pasien (NIK unik).                                   |
| **400 Bad Request** | `400` | "Hanya data berstatus REJECTED yang bisa diedit" | Bidan mencoba edit data yang sedang PENDING atau sudah APPROVED.    |
| **400 Bad Request** | `400` | "Data yang sudah APPROVED tidak dapat dihapus"   | Keamanan data kesehatan agar tidak dimanipulasi setelah verifikasi. |

### 3. Verification Logic

| Status              | Code  | Message                                                 | Deskripsi                                               |
| ------------------- | ----- | ------------------------------------------------------- | ------------------------------------------------------- |
| **400 Bad Request** | `400` | "Alasan penolakan wajib diisi jika status REJECTED"     | Verifikator menolak tanpa alasan.                       |
| **400 Bad Request** | `400` | "Hanya Bidan Desa/Koord yang bisa melihat data pending" | Bidan praktik mencoba akses task verifikasi orang lain. |

---

## 🔴 Server Errors (5xx)

| Status        | Code  | Message                           | Deskripsi                                                                  |
| ------------- | ----- | --------------------------------- | -------------------------------------------------------------------------- |
| **500 Error** | `500` | "Internal Server Error"           | Terjadi error pada database (Prisma) atau logic code yang tidak terhandle. |
| **500 Error** | `500` | "Gagal menghubungkan ke database" | Cek koneksi PostgreSQL/Docker.                                             |
