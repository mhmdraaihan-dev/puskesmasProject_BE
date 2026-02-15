import prisma from "../../lib/prisma.js";

// CREATE: Bidan Praktik membuat data kesehatan (status: PENDING)
export const createHealthDataService = async (healthDataInput, user_id) => {
  const { nama_pasien, umur_pasien, jenis_data, catatan, tanggal_periksa } =
    healthDataInput;

  // Validasi: Field wajib
  if (!nama_pasien || !jenis_data) {
    throw new Error("Nama pasien dan jenis data wajib diisi");
  }

  // Cek apakah user adalah bidan_praktik dan punya tempat praktik
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  if (user.position_user !== "bidan_praktik") {
    throw new Error("Hanya bidan praktik yang bisa membuat data kesehatan");
  }

  if (!user.practice_place) {
    throw new Error("Bidan praktik belum memiliki tempat praktik");
  }

  const newHealthData = await prisma.health_data.create({
    data: {
      practice_id: user.practice_place.practice_id,
      nama_pasien,
      umur_pasien,
      jenis_data,
      catatan,
      tanggal_periksa: tanggal_periksa ? new Date(tanggal_periksa) : new Date(),
    },
    include: {
      practice_place: {
        include: {
          village: true,
          user: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
        },
      },
    },
  });

  return newHealthData;
};

// READ: Get all health data (dengan filter berdasarkan role)
export const getAllHealthDataService = async (user_id, filters = {}) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  let whereClause = {};

  console.log("DEBUG getAllHealthDataService:", {
    user_id: user.user_id,
    position: user.position_user,
    hasPracticePlace: !!user.practice_place,
  });

  // Filter berdasarkan role
  if (user.role === "ADMIN") {
    // Admin bisa lihat semua data
    // Bisa filter berdasarkan status jika diperlukan
    if (filters.status_verifikasi) {
      whereClause.status_verifikasi = filters.status_verifikasi;
    }
  } else if (user.position_user === "bidan_praktik") {
    // Bidan praktik hanya lihat data dari tempat praktiknya sendiri
    if (!user.practice_place) {
      return [];
    }
    whereClause.practice_id = user.practice_place.practice_id;
  } else if (user.position_user === "bidan_desa") {
    // Bidan desa lihat semua data dari desanya
    if (!user.village_id) {
      throw new Error("Bidan desa belum di-assign ke desa");
    }
    whereClause.practice_place = {
      village_id: user.village_id,
    };
  } else if (user.position_user === "bidan_koordinator") {
    // Bidan koordinator lihat semua data (fokus yang APPROVED)
    if (filters.status_verifikasi) {
      whereClause.status_verifikasi = filters.status_verifikasi;
    } else {
      whereClause.status_verifikasi = "APPROVED"; // Default: hanya yang approved
    }
  } else {
    throw new Error("Role tidak memiliki akses ke data kesehatan");
  }

  // Tambahkan filter tambahan jika ada
  if (filters.jenis_data) {
    whereClause.jenis_data = filters.jenis_data;
  }

  const healthData = await prisma.health_data.findMany({
    where: whereClause,
    include: {
      practice_place: {
        include: {
          village: true,
          user: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
        },
      },
      verifier: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return healthData;
};

// READ: Get health data by ID
export const getHealthDataByIdService = async (data_id, user_id) => {
  const healthData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: {
        include: {
          village: true,
          user: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
        },
      },
      verifier: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  if (!healthData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi akses berdasarkan role
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (user.position_user === "bidan_praktik") {
    if (
      !user.practice_place ||
      healthData.practice_id !== user.practice_place.practice_id
    ) {
      throw new Error("Anda tidak memiliki akses ke data ini");
    }
  } else if (user.position_user === "bidan_desa") {
    if (
      !user.village_id ||
      healthData.practice_place.village_id !== user.village_id
    ) {
      throw new Error("Anda tidak memiliki akses ke data ini");
    }
  }
  // Bidan koordinator bisa akses semua

  return healthData;
};

// UPDATE: Edit data yang masih PENDING (Bidan Praktik)
export const updateHealthDataService = async (
  data_id,
  healthDataInput,
  user_id,
) => {
  const { nama_pasien, umur_pasien, jenis_data, catatan, tanggal_periksa } =
    healthDataInput;

  // Cek apakah data ada
  const existingData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: true,
    },
  });

  if (!existingData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi: Hanya bisa edit jika status PENDING
  if (existingData.status_verifikasi !== "PENDING") {
    throw new Error("Hanya data dengan status PENDING yang bisa diedit");
  }

  // Validasi: Hanya bidan praktik pemilik yang bisa edit
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (
    !user.practice_place ||
    existingData.practice_id !== user.practice_place.practice_id
  ) {
    throw new Error("Anda tidak memiliki akses untuk mengedit data ini");
  }

  const updatedData = await prisma.health_data.update({
    where: { data_id },
    data: {
      nama_pasien,
      umur_pasien,
      jenis_data,
      catatan,
      tanggal_periksa: tanggal_periksa
        ? new Date(tanggal_periksa)
        : existingData.tanggal_periksa,
    },
    include: {
      practice_place: {
        include: {
          village: true,
        },
      },
    },
  });

  return updatedData;
};

// REVISE: Revisi data yang REJECTED (Bidan Praktik)
export const reviseHealthDataService = async (
  data_id,
  healthDataInput,
  user_id,
) => {
  const { nama_pasien, umur_pasien, jenis_data, catatan, tanggal_periksa } =
    healthDataInput;

  // Cek apakah data ada
  const existingData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: true,
    },
  });

  if (!existingData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi: Hanya bisa revisi jika status REJECTED
  if (existingData.status_verifikasi !== "REJECTED") {
    throw new Error("Hanya data dengan status REJECTED yang bisa direvisi");
  }

  // Validasi: Hanya bidan praktik pemilik yang bisa revisi
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (
    !user.practice_place ||
    existingData.practice_id !== user.practice_place.practice_id
  ) {
    throw new Error("Anda tidak memiliki akses untuk merevisi data ini");
  }

  // Simpan alasan reject terakhir ke history
  const alasan_reject_terakhir = existingData.alasan_penolakan;

  const revisedData = await prisma.health_data.update({
    where: { data_id },
    data: {
      nama_pasien,
      umur_pasien,
      jenis_data,
      catatan,
      tanggal_periksa: tanggal_periksa
        ? new Date(tanggal_periksa)
        : existingData.tanggal_periksa,
      status_verifikasi: "PENDING", // Kembali ke PENDING
      jumlah_revisi: existingData.jumlah_revisi + 1,
      alasan_reject_terakhir,
      alasan_penolakan: null, // Reset alasan penolakan
      diverifikasi_oleh: null,
      tanggal_verifikasi: null,
    },
    include: {
      practice_place: {
        include: {
          village: true,
        },
      },
    },
  });

  return revisedData;
};

// DELETE: Hapus data yang masih PENDING
export const deleteHealthDataService = async (data_id, user_id) => {
  // Cek apakah data ada
  const existingData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: true,
    },
  });

  if (!existingData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi: Hanya bisa hapus jika status PENDING
  if (existingData.status_verifikasi !== "PENDING") {
    throw new Error("Hanya data dengan status PENDING yang bisa dihapus");
  }

  // Validasi: Hanya bidan praktik pemilik yang bisa hapus
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (
    !user.practice_place ||
    existingData.practice_id !== user.practice_place.practice_id
  ) {
    throw new Error("Anda tidak memiliki akses untuk menghapus data ini");
  }

  await prisma.health_data.delete({
    where: { data_id },
  });

  return { message: "Data kesehatan berhasil dihapus" };
};

// APPROVE: Bidan Desa menyetujui data
export const approveHealthDataService = async (data_id, user_id) => {
  // Cek apakah data ada
  const existingData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: true,
    },
  });

  if (!existingData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi: Hanya bisa approve jika status PENDING
  if (existingData.status_verifikasi !== "PENDING") {
    throw new Error("Hanya data dengan status PENDING yang bisa diverifikasi");
  }

  // Validasi: Hanya bidan desa dari desa yang sama yang bisa approve
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (user.position_user !== "bidan_desa") {
    throw new Error("Hanya bidan desa yang bisa memverifikasi data");
  }

  if (
    !user.village_id ||
    existingData.practice_place.village_id !== user.village_id
  ) {
    throw new Error(
      "Anda tidak memiliki akses untuk memverifikasi data dari desa ini",
    );
  }

  const approvedData = await prisma.health_data.update({
    where: { data_id },
    data: {
      status_verifikasi: "APPROVED",
      diverifikasi_oleh: user_id,
      tanggal_verifikasi: new Date(),
      alasan_penolakan: null,
    },
    include: {
      practice_place: {
        include: {
          village: true,
        },
      },
      verifier: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  return approvedData;
};

// REJECT: Bidan Desa menolak data dengan alasan
export const rejectHealthDataService = async (
  data_id,
  alasan_penolakan,
  user_id,
) => {
  if (!alasan_penolakan || alasan_penolakan.trim() === "") {
    throw new Error("Alasan penolakan wajib diisi");
  }

  // Cek apakah data ada
  const existingData = await prisma.health_data.findUnique({
    where: { data_id },
    include: {
      practice_place: true,
    },
  });

  if (!existingData) {
    throw new Error("Data kesehatan tidak ditemukan");
  }

  // Validasi: Hanya bisa reject jika status PENDING
  if (existingData.status_verifikasi !== "PENDING") {
    throw new Error("Hanya data dengan status PENDING yang bisa diverifikasi");
  }

  // Validasi: Hanya bidan desa dari desa yang sama yang bisa reject
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (user.position_user !== "bidan_desa") {
    throw new Error("Hanya bidan desa yang bisa memverifikasi data");
  }

  if (
    !user.village_id ||
    existingData.practice_place.village_id !== user.village_id
  ) {
    throw new Error(
      "Anda tidak memiliki akses untuk memverifikasi data dari desa ini",
    );
  }

  const rejectedData = await prisma.health_data.update({
    where: { data_id },
    data: {
      status_verifikasi: "REJECTED",
      diverifikasi_oleh: user_id,
      tanggal_verifikasi: new Date(),
      alasan_penolakan,
    },
    include: {
      practice_place: {
        include: {
          village: true,
        },
      },
      verifier: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
  });

  return rejectedData;
};

// GET PENDING: Ambil data yang menunggu verifikasi (Bidan Desa & Koordinator)
export const getPendingHealthDataService = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
  });

  if (
    user.position_user !== "bidan_desa" &&
    user.position_user !== "bidan_koordinator"
  ) {
    throw new Error(
      "Hanya Bidan Desa atau Bidan Koordinator yang bisa melihat data pending",
    );
  }

  const whereClause = {
    status_verifikasi: "PENDING",
  };

  // Jika Bidan Desa, filter by village_id
  if (user.position_user === "bidan_desa") {
    if (!user.village_id) {
      throw new Error("Bidan desa belum di-assign ke desa");
    }
    whereClause.practice_place = {
      village_id: user.village_id,
    };
  }

  const pendingData = await prisma.health_data.findMany({
    where: whereClause,
    include: {
      practice_place: {
        include: {
          village: true, // Tambahkan include village agar koordinator tau ini desa mana
          user: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return pendingData;
};

// GET REJECTED: Ambil data yang direject (Bidan Praktik)
export const getRejectedHealthDataService = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: {
      practice_place: true,
    },
  });

  if (user.position_user !== "bidan_praktik") {
    throw new Error(
      "Hanya bidan praktik yang bisa melihat data rejected mereka",
    );
  }

  if (!user.practice_place) {
    throw new Error("Bidan praktik belum memiliki tempat praktik");
  }

  const rejectedData = await prisma.health_data.findMany({
    where: {
      status_verifikasi: "REJECTED",
      practice_id: user.practice_place.practice_id,
    },
    include: {
      verifier: {
        select: {
          user_id: true,
          full_name: true,
        },
      },
    },
    orderBy: {
      tanggal_verifikasi: "desc",
    },
  });

  return rejectedData;
};
