import prisma from "../../lib/prisma.js";

const PELAYANAN_APPROVED_HISTORY = ["APPROVED", "REJECTED"];

export const getPelayananUserScope = async (user) => {
  const currentUser = await prisma.user.findUnique({
    where: { user_id: user.user_id },
    include: { practice_place: true },
  });

  if (!currentUser) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const villageId =
    currentUser.village_id || currentUser.practice_place?.village_id || null;

  return {
    currentUser,
    villageId,
    practiceId: currentUser.practice_place?.practice_id || null,
  };
};

export const applyPelayananRoleScope = (where, user, filters, scope = {}) => {
  if (user.role === "ADMIN") {
    if (filters.village_id) {
      where.practice_place = {
        village_id: filters.village_id,
      };
    }
    return;
  }

  if (user.position_user === "bidan_praktik") {
    where.practice_id = scope.practiceId;
    return;
  }

  if (user.position_user === "bidan_desa") {
    where.practice_place = {
      village_id: scope.villageId,
    };
    return;
  }

  if (user.position_user === "bidan_koordinator" && filters.village_id) {
    where.practice_place = {
      village_id: filters.village_id,
    };
  }
};

export const applyPelayananStatusFilter = (where, statusVerifikasi, user) => {
  if (statusVerifikasi) {
    if (
      user.position_user === "bidan_koordinator" &&
      statusVerifikasi !== "APPROVED"
    ) {
      const error = new Error(
        "Bidan koordinator hanya dapat melihat data yang sudah APPROVED",
      );
      error.statusCode = 403;
      throw error;
    }

    where.status_verifikasi = statusVerifikasi;
    return;
  }

  if (user.role === "ADMIN" || user.position_user === "bidan_praktik") {
    return;
  }

  if (user.position_user === "bidan_desa") {
    where.status_verifikasi = {
      in: PELAYANAN_APPROVED_HISTORY,
    };
    return;
  }

  if (user.position_user === "bidan_koordinator") {
    where.status_verifikasi = "APPROVED";
  }
};

export const ensurePelayananDetailAccess = async (
  user,
  practicePlace,
  statusVerifikasi,
  forbiddenMessage,
) => {
  if (user.role === "ADMIN") {
    return;
  }

  if (user.position_user === "bidan_praktik") {
    const { practiceId } = await getPelayananUserScope(user);

    if (!practiceId) {
      const error = new Error(
        "Anda belum ditugaskan ke Desa/Tempat Praktik manapun",
      );
      error.statusCode = 403;
      throw error;
    }

    if (practicePlace.practice_id !== practiceId) {
      const error = new Error(forbiddenMessage);
      error.statusCode = 403;
      throw error;
    }
    return;
  }

  if (user.position_user === "bidan_koordinator") {
    if (statusVerifikasi !== "APPROVED") {
      const error = new Error(
        "Bidan koordinator hanya dapat melihat data yang sudah APPROVED",
      );
      error.statusCode = 403;
      throw error;
    }
    return;
  }

  const { villageId } = await getPelayananUserScope(user);

  if (!villageId) {
    const error = new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    error.statusCode = 403;
    throw error;
  }

  if (practicePlace.village_id !== villageId) {
    const error = new Error(forbiddenMessage);
    error.statusCode = 403;
    throw error;
  }
};

export const ensurePelayananPracticeMutationAccess = async (
  user,
  practiceId,
  forbiddenMessage,
) => {
  const scope = await getPelayananUserScope(user);

  if (!scope.practiceId) {
    const error = new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    error.statusCode = 403;
    throw error;
  }

  if (scope.practiceId !== practiceId) {
    const error = new Error(forbiddenMessage);
    error.statusCode = 403;
    throw error;
  }
};

export const ensurePelayananVerificationAccess = async (
  verifierUser,
  practicePlace,
) => {
  if (verifierUser.position_user !== "bidan_desa") {
    const error = new Error("Hanya bidan desa yang dapat memverifikasi data");
    error.statusCode = 403;
    throw error;
  }

  const { villageId } = await getPelayananUserScope(verifierUser);

  if (!villageId) {
    const error = new Error("Anda belum ditugaskan ke Desa/Tempat Praktik manapun");
    error.statusCode = 403;
    throw error;
  }

  if (practicePlace.village_id !== villageId) {
    const error = new Error(
      "Anda tidak memiliki akses untuk memverifikasi data desa lain",
    );
    error.statusCode = 403;
    throw error;
  }
};

export const getDashboardFeedItems = async ({
  villageId,
  statuses,
  module,
  limit,
}) => {
  const parsedLimit = Number.isFinite(Number(limit))
    ? parseInt(limit, 10)
    : 20;
  const take = Math.max(1, parsedLimit);
  const normalizedStatuses = Array.isArray(statuses) ? statuses : [statuses];
  const requestedModule = module ? module.toLowerCase() : null;
  const normalizedModule =
    requestedModule === "kb" ? "keluarga-berencana" : requestedModule;

  const buildWhere = () => {
    const where = {
      status_verifikasi:
        normalizedStatuses.length === 1
          ? normalizedStatuses[0]
          : { in: normalizedStatuses },
    };

    if (villageId) {
      where.practice_place = { village_id: villageId };
    }

    return where;
  };

  const commonInclude = {
    pasien: {
      select: {
        nama: true,
        nik: true,
      },
    },
    practice_place: {
      select: {
        nama_praktik: true,
        village: {
          select: {
            nama_desa: true,
          },
        },
      },
    },
    creator: {
      select: {
        full_name: true,
      },
    },
  };

  const moduleConfigs = [
    {
      key: "kehamilan",
      label: "KEHAMILAN",
      query: () =>
        prisma.pemeriksaan_kehamilan.findMany({
          where: buildWhere(),
          include: commonInclude,
          orderBy: { updated_at: "desc" },
          take,
        }),
    },
    {
      key: "persalinan",
      label: "PERSALINAN",
      query: () =>
        prisma.persalinan.findMany({
          where: buildWhere(),
          include: commonInclude,
          orderBy: { updated_at: "desc" },
          take,
        }),
    },
    {
      key: "keluarga-berencana",
      label: "KB",
      query: () =>
        prisma.keluarga_berencana.findMany({
          where: buildWhere(),
          include: commonInclude,
          orderBy: { updated_at: "desc" },
          take,
        }),
    },
    {
      key: "imunisasi",
      label: "IMUNISASI",
      query: () =>
        prisma.imunisasi.findMany({
          where: buildWhere(),
          include: commonInclude,
          orderBy: { updated_at: "desc" },
          take,
        }),
    },
  ];

  const selectedConfigs = normalizedModule
    ? moduleConfigs.filter((config) => config.key === normalizedModule)
    : moduleConfigs;

  const datasets = await Promise.all(
    selectedConfigs.map(async (config) => ({
      label: config.label,
      items: await config.query(),
    })),
  );

  const items = datasets.flatMap(({ label, items: rows }) =>
    rows.map((item) => ({
      id: item.id,
      type: label,
      module: label,
      status: item.status_verifikasi,
      tanggal: item.updated_at,
      pasien_nama: item.pasien.nama,
      pasien_nik: item.pasien.nik,
      bidan_praktik: item.creator?.full_name || "-",
      lokasi_desa: item.practice_place?.village?.nama_desa || "-",
      tempat_praktik: item.practice_place?.nama_praktik || "-",
    })),
  );

  return items
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, take);
};
