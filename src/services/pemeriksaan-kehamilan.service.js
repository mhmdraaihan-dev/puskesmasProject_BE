import prisma from "../../lib/prisma.js";

/**
 * Get all pemeriksaan kehamilan with filtering and pagination
 */
export const getAllPemeriksaanKehamilan = async (filters = {}, user) => {
  const {
    page = 1,
    limit = 10,
    practice_id,
    pasien_id,
    tanggal_start,
    tanggal_end,
    resti,
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
    // Untuk Admin & Bidan Koordinator, filter by village_id (jika ada input dari FE)
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

  // Filter by practice_id (untuk bidan praktik hanya lihat data mereka sendiri)
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
    where.tanggal = {
      gte: startDate,
      lte: endDate,
    };
  } else if (tanggal_start || tanggal_end) {
    // Filter by date range
    where.tanggal = {};
    if (tanggal_start) {
      where.tanggal.gte = new Date(tanggal_start);
    }
    if (tanggal_end) {
      where.tanggal.lte = new Date(tanggal_end);
    }
  }

  // Filter by resti (resiko tinggi)
  if (resti) {
    where.resti = resti;
  }

  // Search by nama pasien or NIK
  if (search) {
    where.pasien = {
      ...where.pasien,
      OR: [
        { nama: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.pemeriksaan_kehamilan.findMany({
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
          },
        },
        ceklab_report: true,
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
        tanggal: "desc",
      },
    }),
    prisma.pemeriksaan_kehamilan.count({ where }),
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
 * Get pemeriksaan kehamilan by ID
 */
export const getPemeriksaanKehamilanById = async (id, user) => {
  const data = await prisma.pemeriksaan_kehamilan.findUnique({
    where: { id },
    include: {
      pasien: true,
      practice_place: {
        include: {
          village: true,
        },
      },
      ceklab_report: true,
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
    throw new Error("Data pemeriksaan kehamilan tidak ditemukan");
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
        "Anda tidak memiliki akses ke data pemeriksaan desa lain",
      );
    }
  }

  return data;
};

/**
 * Create new pemeriksaan kehamilan
 */
export const createPemeriksaanKehamilan = async (payload, user) => {
  const {
    practice_id,
    pasien_id,
    tanggal,
    gpa,
    umur_kehamilan,
    status_tt,
    jenis_kunjungan,
    td,
    lila,
    bb,
    resti,
    catatan,
    ceklab_report,
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

  // Create pemeriksaan kehamilan with optional ceklab_report
  const data = await prisma.pemeriksaan_kehamilan.create({
    data: {
      practice_id,
      pasien_id,
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      gpa,
      umur_kehamilan: parseInt(umur_kehamilan),
      status_tt,
      jenis_kunjungan,
      td,
      lila: lila ? parseFloat(lila) : null,
      bb: bb ? parseFloat(bb) : null,
      resti,
      catatan,
      created_by: userId,
      ...(ceklab_report && {
        ceklab_report: {
          create: {
            hiv: ceklab_report.hiv || false,
            hbsag: ceklab_report.hbsag || false,
            sifilis: ceklab_report.sifilis || false,
            hb: ceklab_report.hb ? parseFloat(ceklab_report.hb) : null,
            golongan_darah: ceklab_report.golongan_darah || null,
          },
        },
      }),
    },
    include: {
      pasien: true,
      practice_place: true,
      ceklab_report: true,
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
 * Update pemeriksaan kehamilan
 */
export const updatePemeriksaanKehamilan = async (id, payload, user) => {
  const {
    tanggal,
    gpa,
    umur_kehamilan,
    status_tt,
    jenis_kunjungan,
    td,
    lila,
    bb,
    resti,
    catatan,
    ceklab_report,
  } = payload;

  const userId = user.user_id;

  // Check if data exists
  const existing = await prisma.pemeriksaan_kehamilan.findUnique({
    where: { id },
    include: {
      ceklab_report: true,
      practice_place: true,
    },
  });

  if (!existing) {
    throw new Error("Data pemeriksaan kehamilan tidak ditemukan");
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

  // VALIDASI STATUS: Hanya boleh edit jika REJECTED (atau belum diverifikasi, tapi user bilang Pending tidak boleh edit)
  // Logic User: "data tidak bisa di edit lagi apabila dapat status pending dan approve, apabila di reject maka bisa di edit"
  if (existing.status_verifikasi === "APPROVED") {
    throw new Error("Data sudah APPROVED dan terkunci.");
  }
  if (existing.status_verifikasi === "PENDING") {
    throw new Error("Data sedang PENDING verifikasi dan terkunci.");
  }
  // Artinya jika REJECTED, boleh lanjut.

  const updateData = {
    ...(tanggal && { tanggal: new Date(tanggal) }),
    ...(gpa && { gpa }),
    ...(umur_kehamilan && { umur_kehamilan: parseInt(umur_kehamilan) }),
    ...(status_tt && { status_tt }),
    ...(jenis_kunjungan && { jenis_kunjungan }),
    ...(td && { td }),
    ...(lila !== undefined && { lila: lila ? parseFloat(lila) : null }),
    ...(bb !== undefined && { bb: bb ? parseFloat(bb) : null }),
    ...(resti && { resti }),
    ...(catatan !== undefined && { catatan }),
    updated_by: userId,

    // Auto RESET status ke PENDING jika data diedit (dari REJECTED -> PENDING)
    status_verifikasi: "PENDING",
    alasan_penolakan: null,
    diverifikasi_oleh: null,
    tanggal_verifikasi: null,
  };

  // Handle ceklab_report update/create
  if (ceklab_report) {
    if (existing.ceklab_report) {
      // Update existing ceklab_report
      updateData.ceklab_report = {
        update: {
          hiv:
            ceklab_report.hiv !== undefined
              ? ceklab_report.hiv
              : existing.ceklab_report.hiv,
          hbsag:
            ceklab_report.hbsag !== undefined
              ? ceklab_report.hbsag
              : existing.ceklab_report.hbsag,
          sifilis:
            ceklab_report.sifilis !== undefined
              ? ceklab_report.sifilis
              : existing.ceklab_report.sifilis,
          hb:
            ceklab_report.hb !== undefined
              ? ceklab_report.hb
                ? parseFloat(ceklab_report.hb)
                : null
              : existing.ceklab_report.hb,
          golongan_darah:
            ceklab_report.golongan_darah !== undefined
              ? ceklab_report.golongan_darah
              : existing.ceklab_report.golongan_darah,
        },
      };
    } else {
      // Create new ceklab_report
      updateData.ceklab_report = {
        create: {
          hiv: ceklab_report.hiv || false,
          hbsag: ceklab_report.hbsag || false,
          sifilis: ceklab_report.sifilis || false,
          hb: ceklab_report.hb ? parseFloat(ceklab_report.hb) : null,
          golongan_darah: ceklab_report.golongan_darah || null,
        },
      };
    }
  }

  const data = await prisma.pemeriksaan_kehamilan.update({
    where: { id },
    data: updateData,
    include: {
      pasien: true,
      practice_place: true,
      ceklab_report: true,
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
      verifier: {
        select: { user_id: true, full_name: true },
      },
    },
  });

  return data;
};

/**
 * Delete pemeriksaan kehamilan
 */
export const deletePemeriksaanKehamilan = async (id, user) => {
  // Check if data exists
  const existing = await prisma.pemeriksaan_kehamilan.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data pemeriksaan kehamilan tidak ditemukan");
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

  // Delete
  await prisma.pemeriksaan_kehamilan.delete({
    where: { id },
  });

  return { message: "Data pemeriksaan kehamilan berhasil dihapus" };
};

/**
 * Verify Pemeriksaan Kehamilan (Approve/Reject)
 */
export const verifyPemeriksaanKehamilan = async (id, payload, verifierUser) => {
  const { status, alasan } = payload; // status: 'APPROVED' | 'REJECTED'
  const verifierId = verifierUser.user_id;

  const existing = await prisma.pemeriksaan_kehamilan.findUnique({
    where: { id },
    include: { practice_place: true },
  });

  if (!existing) {
    throw new Error("Data pemeriksaan tidak ditemukan");
  }

  // Security Check: Village access for verification
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

  const data = await prisma.pemeriksaan_kehamilan.update({
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
