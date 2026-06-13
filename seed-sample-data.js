import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma.js";

const SAMPLE_PASSWORD = "sample123";

const SAMPLE_IDS = {
  villages: {
    melati: "11111111-1111-4111-8111-111111111111",
    anggrek: "22222222-2222-4222-8222-222222222222",
  },
  practices: {
    melatiUtama: "33333333-3333-4333-8333-333333333331",
    melatiSejahtera: "33333333-3333-4333-8333-333333333332",
    anggrekBunda: "33333333-3333-4333-8333-333333333333",
  },
  users: {
    koordinator: "44444444-4444-4444-8444-444444444441",
    desaMelati: "44444444-4444-4444-8444-444444444442",
    desaAnggrek: "44444444-4444-4444-8444-444444444443",
    praktikMelati1: "44444444-4444-4444-8444-444444444444",
    praktikMelati1b: "44444444-4444-4444-8444-444444444445",
    praktikMelati2: "44444444-4444-4444-8444-444444444446",
    praktikAnggrek1: "44444444-4444-4444-8444-444444444447",
    praktikUnassigned: "44444444-4444-4444-8444-444444444448",
    desaUnassigned: "44444444-4444-4444-8444-444444444449",
    inactive: "44444444-4444-4444-8444-444444444450",
  },
  pasien: {
    ibuMelati1: "55555555-5555-4555-8555-555555555551",
    ibuMelati2: "55555555-5555-4555-8555-555555555552",
    ibuAnggrek1: "55555555-5555-4555-8555-555555555553",
    bayiMelati1: "55555555-5555-4555-8555-555555555554",
    bayiMelati2: "55555555-5555-4555-8555-555555555555",
    bayiAnggrek1: "55555555-5555-4555-8555-555555555556",
  },
  legacy: {
    approved: "66666666-6666-4666-8666-666666666661",
    rejected: "66666666-6666-4666-8666-666666666662",
    pending: "66666666-6666-4666-8666-666666666663",
  },
  kehamilan: {
    approvedMelati: "77777777-7777-4777-8777-777777777771",
    rejectedMelati: "77777777-7777-4777-8777-777777777772",
    pendingMelati: "77777777-7777-4777-8777-777777777773",
    approvedAnggrek: "77777777-7777-4777-8777-777777777774",
  },
  ceklab: {
    approvedMelati: "88888888-8888-4888-8888-888888888881",
    rejectedMelati: "88888888-8888-4888-8888-888888888882",
    pendingMelati: "88888888-8888-4888-8888-888888888883",
    approvedAnggrek: "88888888-8888-4888-8888-888888888884",
  },
  persalinan: {
    approvedMelati: "99999999-9999-4999-8999-999999999991",
    rejectedMelati: "99999999-9999-4999-8999-999999999992",
    pendingAnggrek: "99999999-9999-4999-8999-999999999993",
  },
  keadaanIbu: {
    approvedMelati: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    rejectedMelati: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    pendingAnggrek: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
  },
  keadaanBayi: {
    approvedMelati: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    rejectedMelati: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    pendingAnggrek: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  },
  kb: {
    approvedMelati: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    rejectedMelati: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
    pendingAnggrek: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  },
  imunisasi: {
    approvedMelati: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
    rejectedMelati: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
    pendingAnggrek: "dddddddd-dddd-4ddd-8ddd-ddddddddddd3",
  },
};

const users = {
  koordinator: {
    user_id: SAMPLE_IDS.users.koordinator,
    full_name: "Sample Bidan Koordinator",
    email: "sample.koordinator@puskesmas.local",
    phone_number: "081111111111",
    address: "Kantor Koordinator Sample",
    position_user: "bidan_koordinator",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: null,
  },
  desaMelati: {
    user_id: SAMPLE_IDS.users.desaMelati,
    full_name: "Sample Bidan Desa Melati",
    email: "sample.desa.melati@puskesmas.local",
    phone_number: "081111111112",
    address: "Desa Melati",
    position_user: "bidan_desa",
    role: "USER",
    status_user: "ACTIVE",
    village_id: SAMPLE_IDS.villages.melati,
    practice_id: null,
  },
  desaAnggrek: {
    user_id: SAMPLE_IDS.users.desaAnggrek,
    full_name: "Sample Bidan Desa Anggrek",
    email: "sample.desa.anggrek@puskesmas.local",
    phone_number: "081111111113",
    address: "Desa Anggrek",
    position_user: "bidan_desa",
    role: "USER",
    status_user: "ACTIVE",
    village_id: SAMPLE_IDS.villages.anggrek,
    practice_id: null,
  },
  praktikMelati1: {
    user_id: SAMPLE_IDS.users.praktikMelati1,
    full_name: "Sample Bidan Praktik Melati 1",
    email: "sample.praktik.melati1@puskesmas.local",
    phone_number: "081111111114",
    address: "Praktik Melati Utama",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: SAMPLE_IDS.practices.melatiUtama,
  },
  praktikMelati1b: {
    user_id: SAMPLE_IDS.users.praktikMelati1b,
    full_name: "Sample Bidan Praktik Melati 1B",
    email: "sample.praktik.melati1b@puskesmas.local",
    phone_number: "081111111115",
    address: "Praktik Melati Utama",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: SAMPLE_IDS.practices.melatiUtama,
  },
  praktikMelati2: {
    user_id: SAMPLE_IDS.users.praktikMelati2,
    full_name: "Sample Bidan Praktik Melati 2",
    email: "sample.praktik.melati2@puskesmas.local",
    phone_number: "081111111116",
    address: "Praktik Melati Sejahtera",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: SAMPLE_IDS.practices.melatiSejahtera,
  },
  praktikAnggrek1: {
    user_id: SAMPLE_IDS.users.praktikAnggrek1,
    full_name: "Sample Bidan Praktik Anggrek 1",
    email: "sample.praktik.anggrek1@puskesmas.local",
    phone_number: "081111111117",
    address: "Praktik Anggrek Bunda",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: SAMPLE_IDS.practices.anggrekBunda,
  },
  praktikUnassigned: {
    user_id: SAMPLE_IDS.users.praktikUnassigned,
    full_name: "Sample Bidan Praktik Unassigned",
    email: "sample.praktik.unassigned@puskesmas.local",
    phone_number: "081111111118",
    address: "Belum ada tempat praktik",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: null,
  },
  desaUnassigned: {
    user_id: SAMPLE_IDS.users.desaUnassigned,
    full_name: "Sample Bidan Desa Unassigned",
    email: "sample.desa.unassigned@puskesmas.local",
    phone_number: "081111111119",
    address: "Belum ada desa",
    position_user: "bidan_desa",
    role: "USER",
    status_user: "ACTIVE",
    village_id: null,
    practice_id: null,
  },
  inactive: {
    user_id: SAMPLE_IDS.users.inactive,
    full_name: "Sample User Inactive",
    email: "sample.inactive@puskesmas.local",
    phone_number: "081111111120",
    address: "User inactive sample",
    position_user: "bidan_praktik",
    role: "USER",
    status_user: "INACTIVE",
    village_id: null,
    practice_id: SAMPLE_IDS.practices.melatiSejahtera,
  },
};

const practicePlaces = [
  {
    practice_id: SAMPLE_IDS.practices.melatiUtama,
    nama_praktik: "SAMPLE PRAKTIK MELATI UTAMA",
    village_id: SAMPLE_IDS.villages.melati,
    alamat: "Jl. Melati Utama No. 1",
  },
  {
    practice_id: SAMPLE_IDS.practices.melatiSejahtera,
    nama_praktik: "SAMPLE PRAKTIK MELATI SEJAHTERA",
    village_id: SAMPLE_IDS.villages.melati,
    alamat: "Jl. Melati Sejahtera No. 2",
  },
  {
    practice_id: SAMPLE_IDS.practices.anggrekBunda,
    nama_praktik: "SAMPLE PRAKTIK ANGGREK BUNDA",
    village_id: SAMPLE_IDS.villages.anggrek,
    alamat: "Jl. Anggrek Bunda No. 3",
  },
];

const pasiens = [
  {
    pasien_id: SAMPLE_IDS.pasien.ibuMelati1,
    nik: "9100000000000001",
    nama: "Sample Ibu Melati 1",
    alamat_lengkap: "Dusun Melati RT 01",
    tanggal_lahir: "1995-02-11T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.melati,
    practice_id: SAMPLE_IDS.practices.melatiUtama,
  },
  {
    pasien_id: SAMPLE_IDS.pasien.ibuMelati2,
    nik: "9100000000000002",
    nama: "Sample Ibu Melati 2",
    alamat_lengkap: "Dusun Melati RT 02",
    tanggal_lahir: "1997-08-21T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.melati,
    practice_id: SAMPLE_IDS.practices.melatiSejahtera,
  },
  {
    pasien_id: SAMPLE_IDS.pasien.ibuAnggrek1,
    nik: "9100000000000003",
    nama: "Sample Ibu Anggrek 1",
    alamat_lengkap: "Dusun Anggrek RT 03",
    tanggal_lahir: "1994-06-17T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.anggrek,
    practice_id: SAMPLE_IDS.practices.anggrekBunda,
  },
  {
    pasien_id: SAMPLE_IDS.pasien.bayiMelati1,
    nik: "9100000000000004",
    nama: "Sample Bayi Melati 1",
    alamat_lengkap: "Dusun Melati RT 01",
    tanggal_lahir: "2025-12-10T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.melati,
    practice_id: SAMPLE_IDS.practices.melatiUtama,
  },
  {
    pasien_id: SAMPLE_IDS.pasien.bayiMelati2,
    nik: "9100000000000005",
    nama: "Sample Bayi Melati 2",
    alamat_lengkap: "Dusun Melati RT 02",
    tanggal_lahir: "2026-01-05T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.melati,
    practice_id: SAMPLE_IDS.practices.melatiSejahtera,
  },
  {
    pasien_id: SAMPLE_IDS.pasien.bayiAnggrek1,
    nik: "9100000000000006",
    nama: "Sample Bayi Anggrek 1",
    alamat_lengkap: "Dusun Anggrek RT 03",
    tanggal_lahir: "2026-02-12T00:00:00.000Z",
    village_id: SAMPLE_IDS.villages.anggrek,
    practice_id: SAMPLE_IDS.practices.anggrekBunda,
  },
];

const withVerification = ({ status, verifierId = null, verifiedAt = null, rejectionReason = null }) => ({
  status_verifikasi: status,
  diverifikasi_oleh: status === "PENDING" ? null : verifierId,
  tanggal_verifikasi: status === "PENDING" ? null : new Date(verifiedAt),
  alasan_penolakan: status === "REJECTED" ? rejectionReason : null,
});

const credentialsToPrint = [
  ["Admin existing", "admin@puskesmas.local", "admin123"],
  ["Sample koordinator", users.koordinator.email, SAMPLE_PASSWORD],
  ["Sample bidan desa melati", users.desaMelati.email, SAMPLE_PASSWORD],
  ["Sample bidan desa anggrek", users.desaAnggrek.email, SAMPLE_PASSWORD],
  ["Sample praktik melati 1", users.praktikMelati1.email, SAMPLE_PASSWORD],
  ["Sample praktik melati 1B", users.praktikMelati1b.email, SAMPLE_PASSWORD],
  ["Sample praktik melati 2", users.praktikMelati2.email, SAMPLE_PASSWORD],
  ["Sample praktik anggrek 1", users.praktikAnggrek1.email, SAMPLE_PASSWORD],
  ["Sample praktik unassigned", users.praktikUnassigned.email, SAMPLE_PASSWORD],
  ["Sample desa unassigned", users.desaUnassigned.email, SAMPLE_PASSWORD],
  ["Sample inactive", users.inactive.email, SAMPLE_PASSWORD],
];

async function upsertUsers(tx, hashedPassword) {
  for (const user of Object.values(users)) {
    await tx.user.upsert({
      where: { email: user.email },
      update: {
        user_id: user.user_id,
        full_name: user.full_name,
        password: hashedPassword,
        phone_number: user.phone_number,
        address: user.address,
        position_user: user.position_user,
        role: user.role,
        status_user: user.status_user,
        village_id: user.village_id,
        practice_id: user.practice_id,
      },
      create: {
        ...user,
        password: hashedPassword,
      },
    });
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash(SAMPLE_PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    await tx.village.upsert({
      where: { village_id: SAMPLE_IDS.villages.melati },
      update: { nama_desa: "SAMPLE DESA MELATI" },
      create: {
        village_id: SAMPLE_IDS.villages.melati,
        nama_desa: "SAMPLE DESA MELATI",
      },
    });

    await tx.village.upsert({
      where: { village_id: SAMPLE_IDS.villages.anggrek },
      update: { nama_desa: "SAMPLE DESA ANGGREK" },
      create: {
        village_id: SAMPLE_IDS.villages.anggrek,
        nama_desa: "SAMPLE DESA ANGGREK",
      },
    });

    for (const practice of practicePlaces) {
      await tx.practice_place.upsert({
        where: { practice_id: practice.practice_id },
        update: practice,
        create: practice,
      });
    }

    await upsertUsers(tx, hashedPassword);

    for (const pasien of pasiens) {
      await tx.pasien.upsert({
        where: { nik: pasien.nik },
        update: {
          pasien_id: pasien.pasien_id,
          nama: pasien.nama,
          alamat_lengkap: pasien.alamat_lengkap,
          tanggal_lahir: new Date(pasien.tanggal_lahir),
          village_id: pasien.village_id,
          practice_id: pasien.practice_id,
        },
        create: {
          ...pasien,
          tanggal_lahir: new Date(pasien.tanggal_lahir),
        },
      });
    }

    const legacyRecords = [
      {
        data_id: SAMPLE_IDS.legacy.approved,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        nama_pasien: "Sample Legacy Approved",
        umur_pasien: 29,
        jenis_data: "IBU_HAMIL",
        catatan: "SAMPLE_SEED legacy approved",
        tanggal_periksa: new Date("2026-03-04T08:00:00.000Z"),
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-03-05T09:00:00.000Z",
        }),
      },
      {
        data_id: SAMPLE_IDS.legacy.rejected,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        nama_pasien: "Sample Legacy Rejected",
        umur_pasien: 31,
        jenis_data: "NIFAS",
        catatan: "SAMPLE_SEED legacy rejected",
        tanggal_periksa: new Date("2026-04-09T08:00:00.000Z"),
        ...withVerification({
          status: "REJECTED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-04-10T09:30:00.000Z",
          rejectionReason: "Sample reject legacy untuk uji halaman revisi",
        }),
      },
      {
        data_id: SAMPLE_IDS.legacy.pending,
        practice_id: SAMPLE_IDS.practices.melatiSejahtera,
        nama_pasien: "Sample Legacy Pending",
        umur_pasien: 27,
        jenis_data: "KB",
        catatan: "SAMPLE_SEED legacy pending",
        tanggal_periksa: new Date("2026-06-11T10:00:00.000Z"),
        ...withVerification({ status: "PENDING" }),
      },
    ];

    for (const record of legacyRecords) {
      await tx.health_data.upsert({
        where: { data_id: record.data_id },
        update: record,
        create: record,
      });
    }

    const pemeriksaanRecords = [
      {
        id: SAMPLE_IDS.kehamilan.approvedMelati,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati1,
        tanggal: new Date("2026-04-10T08:30:00.000Z"),
        gpa: "G2P1A0",
        umur_kehamilan: 24,
        status_tt: "TT2",
        jenis_kunjungan: "ANC",
        td: "120/80",
        lila: 25.2,
        bb: 58.5,
        resti: "RENDAH",
        catatan: "SAMPLE_SEED kehamilan approved",
        created_by: SAMPLE_IDS.users.praktikMelati1,
        updated_by: SAMPLE_IDS.users.praktikMelati1,
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-04-11T09:30:00.000Z",
        }),
      },
      {
        id: SAMPLE_IDS.kehamilan.rejectedMelati,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati1,
        tanggal: new Date("2026-06-02T08:30:00.000Z"),
        gpa: "G2P1A0",
        umur_kehamilan: 32,
        status_tt: "TT2+",
        jenis_kunjungan: "ANC",
        td: "140/95",
        lila: 24.5,
        bb: 61.2,
        resti: "TINGGI",
        catatan: "SAMPLE_SEED kehamilan rejected",
        created_by: SAMPLE_IDS.users.praktikMelati1,
        updated_by: SAMPLE_IDS.users.praktikMelati1,
        ...withVerification({
          status: "REJECTED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-06-03T11:00:00.000Z",
          rejectionReason: "Mohon lengkapi catatan klinis ANC sample",
        }),
      },
      {
        id: SAMPLE_IDS.kehamilan.pendingMelati,
        practice_id: SAMPLE_IDS.practices.melatiSejahtera,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati2,
        tanggal: new Date("2026-06-12T08:15:00.000Z"),
        gpa: "G1P0A0",
        umur_kehamilan: 12,
        status_tt: "TT1",
        jenis_kunjungan: "ANC",
        td: "118/76",
        lila: 26.1,
        bb: 52.4,
        resti: "SEDANG",
        catatan: "SAMPLE_SEED kehamilan pending",
        created_by: SAMPLE_IDS.users.praktikMelati2,
        updated_by: SAMPLE_IDS.users.praktikMelati2,
        ...withVerification({ status: "PENDING" }),
      },
      {
        id: SAMPLE_IDS.kehamilan.approvedAnggrek,
        practice_id: SAMPLE_IDS.practices.anggrekBunda,
        pasien_id: SAMPLE_IDS.pasien.ibuAnggrek1,
        tanggal: new Date("2026-05-14T07:45:00.000Z"),
        gpa: "G3P2A0",
        umur_kehamilan: 28,
        status_tt: "TT2+",
        jenis_kunjungan: "ANC",
        td: "122/82",
        lila: 26.9,
        bb: 60.8,
        resti: "RENDAH",
        catatan: "SAMPLE_SEED kehamilan approved anggrek",
        created_by: SAMPLE_IDS.users.praktikAnggrek1,
        updated_by: SAMPLE_IDS.users.praktikAnggrek1,
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaAnggrek,
          verifiedAt: "2026-05-15T09:00:00.000Z",
        }),
      },
    ];

    for (const record of pemeriksaanRecords) {
      await tx.pemeriksaan_kehamilan.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    const ceklabRecords = [
      {
        id: SAMPLE_IDS.ceklab.approvedMelati,
        pemeriksaan_kehamilan_id: SAMPLE_IDS.kehamilan.approvedMelati,
        hiv: false,
        hbsag: false,
        sifilis: false,
        hb: 11.8,
        golongan_darah: "O",
      },
      {
        id: SAMPLE_IDS.ceklab.rejectedMelati,
        pemeriksaan_kehamilan_id: SAMPLE_IDS.kehamilan.rejectedMelati,
        hiv: false,
        hbsag: false,
        sifilis: false,
        hb: 10.9,
        golongan_darah: "A",
      },
      {
        id: SAMPLE_IDS.ceklab.pendingMelati,
        pemeriksaan_kehamilan_id: SAMPLE_IDS.kehamilan.pendingMelati,
        hiv: false,
        hbsag: false,
        sifilis: false,
        hb: 12.1,
        golongan_darah: "B",
      },
      {
        id: SAMPLE_IDS.ceklab.approvedAnggrek,
        pemeriksaan_kehamilan_id: SAMPLE_IDS.kehamilan.approvedAnggrek,
        hiv: false,
        hbsag: false,
        sifilis: false,
        hb: 12.4,
        golongan_darah: "AB",
      },
    ];

    for (const record of ceklabRecords) {
      await tx.ceklab_report.upsert({
        where: { pemeriksaan_kehamilan_id: record.pemeriksaan_kehamilan_id },
        update: record,
        create: record,
      });
    }

    const persalinanRecords = [
      {
        id: SAMPLE_IDS.persalinan.approvedMelati,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati1,
        tanggal_partus: new Date("2026-04-20T03:00:00.000Z"),
        gravida: 2,
        para: 2,
        abortus: 0,
        vit_k: true,
        hb_0: true,
        vit_a_bufas: true,
        catatan: "SAMPLE_SEED persalinan approved",
        created_by: SAMPLE_IDS.users.praktikMelati1,
        updated_by: SAMPLE_IDS.users.praktikMelati1,
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-04-21T10:00:00.000Z",
        }),
      },
      {
        id: SAMPLE_IDS.persalinan.rejectedMelati,
        practice_id: SAMPLE_IDS.practices.melatiSejahtera,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati2,
        tanggal_partus: new Date("2026-06-05T02:30:00.000Z"),
        gravida: 1,
        para: 1,
        abortus: 0,
        vit_k: false,
        hb_0: true,
        vit_a_bufas: false,
        catatan: "SAMPLE_SEED persalinan rejected",
        created_by: SAMPLE_IDS.users.praktikMelati2,
        updated_by: SAMPLE_IDS.users.praktikMelati2,
        ...withVerification({
          status: "REJECTED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-06-06T10:30:00.000Z",
          rejectionReason: "Mohon lengkapi keadaan ibu dan bayi pada data sample",
        }),
      },
      {
        id: SAMPLE_IDS.persalinan.pendingAnggrek,
        practice_id: SAMPLE_IDS.practices.anggrekBunda,
        pasien_id: SAMPLE_IDS.pasien.ibuAnggrek1,
        tanggal_partus: new Date("2026-06-10T01:45:00.000Z"),
        gravida: 3,
        para: 3,
        abortus: 0,
        vit_k: true,
        hb_0: false,
        vit_a_bufas: true,
        catatan: "SAMPLE_SEED persalinan pending",
        created_by: SAMPLE_IDS.users.praktikAnggrek1,
        updated_by: SAMPLE_IDS.users.praktikAnggrek1,
        ...withVerification({ status: "PENDING" }),
      },
    ];

    for (const record of persalinanRecords) {
      await tx.persalinan.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    const keadaanIbuRecords = [
      {
        id: SAMPLE_IDS.keadaanIbu.approvedMelati,
        persalinan_id: SAMPLE_IDS.persalinan.approvedMelati,
        baik: true,
        hap: false,
        partus_lama: false,
        pre_eklamsi: false,
        hidup: true,
      },
      {
        id: SAMPLE_IDS.keadaanIbu.rejectedMelati,
        persalinan_id: SAMPLE_IDS.persalinan.rejectedMelati,
        baik: false,
        hap: true,
        partus_lama: false,
        pre_eklamsi: true,
        hidup: true,
      },
      {
        id: SAMPLE_IDS.keadaanIbu.pendingAnggrek,
        persalinan_id: SAMPLE_IDS.persalinan.pendingAnggrek,
        baik: true,
        hap: false,
        partus_lama: false,
        pre_eklamsi: false,
        hidup: true,
      },
    ];

    for (const record of keadaanIbuRecords) {
      await tx.keadaan_ibu_persalinan.upsert({
        where: { persalinan_id: record.persalinan_id },
        update: record,
        create: record,
      });
    }

    const keadaanBayiRecords = [
      {
        id: SAMPLE_IDS.keadaanBayi.approvedMelati,
        persalinan_id: SAMPLE_IDS.persalinan.approvedMelati,
        pb: 49.5,
        bb: 3100,
        jenis_kelamin: "PEREMPUAN",
        asfiksia: false,
        rds: false,
        cacat_bawaan: false,
        keterangan_cacat: null,
        hidup: true,
      },
      {
        id: SAMPLE_IDS.keadaanBayi.rejectedMelati,
        persalinan_id: SAMPLE_IDS.persalinan.rejectedMelati,
        pb: 48.2,
        bb: 2900,
        jenis_kelamin: "LAKI_LAKI",
        asfiksia: true,
        rds: false,
        cacat_bawaan: false,
        keterangan_cacat: null,
        hidup: true,
      },
      {
        id: SAMPLE_IDS.keadaanBayi.pendingAnggrek,
        persalinan_id: SAMPLE_IDS.persalinan.pendingAnggrek,
        pb: 50.1,
        bb: 3200,
        jenis_kelamin: "PEREMPUAN",
        asfiksia: false,
        rds: false,
        cacat_bawaan: false,
        keterangan_cacat: null,
        hidup: true,
      },
    ];

    for (const record of keadaanBayiRecords) {
      await tx.keadaan_bayi_persalinan.upsert({
        where: { persalinan_id: record.persalinan_id },
        update: record,
        create: record,
      });
    }

    const kbRecords = [
      {
        id: SAMPLE_IDS.kb.approvedMelati,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati1,
        tanggal_kunjungan: new Date("2026-03-15T08:00:00.000Z"),
        jumlah_anak_laki: 1,
        jumlah_anak_perempuan: 1,
        at: false,
        alat_kontrasepsi: "PIL",
        keterangan: "SAMPLE_SEED kb approved",
        created_by: SAMPLE_IDS.users.praktikMelati1,
        updated_by: SAMPLE_IDS.users.praktikMelati1,
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-03-16T09:00:00.000Z",
        }),
      },
      {
        id: SAMPLE_IDS.kb.rejectedMelati,
        practice_id: SAMPLE_IDS.practices.melatiSejahtera,
        pasien_id: SAMPLE_IDS.pasien.ibuMelati2,
        tanggal_kunjungan: new Date("2026-04-18T08:00:00.000Z"),
        jumlah_anak_laki: 0,
        jumlah_anak_perempuan: 1,
        at: true,
        alat_kontrasepsi: "SUNTIK",
        keterangan: "SAMPLE_SEED kb rejected",
        created_by: SAMPLE_IDS.users.praktikMelati2,
        updated_by: SAMPLE_IDS.users.praktikMelati2,
        ...withVerification({
          status: "REJECTED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-04-19T10:00:00.000Z",
          rejectionReason: "Mohon cek ulang metode kontrasepsi sample",
        }),
      },
      {
        id: SAMPLE_IDS.kb.pendingAnggrek,
        practice_id: SAMPLE_IDS.practices.anggrekBunda,
        pasien_id: SAMPLE_IDS.pasien.ibuAnggrek1,
        tanggal_kunjungan: new Date("2026-06-07T08:00:00.000Z"),
        jumlah_anak_laki: 2,
        jumlah_anak_perempuan: 1,
        at: false,
        alat_kontrasepsi: "IMPLANT",
        keterangan: "SAMPLE_SEED kb pending",
        created_by: SAMPLE_IDS.users.praktikAnggrek1,
        updated_by: SAMPLE_IDS.users.praktikAnggrek1,
        ...withVerification({ status: "PENDING" }),
      },
    ];

    for (const record of kbRecords) {
      await tx.keluarga_berencana.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    const imunisasiRecords = [
      {
        id: SAMPLE_IDS.imunisasi.approvedMelati,
        practice_id: SAMPLE_IDS.practices.melatiUtama,
        pasien_id: SAMPLE_IDS.pasien.bayiMelati1,
        tgl_imunisasi: new Date("2026-05-03T08:00:00.000Z"),
        berat_badan: 6.4,
        suhu_badan: 36.7,
        nama_orangtua: "Sample Ibu Melati 1",
        jenis_imunisasi: "BCG",
        catatan: "SAMPLE_SEED imunisasi approved",
        created_by: SAMPLE_IDS.users.praktikMelati1,
        updated_by: SAMPLE_IDS.users.praktikMelati1,
        ...withVerification({
          status: "APPROVED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-05-04T09:00:00.000Z",
        }),
      },
      {
        id: SAMPLE_IDS.imunisasi.rejectedMelati,
        practice_id: SAMPLE_IDS.practices.melatiSejahtera,
        pasien_id: SAMPLE_IDS.pasien.bayiMelati2,
        tgl_imunisasi: new Date("2026-06-01T08:00:00.000Z"),
        berat_badan: 5.8,
        suhu_badan: 37.1,
        nama_orangtua: "Sample Ibu Melati 2",
        jenis_imunisasi: "DPT_1",
        catatan: "SAMPLE_SEED imunisasi rejected",
        created_by: SAMPLE_IDS.users.praktikMelati2,
        updated_by: SAMPLE_IDS.users.praktikMelati2,
        ...withVerification({
          status: "REJECTED",
          verifierId: SAMPLE_IDS.users.desaMelati,
          verifiedAt: "2026-06-02T09:00:00.000Z",
          rejectionReason: "Mohon lengkapi catatan reaksi pasca imunisasi sample",
        }),
      },
      {
        id: SAMPLE_IDS.imunisasi.pendingAnggrek,
        practice_id: SAMPLE_IDS.practices.anggrekBunda,
        pasien_id: SAMPLE_IDS.pasien.bayiAnggrek1,
        tgl_imunisasi: new Date("2026-06-09T08:00:00.000Z"),
        berat_badan: 6.1,
        suhu_badan: 36.8,
        nama_orangtua: "Sample Ibu Anggrek 1",
        jenis_imunisasi: "POLIO_1",
        catatan: "SAMPLE_SEED imunisasi pending",
        created_by: SAMPLE_IDS.users.praktikAnggrek1,
        updated_by: SAMPLE_IDS.users.praktikAnggrek1,
        ...withVerification({ status: "PENDING" }),
      },
    ];

    for (const record of imunisasiRecords) {
      await tx.imunisasi.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }
  });

  const counts = {
    users: await prisma.user.count(),
    villages: await prisma.village.count(),
    practicePlaces: await prisma.practice_place.count(),
    pasien: await prisma.pasien.count(),
    healthData: await prisma.health_data.count(),
    kehamilan: await prisma.pemeriksaan_kehamilan.count(),
    persalinan: await prisma.persalinan.count(),
    kb: await prisma.keluarga_berencana.count(),
    imunisasi: await prisma.imunisasi.count(),
  };

  console.log("Sample data berhasil diinject.");
  console.log(JSON.stringify(counts, null, 2));
  console.log("\nAkun sample untuk FE:");
  credentialsToPrint.forEach(([label, email, password]) => {
    console.log(`- ${label}: ${email} / ${password}`);
  });
}

main()
  .catch((error) => {
    console.error("Gagal inject sample data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
