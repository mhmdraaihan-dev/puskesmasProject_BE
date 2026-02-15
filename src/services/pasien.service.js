import prisma from "../../lib/prisma.js";

/**
 * Get all pasien with filtering and pagination
 */
export const getAllPasien = async (filters = {}, user) => {
  const { page = 1, limit = 10, search } = filters;

  const skip = (page - 1) * limit;
  const where = {};

  // Logic Filtering per Desa
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    // Cari village_id user (Bidan Desa atau Bidan Praktik)
    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: {
        practice_place: true,
      },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    // FIX: Jika bidan belum punya desa/tempat praktik, dia tidak boleh lihat data apapun
    if (!userVillageId) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
      };
    }

    where.village_id = userVillageId;
  }

  // Search by nama or NIK
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { nik: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pasien.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        village: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.pasien.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get pasien by ID
 */
export const getPasienById = async (id, user) => {
  if (!id || id === "undefined") {
    throw new Error("ID Pasien tidak valid");
  }

  const data = await prisma.pasien.findUnique({
    where: { pasien_id: id },
    include: {
      village: true,
      pemeriksaan_kehamilan: {
        orderBy: { tanggal: "desc" },
        take: 5, // Last 5 records
      },
      persalinan: {
        orderBy: { tanggal_partus: "desc" }, // FIX: tanggal_persalinan -> tanggal_partus
        take: 5,
      },
      keluarga_berencana: {
        orderBy: { tanggal_kunjungan: "desc" }, // FIX: tanggal -> tanggal_kunjungan (cek schema dulu)
        take: 5,
      },
      imunisasi: {
        orderBy: { tgl_imunisasi: "desc" }, // FIX: tanggal -> tgl_imunisasi (cek schema dulu)
        take: 5,
      },
    },
  });

  if (!data) {
    throw new Error("Pasien tidak ditemukan");
  }

  // Security Check: Only allow access if in the same village (for Bidan Desa/Praktik)
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (data.village_id !== userVillageId) {
      throw new Error("Anda tidak memiliki akses ke data pasien desa lain");
    }
  }

  return data;
};

/**
 * Create new pasien
 */
export const createPasien = async (payload) => {
  const { nik, nama, alamat_lengkap, tanggal_lahir, village_id } = payload;

  // Check if NIK already exists
  const existing = await prisma.pasien.findUnique({
    where: { nik },
  });

  if (existing) {
    throw new Error("NIK sudah terdaftar");
  }

  const data = await prisma.pasien.create({
    data: {
      nik,
      nama,
      alamat_lengkap,
      tanggal_lahir: new Date(tanggal_lahir),
      village_id, // Save the village
    },
  });

  return data;
};

/**
 * Update pasien
 */
export const updatePasien = async (id, payload, user) => {
  const { nama, alamat_lengkap, tanggal_lahir } = payload;

  // Check if pasien exists
  const existing = await prisma.pasien.findUnique({
    where: { pasien_id: id },
  });

  if (!existing) {
    throw new Error("Pasien tidak ditemukan");
  }

  // Security Check: Only allow access if in the same village (for Bidan Desa/Praktik)
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (existing.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk mengubah data pasien desa lain",
      );
    }
  }

  const data = await prisma.pasien.update({
    where: { pasien_id: id },
    data: {
      ...(nama && { nama }),
      ...(alamat_lengkap && { alamat_lengkap }),
      ...(tanggal_lahir && { tanggal_lahir: new Date(tanggal_lahir) }),
    },
  });

  return data;
};

/**
 * Delete pasien
 */
export const deletePasien = async (id, user) => {
  // Check if pasien exists
  const existing = await prisma.pasien.findUnique({
    where: { pasien_id: id },
    include: {
      pemeriksaan_kehamilan: true,
      persalinan: true,
      keluarga_berencana: true,
      imunisasi: true,
    },
  });

  if (!existing) {
    throw new Error("Pasien tidak ditemukan");
  }

  // Security Check: Only allow access if in the same village (for Bidan Desa/Praktik)
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (existing.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk menghapus data pasien desa lain",
      );
    }
  }

  // Check if pasien has related data
  const hasRelatedData =
    existing.pemeriksaan_kehamilan.length > 0 ||
    existing.persalinan.length > 0 ||
    existing.keluarga_berencana.length > 0 ||
    existing.imunisasi.length > 0;

  if (hasRelatedData) {
    throw new Error(
      "Tidak dapat menghapus pasien yang memiliki data pemeriksaan",
    );
  }

  await prisma.pasien.delete({
    where: { pasien_id: id },
  });

  return { message: "Pasien berhasil dihapus" };
};
