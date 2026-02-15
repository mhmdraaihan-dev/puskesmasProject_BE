import prisma from "../../lib/prisma.js";

/**
 * Get all imunisasi with filtering and pagination
 */
export const getAllImunisasi = async (filters = {}, user) => {
  const {
    page = 1,
    limit = 10,
    practice_id,
    pasien_id,
    tanggal_start,
    tanggal_end,
    jenis_imunisasi,
    search,
    village_id,
    status_verifikasi,
    month,
    year,
  } = filters;

  const skip = (page - 1) * limit;
  const where = {};

  // Logic Filtering per Desa
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

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

    where.practice_place = {
      village_id: userVillageId,
    };
  } else {
    // Untuk Admin & Bidan Koordinator, filter by village_id
    if (filters.village_id) {
      where.practice_place = {
        village_id: filters.village_id,
      };
    }
  }

  // Filter by status_verifikasi
  if (status_verifikasi) {
    where.status_verifikasi = status_verifikasi;
  }

  // Filter by practice_id
  if (practice_id) {
    where.practice_id = practice_id;
  }

  // Filter by pasien_id (ID Bayi)
  if (pasien_id) {
    where.pasien_id = pasien_id;
  }

  // Filter by month & year (Rekapitulasi)
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(
      parseInt(year),
      parseInt(month),
      0,
      23,
      59,
      59,
      999,
    );
    where.tgl_imunisasi = {
      gte: startDate,
      lte: endDate,
    };
  } else if (tanggal_start || tanggal_end) {
    // Filter by date range
    where.tgl_imunisasi = {};
    if (tanggal_start) {
      where.tgl_imunisasi.gte = new Date(tanggal_start);
    }
    if (tanggal_end) {
      where.tgl_imunisasi.lte = new Date(tanggal_end);
    }
  }

  // Filter by jenis_imunisasi
  if (jenis_imunisasi) {
    where.jenis_imunisasi = jenis_imunisasi;
  }

  // Search by nama bayi/pasien or NIK or orang tua
  if (search) {
    where.OR = [
      {
        pasien: {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { nik: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      { nama_orangtua: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.imunisasi.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        pasien: {
          select: {
            pasien_id: true,
            nik: true,
            nama: true,
            alamat_lengkap: true,
            tanggal_lahir: true,
          },
        },
        practice_place: {
          select: {
            practice_id: true,
            nama_praktik: true,
            alamat: true,
            village_id: true,
            village: true,
          },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        tgl_imunisasi: "desc",
      },
    }),
    prisma.imunisasi.count({ where }),
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
 * Get imunisasi by ID
 */
export const getImunisasiById = async (id, user) => {
  const data = await prisma.imunisasi.findUnique({
    where: { id },
    include: {
      pasien: true,
      practice_place: {
        include: {
          village: true,
        },
      },
      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      updater: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  if (!data) {
    throw new Error("Data imunisasi tidak ditemukan");
  }

  // Security Check: Village access
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

    if (data.practice_place.village_id !== userVillageId) {
      throw new Error("Anda tidak memiliki akses ke data imunisasi desa lain");
    }
  }

  return data;
};

/**
 * Create new imunisasi
 */
export const createImunisasi = async (payload, user) => {
  const {
    practice_id,
    pasien_id,
    tgl_imunisasi,
    berat_badan,
    suhu_badan,
    nama_orangtua,
    jenis_imunisasi,
    catatan,
  } = payload;

  const userId = user.user_id;

  // Validate practice_place exists and check access
  const practicePlace = await prisma.practice_place.findUnique({
    where: { practice_id },
  });

  if (!practicePlace) {
    throw new Error("Practice place tidak ditemukan");
  }

  // Security Check: Village access
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (practicePlace.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk menambah data ke lokasi desa lain",
      );
    }
  }

  // Validate pasien exists (Bayi)
  const pasien = await prisma.pasien.findUnique({
    where: { pasien_id },
  });

  if (!pasien) {
    throw new Error("Pasien (Bayi) tidak ditemukan");
  }

  // Create imunisasi
  const data = await prisma.imunisasi.create({
    data: {
      practice_id,
      pasien_id,
      tgl_imunisasi: tgl_imunisasi ? new Date(tgl_imunisasi) : new Date(),
      berat_badan: parseFloat(berat_badan),
      suhu_badan: suhu_badan ? parseFloat(suhu_badan) : null,
      nama_orangtua,
      jenis_imunisasi,
      catatan,
      created_by: userId,
    },
    include: {
      pasien: true,
      practice_place: true,
      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return data;
};

/**
 * Update imunisasi
 */
export const updateImunisasi = async (id, payload, user) => {
  const {
    tgl_imunisasi,
    berat_badan,
    suhu_badan,
    nama_orangtua,
    jenis_imunisasi,
    catatan,
  } = payload;

  const userId = user.user_id;

  // Check if data exists
  const existing = await prisma.imunisasi.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data imunisasi tidak ditemukan");
  }

  // Security Check: Village access
  if (user.role !== "ADMIN" && user.position_user !== "bidan_koordinator") {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (existing.practice_place.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk mengubah data desa lain",
      );
    }
  }

  // VALIDASI STATUS: Hanya boleh edit jika REJECTED
  if (existing.status_verifikasi === "APPROVED") {
    throw new Error("Data sudah APPROVED dan terkunci.");
  }
  if (existing.status_verifikasi === "PENDING") {
    throw new Error("Data sedang PENDING verifikasi dan terkunci.");
  }

  // Update imunisasi
  const data = await prisma.imunisasi.update({
    where: { id },
    data: {
      ...(tgl_imunisasi && { tgl_imunisasi: new Date(tgl_imunisasi) }),
      ...(berat_badan !== undefined && {
        berat_badan: parseFloat(berat_badan),
      }),
      ...(suhu_badan !== undefined && {
        suhu_badan: suhu_badan ? parseFloat(suhu_badan) : null,
      }),
      ...(nama_orangtua && { nama_orangtua }),
      ...(jenis_imunisasi && { jenis_imunisasi }),
      ...(catatan !== undefined && { catatan }),
      updated_by: userId,

      // Auto RESET status ke PENDING jika data diedit
      status_verifikasi: "PENDING",
      alasan_penolakan: null,
      diverifikasi_oleh: null,
      tanggal_verifikasi: null,
    },
    include: {
      pasien: true,
      practice_place: true,
      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      updater: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  return data;
};

/**
 * Delete imunisasi
 */
export const deleteImunisasi = async (id, user) => {
  // Check if data exists
  const existing = await prisma.imunisasi.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data imunisasi tidak ditemukan");
  }

  // Security Check: Village access
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

    if (existing.practice_place.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk menghapus data desa lain",
      );
    }
  }

  // VALIDASI: Data APPROVED tidak boleh dihapus
  if (existing.status_verifikasi === "APPROVED") {
    throw new Error("Data sudah APPROVED dan tidak dapat dihapus.");
  }

  await prisma.imunisasi.delete({
    where: { id },
  });

  return { message: "Data imunisasi berhasil dihapus" };
};

/**
 * Verify Imunisasi (Approve/Reject)
 */
export const verifyImunisasi = async (id, payload, verifierUser) => {
  const { status, alasan } = payload; // status: 'APPROVED' | 'REJECTED'
  const verifierId = verifierUser.user_id;

  const existing = await prisma.imunisasi.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data tidak ditemukan");
  }

  // Security Check: Village access
  if (
    verifierUser.role !== "ADMIN" &&
    verifierUser.position_user !== "bidan_koordinator"
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { user_id: verifierId },
      include: { practice_place: true },
    });

    const userVillageId =
      currentUser.village_id || currentUser.practice_place?.village_id;

    if (!userVillageId) {
      throw new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    }

    if (existing.practice_place.village_id !== userVillageId) {
      throw new Error(
        "Anda tidak memiliki akses untuk memverifikasi data desa lain",
      );
    }
  }

  if (existing.status_verifikasi === status) {
    throw new Error(`Data sudah berstatus ${status}`);
  }

  if (status === "REJECTED" && !alasan) {
    throw new Error("Alasan penolakan wajib diisi untuk status REJECTED");
  }

  const data = await prisma.imunisasi.update({
    where: { id },
    data: {
      status_verifikasi: status,
      alasan_penolakan: status === "REJECTED" ? alasan : null,
      diverifikasi_oleh: verifierId,
      tanggal_verifikasi: new Date(),
    },
    include: {
      verifier: {
        select: {
          user_id: true,
          full_name: true,
          position_user: true,
        },
      },
    },
  });

  return data;
};
