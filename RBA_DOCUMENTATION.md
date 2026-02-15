# Role-Based Access Control (RBAC) Documentation

Dokumen ini menjelaskan hak akses untuk setiap peran (Role & Position) dalam aplikasi SiBidan (Puskesmas Project). Tim Frontend diharapkan menggunakan panduan ini untuk mengatur visibility menu dan proteksi halaman (Route Guard).

## 1. Definisi Peran (Roles)

Sistem menggunakan kombinasi `role` dan `position_user` dari database.

| Tipe User             | Role (DB) | Position (DB)       | Deskripsi Singkat                                                                                 |
| :-------------------- | :-------- | :------------------ | :------------------------------------------------------------------------------------------------ |
| **Super Admin**       | `ADMIN`   | -                   | Mengelola User, Master Data Wilayah, Konfigurasi Sistem.                                          |
| **Bidan Koordinator** | `USER`    | `bidan_koordinator` | Memantau seluruh kegiatan, Memverifikasi data dari semua Bidan Desa/Praktik.                      |
| **Bidan Desa**        | `USER`    | `bidan_desa`        | Memverifikasi data dari Bidan Praktik di wilayah desanya.                                         |
| **Bidan Praktik**     | `USER`    | `bidan_praktik`     | Ujung tombak input data pelayanan (KIA, KB, Imunisasi). Hanya bisa melihat data miliknya sendiri. |

---

## 2. Matriks Akses Menu (Frontend)

Berikut adalah daftar menu sidebar/navigasi dan siapa saja yang berhak mengaksesnya.

| Menu / Halaman            | Admin | Bidan Koordinator  |     Bidan Desa     |     Bidan Praktik     | Catatan                                          |
| :------------------------ | :---: | :----------------: | :----------------: | :-------------------: | :----------------------------------------------- |
| **Dashboard**             |  ✅   |         ✅         |         ✅         |          ✅           | Konten dashboard berbeda tiap role.              |
| **Manajemen User**        |  ✅   |         ❌         |         ❌         |          ❌           | CRUD User, Reset Password.                       |
| **Master Data**           |  ✅   |         ❌         |         ❌         |          ❌           | Data Wilayah (Desa, Kecamatan).                  |
| **Data Pasien**           |  ❌   |         ✅         |         ✅         |          ✅           | Master Data Pasien.                              |
| **Pemeriksaan Kehamilan** |  ❌   | ✅ (View & Verify) | ✅ (View & Verify) | ✅ (Input & View Own) | Input, Edit, Delete hanya untuk status tertentu. |
| **Persalinan**            |  ❌   | ✅ (View & Verify) | ✅ (View & Verify) | ✅ (Input & View Own) | -                                                |
| **Keluarga Berencana**    |  ❌   | ✅ (View & Verify) | ✅ (View & Verify) | ✅ (Input & View Own) | -                                                |
| **Imunisasi**             |  ❌   | ✅ (View & Verify) | ✅ (View & Verify) | ✅ (Input & View Own) | -                                                |
| **Laporan / Rekap**       |  ❌   |         ✅         |         ✅         |          ❌           | Laporan Agregat.                                 |

---

## 3. Detail Hak Akses Per Modul

### A. Manajemen User (`/users`)

- **ADMIN**: Full Access (Create, Read, Update, Delete/Deactivate, Reset Password).
- **OTHERS**: No Access (Hanya bisa Edit Profil Sendiri & Ganti Password Sendiri).

### B. Pelayanan Kesehatan (KIA, KB, Imunisasi)

Berlaku untuk modul: `Kehamilan`, `Persalinan`, `KB`, `Imunisasi`.

#### 1. Bidan Praktik (`bidan_praktik`)

- **VIEW**: Hanya bisa melihat data yang **dibuat oleh dirinya sendiri** (Filter otomatis dari Backend: `practice_id`).
- **CREATE**: Bisa membuat data baru. Status awal: **PENDING**.
- **UPDATE**: Hanya bisa mengedit data jika statusnya **REJECTED**.
- **DELETE**: Hanya bisa menghapus data jika statusnya **PENDING** atau **REJECTED**. Data **APPROVED** terkunci.

#### 2. Bidan Desa (`bidan_desa`) & Bidan Koordinator (`bidan_koordinator`)

- **VIEW**: Bisa melihat **SEMUA** data (atau data di wilayahnya untuk Bidan Desa).
- **VERIFY**: Memiliki tombol khusus **Approve (✅)** dan **Reject (❌)**.
  - Jika **Reject**, wajib isi alasan penolakan.
- **CREATE/UPDATE/DELETE**: Tidak memiliki akses input data pelayanan (Read-Only & Verify Only).

---

## 4. Frontend Implementation Guide

### A. Mendapatkan Role User

Setelah login, Backend mengirimkan response `accessToken` dan `user` object. Simpan `user.role` dan `user.position_user` di Global State / Context / LocalStorage.

```javascript
// Contoh data user di frontend
const user = {
  id: "...",
  name: "Bidan Siti",
  role: "USER",
  position_user: "bidan_praktik",
};
```

### B. Route Guard (Contoh React)

Gunakan Component Wrapper untuk membatasi akses URL.

```javascript
// PrivateRoute.js
const PrivateRoute = ({ children, allowedRoles, allowedPositions }) => {
  const { user } = useAuth();

  // 1. Cek Login
  if (!user) return <Navigate to="/login" />;

  // 2. Cek Role (ADMIN / USER)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  // 3. Cek Position (Jika user biasa)
  if (user.role === 'USER' && allowedPositions && !allowedPositions.includes(user.position_user)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// App.js Usage
<Route path="/users" element={
  <PrivateRoute allowedRoles={['ADMIN']}>
    <UserManagementPage />
  </PrivateRoute>
} />

<Route path="/pemeriksaan-kehamilan" element={
  <PrivateRoute allowedRoles={['USER']} allowedPositions={['bidan_praktik', 'bidan_desa', 'bidan_koordinator']}>
    <PemeriksaanKehamilanPage />
  </PrivateRoute>
} />
```

### C. Component Level Permission (Tombol Aksi)

Sembunyikan tombol jika user tidak punya hak akses.

```javascript
// Contoh di Halaman Detail Pemeriksaan
const DetailPemeriksaan = ({ data }) => {
  const { user } = useAuth();

  const isBidanPraktik = user.position_user === "bidan_praktik";
  const isVerifier = ["bidan_desa", "bidan_koordinator"].includes(
    user.position_user,
  );

  return (
    <div>
      {/* Tombol Edit: Hanya Bidan Praktik DAN status REJECTED */}
      {isBidanPraktik && data.status_verifikasi === "REJECTED" && (
        <button onClick={handleEdit}>Edit Data</button>
      )}

      {/* Tombol Verify: Hanya Verifier DAN status PENDING */}
      {isVerifier && data.status_verifikasi === "PENDING" && (
        <div className="verification-actions">
          <button onClick={() => requestVerify("APPROVED")}>Approve</button>
          <button onClick={() => requestVerify("REJECTED")}>Reject</button>
        </div>
      )}
    </div>
  );
};
```
