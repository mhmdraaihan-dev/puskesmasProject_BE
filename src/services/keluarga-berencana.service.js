import prisma from "../../lib/prisma.js";

/**
 * Get all keluarga berencana with filtering and pagination
 */
export const getAllKeluargaBerencana = async (filters = {}, user) => {
  const {
    page = 1,
    limit = 10,
    practice_id,
    pasien_id,
    tanggal_start,
    tanggal_end,
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

  // Filter by pasien_id
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
    where.tanggal_kunjungan = {
      gte: startDate,
      lte: endDate,
    };
  } else if (tanggal_start || tanggal_end) {
    // Filter by date range
    where.tanggal_kunjungan = {};
    if (tanggal_start) {
      where.tanggal_kunjungan.gte = new Date(tanggal_start);
    }
    if (tanggal_end) {
      where.tanggal_kunjungan.lte = new Date(tanggal_end);
    }
  }

  // Search by nama pasien or NIK
  if (search) {
    where.pasien = {
      OR: [
        { nama: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.keluarga_berencana.findMany({
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
        tanggal_kunjungan: "desc",
      },
    }),
    prisma.keluarga_berencana.count({ where }),
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
 * Get keluarga berencana by ID
 */
export const getKeluargaBerencanaById = async (id, user) => {
  const data = await prisma.keluarga_berencana.findUnique({
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
    throw new Error("Data keluarga berencana tidak ditemukan");
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
      throw new Error(
        "Anda tidak memiliki akses ke data keluarga berencana desa lain",
      );
    }
  }

  return data;
};

/**
 * Create new keluarga berencana
 */
export const createKeluargaBerencana = async (payload, user) => {
  const {
    practice_id,
    pasien_id,
    tanggal_kunjungan,
    jumlah_anak_laki,
    jumlah_anak_perempuan,
    at,
    alat_kontrasepsi,
    keterangan,
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

  // Validate pasien exists
  const pasien = await prisma.pasien.findUnique({
    where: { pasien_id },
  });

  if (!pasien) {
    throw new Error("Pasien tidak ditemukan");
  }

  // Create keluarga berencana
  const data = await prisma.keluarga_berencana.create({
    data: {
      practice_id,
      pasien_id,
      tanggal_kunjungan: tanggal_kunjungan
        ? new Date(tanggal_kunjungan)
        : new Date(),
      jumlah_anak_laki: parseInt(jumlah_anak_laki) || 0,
      jumlah_anak_perempuan: parseInt(jumlah_anak_perempuan) || 0,
      at: at || false,
      alat_kontrasepsi,
      keterangan,
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
 * Update keluarga berencana
 */
export const updateKeluargaBerencana = async (id, payload, user) => {
  const {
    tanggal_kunjungan,
    jumlah_anak_laki,
    jumlah_anak_perempuan,
    at,
    alat_kontrasepsi,
    keterangan,
  } = payload;

  const userId = user.user_id;

  // Check if data exists
  const existing = await prisma.keluarga_berencana.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data keluarga berencana tidak ditemukan");
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

  // Update keluarga berencana
  const data = await prisma.keluarga_berencana.update({
    where: { id },
    data: {
      ...(tanggal_kunjungan && {
        tanggal_kunjungan: new Date(tanggal_kunjungan),
      }),
      ...(jumlah_anak_laki !== undefined && {
        jumlah_anak_laki: parseInt(jumlah_anak_laki),
      }),
      ...(jumlah_anak_perempuan !== undefined && {
        jumlah_anak_perempuan: parseInt(jumlah_anak_perempuan),
      }),
      ...(at !== undefined && { at }),
      ...(alat_kontrasepsi && { alat_kontrasepsi }),
      ...(keterangan !== undefined && { keterangan }),
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
 * Delete keluarga berencana
 */
export const deleteKeluargaBerencana = async (id, user) => {
  // Check if data exists
  const existing = await prisma.keluarga_berencana.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data keluarga berencana tidak ditemukan");
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

  await prisma.keluarga_berencana.delete({
    where: { id },
  });

  return { message: "Data keluarga berencana berhasil dihapus" };
};

/**
 * Verify Keluarga Berencana (Approve/Reject)
 */
export const verifyKeluargaBerencana = async (id, payload, verifierUser) => {
  const { status, alasan } = payload; // status: 'APPROVED' | 'REJECTED'
  const verifierId = verifierUser.user_id;

  const existing = await prisma.keluarga_berencana.findUnique({
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

  const data = await prisma.keluarga_berencana.update({
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
