import prisma from "../../lib/prisma.js";
import {
  getDashboardFeedItems,
  getPelayananUserScope,
} from "./pelayanan-access.service.js";

const parseStatusQuery = (status, fallbackStatuses) => {
  if (!status) {
    return fallbackStatuses;
  }

  return status
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
};

const getDashboardUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { village: true, practice_place: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const getDistinctPasienCountByPractice = async (practiceId) => {
  if (!practiceId) {
    return 0;
  }

  const pasienIds = new Set();

  const [kehamilan, persalinan, kb, imunisasi] = await Promise.all([
    prisma.pemeriksaan_kehamilan.findMany({
      where: { practice_id: practiceId },
      select: { pasien_id: true },
    }),
    prisma.persalinan.findMany({
      where: { practice_id: practiceId },
      select: { pasien_id: true },
    }),
    prisma.keluarga_berencana.findMany({
      where: { practice_id: practiceId },
      select: { pasien_id: true },
    }),
    prisma.imunisasi.findMany({
      where: { practice_id: practiceId },
      select: { pasien_id: true },
    }),
  ]);

  [kehamilan, persalinan, kb, imunisasi].forEach((rows) => {
    rows.forEach((row) => pasienIds.add(row.pasien_id));
  });

  return pasienIds.size;
};

/**
 * Get aggregated pending tasks for verification.
 * Used by: Bidan Desa only.
 */
export const getPendingTasks = async (userId, filters = {}) => {
  const user = await getDashboardUser(userId);

  if (user.position_user !== "bidan_desa") {
    const error = new Error(
      "Unauthorized: Only Bidan Desa can view pending tasks",
    );
    error.statusCode = 403;
    throw error;
  }

  if (!user.village_id) {
    return [];
  }

  return getDashboardFeedItems({
    villageId: user.village_id,
    statuses: ["PENDING"],
    module: filters.module,
    limit: filters.limit,
  });
};

/**
 * Get village history feed for bidan desa.
 */
export const getBidanDesaHistory = async (userId, filters = {}) => {
  const user = await getDashboardUser(userId);

  if (user.position_user !== "bidan_desa") {
    const error = new Error("Unauthorized: Only Bidan Desa can view history");
    error.statusCode = 403;
    throw error;
  }

  if (!user.village_id) {
    return [];
  }

  return getDashboardFeedItems({
    villageId: user.village_id,
    statuses: parseStatusQuery(filters.status, ["APPROVED", "REJECTED"]),
    module: filters.module,
    limit: filters.limit,
  });
};

/**
 * Get approved feed for bidan koordinator.
 */
export const getKoordinatorApprovedFeed = async (userId, filters = {}) => {
  const user = await getDashboardUser(userId);

  if (user.position_user !== "bidan_koordinator") {
    const error = new Error(
      "Unauthorized: Only Bidan Koordinator can view approved feed",
    );
    error.statusCode = 403;
    throw error;
  }

  return getDashboardFeedItems({
    villageId: filters.village_id || null,
    statuses: ["APPROVED"],
    module: filters.module,
    limit: filters.limit,
  });
};

/**
 * Get aggregated statistics for dashboard charts/cards.
 */
export const getDashboardStats = async (userId) => {
  const user = await getDashboardUser(userId);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let whereClause = {};
  let totalPasien = await prisma.pasien.count();

  if (user.position_user === "bidan_praktik") {
    const { practiceId } = await getPelayananUserScope(user);

    if (practiceId) {
      whereClause.practice_id = practiceId;
      totalPasien = await getDistinctPasienCountByPractice(practiceId);
    } else {
      totalPasien = 0;
    }
  } else if (user.position_user === "bidan_desa") {
    if (user.village_id) {
      whereClause.practice_place = {
        village_id: user.village_id,
      };
      totalPasien = await prisma.pasien.count({
        where: { village_id: user.village_id },
      });
    } else {
      totalPasien = 0;
    }
  }

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
