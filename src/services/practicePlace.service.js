import prisma from "../../lib/prisma.js";

const practicePlaceInclude = {
  village: true,
  users: {
    select: {
      user_id: true,
      full_name: true,
      email: true,
      position_user: true,
      status_user: true,
    },
    orderBy: {
      full_name: "asc",
    },
  },
  _count: {
    select: {
      health_data: true,
      users: true,
    },
  },
};

const normalizeAssignedUserIds = (practicePlaceData) => {
  const { user_id, user_ids } = practicePlaceData;

  if (Array.isArray(user_ids)) {
    return [...new Set(user_ids.filter(Boolean))];
  }

  if (user_id) {
    return [user_id];
  }

  return [];
};

const validateAssignedUsers = async (userIds, practiceId = null) => {
  if (userIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      user_id: { in: userIds },
    },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      position_user: true,
      practice_id: true,
    },
  });

  if (users.length !== userIds.length) {
    throw new Error("Sebagian user bidan praktik tidak ditemukan");
  }

  const nonBidanPraktik = users.find(
    (user) => user.position_user !== "bidan_praktik",
  );
  if (nonBidanPraktik) {
    throw new Error("Semua user yang di-assign harus memiliki posisi bidan_praktik");
  }

  const assignedToOtherPractice = users.find(
    (user) => user.practice_id && user.practice_id !== practiceId,
  );
  if (assignedToOtherPractice) {
    throw new Error(
      `User ${assignedToOtherPractice.full_name} sudah terhubung ke tempat praktik lain`,
    );
  }

  return users;
};

export const createPracticePlaceService = async (practicePlaceData) => {
  const { nama_praktik, village_id, alamat } = practicePlaceData;
  const assignedUserIds = normalizeAssignedUserIds(practicePlaceData);

  if (!nama_praktik || !village_id || !alamat) {
    throw new Error("Nama praktik, village_id, dan alamat wajib diisi");
  }

  const village = await prisma.village.findUnique({
    where: { village_id },
  });

  if (!village) {
    throw new Error("Desa tidak ditemukan");
  }

  await validateAssignedUsers(assignedUserIds);

  const newPracticePlace = await prisma.$transaction(async (tx) => {
    const created = await tx.practice_place.create({
      data: {
        nama_praktik,
        village_id,
        alamat,
      },
    });

    if (assignedUserIds.length > 0) {
      await tx.user.updateMany({
        where: {
          user_id: { in: assignedUserIds },
        },
        data: {
          practice_id: created.practice_id,
        },
      });
    }

    return tx.practice_place.findUnique({
      where: { practice_id: created.practice_id },
      include: practicePlaceInclude,
    });
  });

  return newPracticePlace;
};

export const getAllPracticePlacesService = async (filters = {}) => {
  const where = {};

  if (filters.village_id) {
    where.village_id = filters.village_id;
  }

  return prisma.practice_place.findMany({
    where,
    include: practicePlaceInclude,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getPracticePlacesByVillageService = async (village_id) => {
  const village = await prisma.village.findUnique({
    where: { village_id },
  });

  if (!village) {
    throw new Error("Desa tidak ditemukan");
  }

  return prisma.practice_place.findMany({
    where: { village_id },
    include: practicePlaceInclude,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getPracticePlaceByIdService = async (practice_id) => {
  const practicePlace = await prisma.practice_place.findUnique({
    where: { practice_id },
    include: {
      village: true,
      users: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          position_user: true,
          status_user: true,
        },
        orderBy: {
          full_name: "asc",
        },
      },
      health_data: {
        take: 10,
        orderBy: {
          created_at: "desc",
        },
        select: {
          data_id: true,
          nama_pasien: true,
          jenis_data: true,
          tanggal_periksa: true,
          status_verifikasi: true,
        },
      },
      _count: {
        select: {
          health_data: true,
          users: true,
        },
      },
    },
  });

  if (!practicePlace) {
    throw new Error("Tempat praktik tidak ditemukan");
  }

  return practicePlace;
};

export const updatePracticePlaceService = async (
  practice_id,
  practicePlaceData,
) => {
  const { nama_praktik, village_id, alamat } = practicePlaceData;
  const shouldSyncUsers =
    Object.prototype.hasOwnProperty.call(practicePlaceData, "user_ids") ||
    Object.prototype.hasOwnProperty.call(practicePlaceData, "user_id");
  const assignedUserIds = normalizeAssignedUserIds(practicePlaceData);

  const existingPractice = await prisma.practice_place.findUnique({
    where: { practice_id },
    include: {
      users: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!existingPractice) {
    throw new Error("Tempat praktik tidak ditemukan");
  }

  if (!nama_praktik || !village_id || !alamat) {
    throw new Error("Nama praktik, village_id, dan alamat wajib diisi");
  }

  if (village_id !== existingPractice.village_id) {
    const village = await prisma.village.findUnique({
      where: { village_id },
    });

    if (!village) {
      throw new Error("Desa tidak ditemukan");
    }
  }

  if (shouldSyncUsers) {
    await validateAssignedUsers(assignedUserIds, practice_id);
  }

  const updatedPracticePlace = await prisma.$transaction(async (tx) => {
    await tx.practice_place.update({
      where: { practice_id },
      data: {
        nama_praktik,
        village_id,
        alamat,
      },
    });

    if (shouldSyncUsers) {
      await tx.user.updateMany({
        where: {
          practice_id,
          position_user: "bidan_praktik",
        },
        data: {
          practice_id: null,
        },
      });

      if (assignedUserIds.length > 0) {
        await tx.user.updateMany({
          where: {
            user_id: { in: assignedUserIds },
          },
          data: {
            practice_id,
          },
        });
      }
    }

    return tx.practice_place.findUnique({
      where: { practice_id },
      include: practicePlaceInclude,
    });
  });

  return updatedPracticePlace;
};

export const deletePracticePlaceService = async (practice_id) => {
  const existingPractice = await prisma.practice_place.findUnique({
    where: { practice_id },
    include: {
      _count: {
        select: {
          health_data: true,
          users: true,
        },
      },
    },
  });

  if (!existingPractice) {
    throw new Error("Tempat praktik tidak ditemukan");
  }

  if (existingPractice._count.health_data > 0) {
    throw new Error(
      "Tidak bisa menghapus tempat praktik yang masih memiliki data kesehatan",
    );
  }

  await prisma.practice_place.delete({
    where: { practice_id },
  });

  return { message: "Tempat praktik berhasil dihapus" };
};
