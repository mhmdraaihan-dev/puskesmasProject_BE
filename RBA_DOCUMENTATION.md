# Role-Based Access Control (RBAC) Documentation

Dokumen ini menjelaskan hak akses untuk setiap peran (`role` dan `position_user`) dalam aplikasi SiBidan. Tim frontend dapat memakai dokumen ini untuk menu visibility, route guard, dan kontrol tombol aksi.

## 1. Definisi Peran

| Tipe User | Role (DB) | Position (DB) | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `ADMIN` | - | Mengelola user, master data wilayah, dan konfigurasi sistem. |
| **Bidan Koordinator** | `USER` | `bidan_koordinator` | Melihat semua data pelayanan dan memverifikasi data lintas desa. |
| **Bidan Desa** | `USER` | `bidan_desa` | Melihat dan memverifikasi data pelayanan di desa yang di-assign. |
| **Bidan Praktik** | `USER` | `bidan_praktik` | Inputter utama untuk modul pelayanan. Hanya dapat memutasi data miliknya sendiri. |

## 2. Matriks Akses Menu

| Menu / Halaman | Admin | Bidan Koordinator | Bidan Desa | Bidan Praktik | Catatan |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Dashboard** | Yes | Yes | Yes | Yes | Konten dashboard berbeda per role. |
| **Manajemen User** | Yes | No | No | No | CRUD user dan reset password. |
| **Master Data** | Yes | No | No | No | Data wilayah dan konfigurasi dasar. |
| **Data Pasien** | No | Yes | Yes | Yes | Master data pasien tetap dapat diakses sesuai wilayah. |
| **Pemeriksaan Kehamilan** | No | View & Verify | View & Verify | Input & View Own | Create/Update/Delete hanya untuk `bidan_praktik`. |
| **Persalinan** | No | View & Verify | View & Verify | Input & View Own | Create/Update/Delete hanya untuk `bidan_praktik`. |
| **Keluarga Berencana** | No | View & Verify | View & Verify | Input & View Own | Create/Update/Delete hanya untuk `bidan_praktik`. |
| **Imunisasi** | No | View & Verify | View & Verify | Input & View Own | Create/Update/Delete hanya untuk `bidan_praktik`. |
| **Laporan / Rekap** | No | Yes | Yes | No | Rekap agregat dan laporan export. |

Catatan penting: untuk 4 modul pelayanan, `bidan_desa` dan `bidan_koordinator` adalah `Read-Only & Verify Only`.

## 3. Detail Hak Akses Per Modul

### A. Manajemen User (`/users`)

- **ADMIN**: Full access (`create`, `read`, `update`, `status change`, `reset password`).
- **Role lain**: Tidak memiliki akses manajemen user, hanya dapat mengelola profil dan password sendiri.

### B. Pelayanan Kesehatan

Berlaku untuk modul `Kehamilan`, `Persalinan`, `KB`, dan `Imunisasi`.

#### 1. Bidan Praktik (`bidan_praktik`)

- **VIEW**: Hanya dapat melihat data di tempat praktiknya sendiri.
- **CREATE**: Dapat membuat data baru. Status awal selalu `PENDING`.
- **UPDATE**: Hanya dapat mengubah data jika status `REJECTED`.
- **DELETE**: Hanya dapat menghapus data jika status `PENDING` atau `REJECTED`.
- **VERIFY**: Tidak memiliki akses verifikasi.

#### 2. Bidan Desa (`bidan_desa`)

- **VIEW**: Dapat melihat data dari semua practice place di desa yang di-assign.
- **VERIFY**: Dapat `APPROVE` atau `REJECT` data `PENDING` di desanya.
- **CREATE/UPDATE/DELETE**: Tidak memiliki akses input data pelayanan.

#### 3. Bidan Koordinator (`bidan_koordinator`)

- **VIEW**: Dapat melihat data dari seluruh desa.
- **VERIFY**: Dapat `APPROVE` atau `REJECT` seluruh data `PENDING`.
- **CREATE/UPDATE/DELETE**: Tidak memiliki akses input data pelayanan.

## 4. Frontend Implementation Guide

### A. Simpan Role User

Setelah login, backend mengirim `token` dan objek `user`. Simpan `user.role` dan `user.position_user` di state aplikasi.

```javascript
const user = {
  id: "...",
  name: "Bidan Siti",
  role: "USER",
  position_user: "bidan_praktik",
};
```

### B. Route Guard

Gunakan route guard untuk membatasi akses halaman.

```javascript
const PrivateRoute = ({ children, allowedRoles, allowedPositions }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  if (
    user.role === "USER" &&
    allowedPositions &&
    !allowedPositions.includes(user.position_user)
  ) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

Halaman modul pelayanan boleh diakses oleh `bidan_praktik`, `bidan_desa`, dan `bidan_koordinator`, tetapi aksi tombolnya harus dibedakan.

### C. Component Level Permission

Sembunyikan tombol aksi sesuai role.

```javascript
const DetailPemeriksaan = ({ data }) => {
  const { user } = useAuth();

  const canMutatePelayanan = user.position_user === "bidan_praktik";
  const canVerifyPelayanan = ["bidan_desa", "bidan_koordinator"].includes(
    user.position_user,
  );

  return (
    <div>
      {canMutatePelayanan && <button onClick={handleCreate}>Input Data</button>}

      {canMutatePelayanan && data.status_verifikasi === "REJECTED" && (
        <button onClick={handleEdit}>Edit Data</button>
      )}

      {canMutatePelayanan && data.status_verifikasi !== "APPROVED" && (
        <button onClick={handleDelete}>Hapus Data</button>
      )}

      {canVerifyPelayanan && data.status_verifikasi === "PENDING" && (
        <div className="verification-actions">
          <button onClick={() => requestVerify("APPROVED")}>Approve</button>
          <button onClick={() => requestVerify("REJECTED")}>Reject</button>
        </div>
      )}
    </div>
  );
};
```
