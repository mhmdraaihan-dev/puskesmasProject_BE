import prisma from "../../lib/prisma.js";

const getPracticeScopedPatientFilter = (practiceId) => ({
  OR: [
    { practice_id: practiceId },
    { pemeriksaan_kehamilan: { some: { practice_id: practiceId } } },
    { persalinan: { some: { practice_id: practiceId } } },
    { keluarga_berencana: { some: { practice_id: practiceId } } },
    { imunisasi: { some: { practice_id: practiceId } } },
  ],
});

const getCurrentUserScope = async (user) => {
  const currentUser = await prisma.user.findUnique({
    where: { user_id: user.user_id },
    include: {
      practice_place: true,
    },
  });

  if (!currentUser) {
    throw new Error("User tidak ditemukan");
  }

  return {
    currentUser,
    villageId: currentUser.village_id || currentUser.practice_place?.village_id,
    practiceId: currentUser.practice_place?.practice_id || null,
  };
};

const getPasienScopeFilter = async (user) => {
  if (user.role === "ADMIN" || user.position_user === "bidan_koordinator") {
    return null;
  }

  const scope = await getCurrentUserScope(user);

  if (user.position_user === "bidan_praktik") {
    if (!scope.practiceId) {
      return { denyAll: true };
    }

    return { filter: getPracticeScopedPatientFilter(scope.practiceId) };
  }

  if (!scope.villageId) {
    return { denyAll: true };
  }

  return {
    filter: {
      village_id: scope.villageId,
    },
  };
};

const ensurePasienAccess = async (pasienId, user, forbiddenMessage) => {
  const scopedFilter = await getPasienScopeFilter(user);

  if (!scopedFilter) {
    return;
  }

  if (scopedFilter.denyAll) {
    throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
  }

  const accessiblePasien = await prisma.pasien.findFirst({
    where: {
      pasien_id: pasienId,
      ...scopedFilter.filter,
    },
    select: {
      pasien_id: true,
    },
  });

  if (!accessiblePasien) {
    throw new Error(forbiddenMessage);
  }
};

/**
 * Get all pasien with filtering and pagination
 */
export const getAllPasien = async (filters = {}, user) => {
  const { page = 1, limit = 10, search } = filters;

  const skip = (page - 1) * limit;
  const conditions = [];

  const scopedFilter = await getPasienScopeFilter(user);
  if (scopedFilter?.denyAll) {
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

  if (scopedFilter?.filter) {
    conditions.push(scopedFilter.filter);
  }

  // Search by nama or NIK
  if (search) {
    conditions.push({
      OR: [
      { nama: { contains: search, mode: "insensitive" } },
      { nik: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [data, total] = await Promise.all([
    prisma.pasien.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        village: true,
        practice_place: true,
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

  await ensurePasienAccess(
    id,
    user,
    "Anda tidak memiliki akses ke data pasien ini",
  );

  return data;
};

/**
 * Create new pasien
 */
export const createPasien = async (payload, user) => {
  const { nik, nama, alamat_lengkap, tanggal_lahir, village_id } = payload;
  let practiceId = payload.practice_id || null;
  let normalizedVillageId = village_id;

  if (user?.position_user === "bidan_praktik") {
    const scope = await getCurrentUserScope(user);

    if (!scope.practiceId) {
      throw new Error("Bidan praktik belum memiliki tempat praktik");
    }

    practiceId = scope.practiceId;
    normalizedVillageId = scope.villageId || village_id;
  }

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
      village_id: normalizedVillageId,
      practice_id: practiceId,
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

  await ensurePasienAccess(
    id,
    user,
    "Anda tidak memiliki akses untuk mengubah data pasien ini",
  );

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

  await ensurePasienAccess(
    id,
    user,
    "Anda tidak memiliki akses untuk menghapus data pasien ini",
  );

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
