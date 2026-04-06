import prisma from "../../lib/prisma.js";

/**
 * Get aggregated pending tasks for verification
 * Used by: Bidan Desa & Bidan Koordinator
 */
export const getPendingTasks = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { village: true },
  });

  if (!user) throw new Error("User not found");

  const { position_user, village_id } = user;

  // Validasi Role
  if (position_user !== "bidan_desa" && position_user !== "bidan_koordinator") {
    throw new Error(
      "Unauthorized: Only Bidan Desa/Koordinator can view pending tasks",
    );
  }

  // Filter Logic
  let villageFilter = {};
  if (position_user === "bidan_desa") {
    if (!village_id) {
      return []; // Unassigned Bidan Desa has no tasks
    }
    villageFilter = {
      practice_place: {
        village_id: village_id,
      },
    };
  }

  const commonSelect = {
    include: {
      pasien: {
        select: {
          nama: true,
          nik: true,
        },
      },
      practice_place: {
        include: {
          village: true,
        },
      },
      creator: {
        select: { full_name: true },
      },
    },
  };

  const [pendingKehamilan, pendingPersalinan, pendingKB, pendingImunisasi] =
    await Promise.all([
      prisma.pemeriksaan_kehamilan.findMany({
        where: { status_verifikasi: "PENDING", ...villageFilter },
        ...commonSelect,
        orderBy: { created_at: "desc" },
      }),
      prisma.persalinan.findMany({
        where: { status_verifikasi: "PENDING", ...villageFilter },
        ...commonSelect,
        orderBy: { created_at: "desc" },
      }),
      prisma.keluarga_berencana.findMany({
        where: { status_verifikasi: "PENDING", ...villageFilter },
        ...commonSelect,
        orderBy: { created_at: "desc" },
      }),
      prisma.imunisasi.findMany({
        where: { status_verifikasi: "PENDING", ...villageFilter },
        ...commonSelect,
        orderBy: { created_at: "desc" },
      }),
    ]);

  const formatTask = (item, type) => ({
    id: item.id,
    type: type,
    tanggal: item.created_at,
    pasien_nama: item.pasien.nama,
    pasien_nik: item.pasien.nik,
    bidan_praktik: item.creator.full_name,
    lokasi_desa: item.practice_place?.village?.nama_desa || "-",
    status: "PENDING",
  });

  const tasks = [
    ...pendingKehamilan.map((i) => formatTask(i, "KEHAMILAN")),
    ...pendingPersalinan.map((i) => formatTask(i, "PERSALINAN")),
    ...pendingKB.map((i) => formatTask(i, "KB")),
    ...pendingImunisasi.map((i) => formatTask(i, "IMUNISASI")),
  ];

  return tasks.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
};

/**
 * Get aggregated statistics for dashboard charts/cards
 */
export const getDashboardStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { village: true },
  });

  if (!user) throw new Error("User not found");

  const { position_user, village_id } = user;

  let whereClause = {};

  if (position_user === "bidan_praktik") {
    const practicePlace = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { practice_place: { select: { practice_id: true } } },
    });
    if (practicePlace?.practice_place) {
      whereClause.practice_id = practicePlace.practice_place.practice_id;
    }
  } else if (position_user === "bidan_desa") {
    if (village_id) {
      whereClause.practice_place = {
        village_id: village_id,
      };
    }
  }

  const totalPasien = await prisma.pasien.count();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const stats = await prisma.$transaction([
    prisma.pemeriksaan_kehamilan.count({
      where: { ...whereClause, status_verifikasi: "APPROVED" },
    }),
    prisma.pemeriksaan_kehamilan.count({
      where: {
        ...whereClause,
        status_verifikasi: "APPROVED",
        created_at: { gte: startOfMonth },
      },
    }),
    prisma.persalinan.count({
      where: { ...whereClause, status_verifikasi: "APPROVED" },
    }),
    prisma.persalinan.count({
      where: {
        ...whereClause,
        status_verifikasi: "APPROVED",
        created_at: { gte: startOfMonth },
      },
    }),
    prisma.keluarga_berencana.count({
      where: { ...whereClause, status_verifikasi: "APPROVED" },
    }),
    prisma.keluarga_berencana.count({
      where: {
        ...whereClause,
        status_verifikasi: "APPROVED",
        created_at: { gte: startOfMonth },
      },
    }),
    prisma.imunisasi.count({
      where: { ...whereClause, status_verifikasi: "APPROVED" },
    }),
    prisma.imunisasi.count({
      where: {
        ...whereClause,
        status_verifikasi: "APPROVED",
        created_at: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    total_pasien: totalPasien,
    kehamilan: { total: stats[0], bulan_ini: stats[1] },
    persalinan: { total: stats[2], bulan_ini: stats[3] },
    kb: { total: stats[4], bulan_ini: stats[5] },
    imunisasi: { total: stats[6], bulan_ini: stats[7] },
  };
};
