import prisma from "../../lib/prisma.js";

const villageUserSelect = {
    user_id: true,
    full_name: true,
    email: true,
    phone_number: true,
    address: true,
    role: true,
    status_user: true,
    position_user: true,
    village_id: true,
    practice_id: true,
    created_at: true,
    updated_at: true,
};

const practicePlaceUserSelect = {
    user_id: true,
    full_name: true,
    email: true,
    phone_number: true,
    address: true,
    role: true,
    status_user: true,
    position_user: true,
    village_id: true,
    practice_id: true,
    created_at: true,
    updated_at: true,
};

const summarizeVillageMidwives = (village) => {
    const bidanDesaIds = new Set(
        (village.users || [])
            .filter((user) => user.position_user === "bidan_desa")
            .map((user) => user.user_id),
    );
    const bidanPraktikIds = new Set();

    (village.practice_places || []).forEach((practicePlace) => {
        (practicePlace.users || [])
            .filter((user) => user.position_user === "bidan_praktik")
            .forEach((user) => bidanPraktikIds.add(user.user_id));
    });

    const totalBidanWilayah = new Set([
        ...bidanDesaIds,
        ...bidanPraktikIds,
    ]).size;

    return {
        total_bidan_desa: bidanDesaIds.size,
        total_bidan_praktik: bidanPraktikIds.size,
        total_bidan_wilayah: totalBidanWilayah,
    };
};

export const createVillageService = async (villageData) => {
    const { nama_desa } = villageData;

    // Validasi: Nama desa tidak boleh kosong
    if (!nama_desa || nama_desa.trim() === '') {
        throw new Error('Nama desa tidak boleh kosong');
    }

    // Cek apakah nama desa sudah ada
    const existingVillage = await prisma.village.findFirst({
        where: { nama_desa }
    });

    if (existingVillage) {
        throw new Error('Nama desa sudah terdaftar');
    }

    const newVillage = await prisma.village.create({
        data: { nama_desa }
    });

    return newVillage;
};

export const getAllVillagesService = async () => {
    const villages = await prisma.village.findMany({
        include: {
            users: {
                select: {
                    user_id: true,
                    position_user: true,
                },
            },
            practice_places: {
                select: {
                    users: {
                        select: {
                            user_id: true,
                            position_user: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    users: true,
                    practice_places: true
                }
            }
        },
        orderBy: {
            nama_desa: 'asc'
        }
    });

    return villages.map((village) => {
        const summary = summarizeVillageMidwives(village);

        return {
            ...village,
            _count: {
                ...village._count,
                users: summary.total_bidan_wilayah,
            },
            ...summary,
        };
    });
};

export const getVillageByIdService = async (village_id) => {
    const village = await prisma.village.findUnique({
        where: { village_id },
        include: {
            users: {
                select: villageUserSelect,
                orderBy: {
                    full_name: 'asc'
                },
            },
            practice_places: {
                include: {
                    users: {
                        select: practicePlaceUserSelect,
                        orderBy: {
                            full_name: 'asc'
                        }
                    },
                    _count: {
                        select: {
                            users: true,
                            health_data: true,
                            pasiens: true,
                        },
                    },
                },
                orderBy: {
                    nama_praktik: 'asc'
                },
            },
            _count: {
                select: {
                    users: true,
                    practice_places: true,
                    pasiens: true,
                },
            }
        }
    });

    if (!village) {
        throw new Error('Desa tidak ditemukan');
    }

    return {
        ...village,
        ...summarizeVillageMidwives(village),
        total_tempat_praktik: village._count.practice_places,
        total_pasien: village._count.pasiens,
    };
};

export const updateVillageService = async (village_id, villageData) => {
    const { nama_desa } = villageData;

    // Cek apakah village ada
    const existingVillage = await prisma.village.findUnique({
        where: { village_id }
    });

    if (!existingVillage) {
        throw new Error('Desa tidak ditemukan');
    }

    // Validasi: Nama desa tidak boleh kosong
    if (!nama_desa || nama_desa.trim() === '') {
        throw new Error('Nama desa tidak boleh kosong');
    }

    // Cek apakah nama desa baru sudah dipakai desa lain
    if (nama_desa !== existingVillage.nama_desa) {
        const duplicateVillage = await prisma.village.findFirst({
            where: {
                nama_desa,
                village_id: { not: village_id }
            }
        });

        if (duplicateVillage) {
            throw new Error('Nama desa sudah digunakan oleh desa lain');
        }
    }

    const updatedVillage = await prisma.village.update({
        where: { village_id },
        data: { nama_desa }
    });

    return updatedVillage;
};

export const deleteVillageService = async (village_id) => {
    // Cek apakah village ada
    const existingVillage = await prisma.village.findUnique({
        where: { village_id },
        include: {
            _count: {
                select: {
                    users: true,
                    practice_places: true
                }
            }
        }
    });

    if (!existingVillage) {
        throw new Error('Desa tidak ditemukan');
    }

    // Validasi: Tidak bisa hapus desa yang masih punya user atau tempat praktik
    if (existingVillage._count.users > 0 || existingVillage._count.practice_places > 0) {
        throw new Error('Tidak bisa menghapus desa yang masih memiliki user atau tempat praktik');
    }

    await prisma.village.delete({
        where: { village_id }
    });

    return { message: 'Desa berhasil dihapus' };
};
