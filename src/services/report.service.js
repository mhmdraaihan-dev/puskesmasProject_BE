import ExcelJS from "exceljs";
import PDFDocument from "pdfkit-table";
import prisma from "../../lib/prisma.js";

/**
 * Export Pemeriksaan Kehamilan to Excel
 */
export const exportPemeriksaanKehamilanToExcel = async (filters) => {
  const { village_id, month, year } = filters;

  const where = {
    status_verifikasi: "APPROVED",
  };

  // Filter by Village
  if (village_id) {
    where.practice_place = {
      village_id: village_id,
    };
  }

  // Filter by Month & Year
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
  }

  const data = await prisma.pemeriksaan_kehamilan.findMany({
    where,
    include: {
      pasien: true,
      practice_place: {
        include: {
          village: true,
        },
      },
      ceklab_report: true,
      verifier: {
        select: { full_name: true },
      },
      creator: {
        select: { full_name: true },
      },
    },
    orderBy: {
      tanggal: "asc",
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pemeriksaan Kehamilan");

  // Define Columns
  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal", key: "tanggal", width: 15 },
    { header: "Nama Pasien", key: "nama_pasien", width: 25 },
    { header: "NIK", key: "nik", width: 20 },
    { header: "Desa", key: "desa", width: 15 },
    { header: "Tempat Praktik", key: "praktik", width: 20 },
    { header: "GPA", key: "gpa", width: 10 },
    { header: "Umur Kehamilan (Minggu)", key: "umur", width: 20 },
    { header: "Status TT", key: "tt", width: 10 },
    { header: "Jenis Kunjungan", key: "kunjungan", width: 15 },
    { header: "Tekanan Darah", key: "td", width: 15 },
    { header: "LILA (cm)", key: "lila", width: 10 },
    { header: "Berat Badan (kg)", key: "bb", width: 15 },
    { header: "Resiko Tinggi", key: "resti", width: 15 },
    { header: "HB", key: "hb", width: 10 },
    { header: "Gol Darah", key: "gol_darah", width: 10 },
    { header: "HIV", key: "hiv", width: 10 },
    { header: "HBsAg", key: "hbsag", width: 10 },
    { header: "Sifilis", key: "sifilis", width: 10 },
    { header: "Diverifikasi Oleh", key: "verifier", width: 20 },
    { header: "Catatan", key: "catatan", width: 30 },
  ];

  // Add Data Rows
  data.forEach((item, index) => {
    worksheet.addRow({
      no: index + 1,
      tanggal: item.tanggal.toLocaleDateString("id-ID"),
      nama_pasien: item.pasien.nama,
      nik: item.pasien.nik,
      desa: item.practice_place?.village?.nama_desa || "-",
      praktik: item.practice_place?.nama_praktik || "-",
      gpa: item.gpa,
      umur: item.umur_kehamilan,
      tt: item.status_tt,
      kunjungan: item.jenis_kunjungan,
      td: item.td,
      lila: item.lila || "-",
      bb: item.bb || "-",
      resti: item.resti,
      hb: item.ceklab_report?.hb || "-",
      gol_darah: item.ceklab_report?.golongan_darah || "-",
      hiv: item.ceklab_report ? (item.ceklab_report.hiv ? "Ya" : "Tidak") : "-",
      hbsag: item.ceklab_report
        ? item.ceklab_report.hbsag
          ? "Ya"
          : "Tidak"
        : "-",
      sifilis: item.ceklab_report
        ? item.ceklab_report.sifilis
          ? "Ya"
          : "Tidak"
        : "-",
      verifier: item.verifier?.full_name || "-",
      catatan: item.catatan || "-",
    });
  });

  // Styling header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  return workbook;
};

/**
 * Export Persalinan to Excel
 */
export const exportPersalinanToExcel = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) {
    where.practice_place = { village_id: village_id };
  }

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
    where.tanggal_partus = { gte: startDate, lte: endDate };
  }

  const data = await prisma.persalinan.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      keadaan_ibu_persalinan: true,
      keadaan_bayi_persalinan: true,
      verifier: { select: { full_name: true } },
    },
    orderBy: { tanggal_partus: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Persalinan");

  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal Partus", key: "tanggal", width: 15 },
    { header: "Nama Pasien", key: "nama", width: 25 },
    { header: "NIK", key: "nik", width: 20 },
    { header: "Desa", key: "desa", width: 15 },
    { header: "G", key: "g", width: 5 },
    { header: "P", key: "p", width: 5 },
    { header: "A", key: "a", width: 5 },
    { header: "Vit K", key: "vit_k", width: 8 },
    { header: "HB 0", key: "hb_0", width: 8 },
    { header: "Ibu (HAP)", key: "hap", width: 10 },
    { header: "Ibu (Partus Lama)", key: "partus_lama", width: 15 },
    { header: "Ibu (Pre-Eklamsi)", key: "pre_eklamsi", width: 15 },
    { header: "Ibu (Hidup)", key: "ibu_hidup", width: 10 },
    { header: "Bayi (PB)", key: "pb", width: 10 },
    { header: "Bayi (BB)", key: "bb", width: 10 },
    { header: "Bayi (JK)", key: "jk", width: 15 },
    { header: "Bayi (Asfiksia)", key: "asfiksia", width: 15 },
    { header: "Bayi (Hidup)", key: "bayi_hidup", width: 10 },
    { header: "Diverifikasi Oleh", key: "verifier", width: 20 },
    { header: "Catatan", key: "catatan", width: 30 },
  ];

  data.forEach((item, index) => {
    worksheet.addRow({
      no: index + 1,
      tanggal: item.tanggal_partus.toLocaleDateString("id-ID"),
      nama: item.pasien.nama,
      nik: item.pasien.nik,
      desa: item.practice_place?.village?.nama_desa || "-",
      g: item.gravida,
      p: item.para,
      a: item.abortus,
      vit_k: item.vit_k ? "Ya" : "Tidak",
      hb_0: item.hb_0 ? "Ya" : "Tidak",
      hap: item.keadaan_ibu_persalinan?.hap ? "Ya" : "Tidak",
      partus_lama: item.keadaan_ibu_persalinan?.partus_lama ? "Ya" : "Tidak",
      pre_eklamsi: item.keadaan_ibu_persalinan?.pre_eklamsi ? "Ya" : "Tidak",
      ibu_hidup: item.keadaan_ibu_persalinan?.hidup ? "Ya" : "Tidak",
      pb: item.keadaan_bayi_persalinan?.pb || "-",
      bb: item.keadaan_bayi_persalinan?.bb || "-",
      jk: item.keadaan_bayi_persalinan?.jenis_kelamin || "-",
      asfiksia: item.keadaan_bayi_persalinan?.asfiksia ? "Ya" : "Tidak",
      bayi_hidup: item.keadaan_bayi_persalinan?.hidup ? "Ya" : "Tidak",
      verifier: item.verifier?.full_name || "-",
      catatan: item.catatan || "-",
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook;
};

/**
 * Export KB to Excel
 */
export const exportKeluargaBerencanaToExcel = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) {
    where.practice_place = { village_id: village_id };
  }

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
    where.tanggal_kunjungan = { gte: startDate, lte: endDate };
  }

  const data = await prisma.keluarga_berencana.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      verifier: { select: { full_name: true } },
    },
    orderBy: { tanggal_kunjungan: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data KB");

  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal", key: "tanggal", width: 15 },
    { header: "Nama Pasien", key: "nama", width: 25 },
    { header: "NIK", key: "nik", width: 20 },
    { header: "Desa", key: "desa", width: 15 },
    { header: "Jml Anak L", key: "laki", width: 10 },
    { header: "Jml Anak P", key: "perempuan", width: 10 },
    { header: "Abortus Terancam", key: "at", width: 15 },
    { header: "Metode KB", key: "metode", width: 15 },
    { header: "Diverifikasi Oleh", key: "verifier", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 30 },
  ];

  data.forEach((item, index) => {
    worksheet.addRow({
      no: index + 1,
      tanggal: item.tanggal_kunjungan.toLocaleDateString("id-ID"),
      nama: item.pasien.nama,
      nik: item.pasien.nik,
      desa: item.practice_place?.village?.nama_desa || "-",
      laki: item.jumlah_anak_laki,
      perempuan: item.jumlah_anak_perempuan,
      at: item.at ? "Ya" : "Tidak",
      metode: item.alat_kontrasepsi,
      verifier: item.verifier?.full_name || "-",
      keterangan: item.keterangan || "-",
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook;
};

/**
 * Export Imunisasi to Excel
 */
export const exportImunisasiToExcel = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) {
    where.practice_place = { village_id: village_id };
  }

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
    where.tgl_imunisasi = { gte: startDate, lte: endDate };
  }

  const data = await prisma.imunisasi.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      verifier: { select: { full_name: true } },
    },
    orderBy: { tgl_imunisasi: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Imunisasi");

  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Tanggal", key: "tanggal", width: 15 },
    { header: "Nama Bayi/Anak", key: "nama", width: 25 },
    { header: "NIK", key: "nik", width: 20 },
    { header: "Nama Orang Tua", key: "ortu", width: 25 },
    { header: "Desa", key: "desa", width: 15 },
    { header: "BB (kg)", key: "bb", width: 10 },
    { header: "Suhu (C)", key: "suhu", width: 10 },
    { header: "Jenis Imunisasi", key: "jenis", width: 15 },
    { header: "Diverifikasi Oleh", key: "verifier", width: 20 },
    { header: "Catatan", key: "catatan", width: 30 },
  ];

  data.forEach((item, index) => {
    worksheet.addRow({
      no: index + 1,
      tanggal: item.tgl_imunisasi.toLocaleDateString("id-ID"),
      nama: item.pasien.nama,
      nik: item.pasien.nik,
      ortu: item.nama_orangtua,
      desa: item.practice_place?.village?.nama_desa || "-",
      bb: item.berat_badan,
      suhu: item.suhu_badan || "-",
      jenis: item.jenis_imunisasi,
      verifier: item.verifier?.full_name || "-",
      catatan: item.catatan || "-",
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook;
};

/**
 * Export Pemeriksaan Kehamilan to PDF
 */
/**
 * Export Pemeriksaan Kehamilan to PDF (Lengkap)
 */
export const exportPemeriksaanKehamilanToPDF = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) where.practice_place = { village_id: village_id };
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
    where.tanggal = { gte: startDate, lte: endDate };
  }

  const data = await prisma.pemeriksaan_kehamilan.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      ceklab_report: true,
      verifier: { select: { full_name: true } },
    },
    orderBy: { tanggal: "asc" },
  });

  const doc = new PDFDocument({ margin: 20, size: "A4", layout: "landscape" });

  doc.fontSize(14).text("LAPORAN PEMERIKSAAN KEHAMILAN", { align: "center" });
  doc
    .fontSize(10)
    .text(`Periode: ${month || "-"}/${year || "-"}`, { align: "center" });
  doc.moveDown();

  const table = {
    headers: [
      "No",
      "Tgl",
      "Nama Pasien",
      "NIK",
      "Desa",
      "Usia",
      "GPA",
      "TD",
      "BB",
      "LILA",
      "HB",
      "GD",
      "HIV",
      "HBsAg",
      "Sif",
      "Verifier",
    ],
    rows: [],
  };

  data.forEach((item, index) => {
    table.rows.push([
      (index + 1).toString(),
      item.tanggal.toLocaleDateString("id-ID"),
      item.pasien.nama,
      item.pasien.nik,
      item.practice_place?.village?.nama_desa || "-",
      `${item.umur_kehamilan} Mgg`,
      item.gpa,
      item.td,
      item.bb ? `${item.bb}` : "-",
      item.lila ? `${item.lila}` : "-",
      item.ceklab_report?.hb ? item.ceklab_report.hb.toString() : "-",
      item.ceklab_report?.golongan_darah || "-",
      item.ceklab_report ? (item.ceklab_report.hiv ? "Pos" : "Neg") : "-",
      item.ceklab_report ? (item.ceklab_report.hbsag ? "Pos" : "Neg") : "-",
      item.ceklab_report ? (item.ceklab_report.sifilis ? "Pos" : "Neg") : "-",
      item.verifier?.full_name || "-",
    ]);
  });

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(7),
    prepareRow: () => doc.font("Helvetica").fontSize(6),
    width: 800,
    columnsSize: [
      20, 45, 80, 70, 60, 30, 40, 40, 25, 25, 25, 20, 25, 30, 25, 60,
    ],
  });

  doc.end();
  return doc;
};

/**
 * Export Persalinan to PDF
 */
export const exportPersalinanToPDF = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) where.practice_place = { village_id: village_id };
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
    where.tanggal_partus = { gte: startDate, lte: endDate };
  }

  const data = await prisma.persalinan.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      keadaan_ibu_persalinan: true,
      keadaan_bayi_persalinan: true,
      verifier: { select: { full_name: true } },
    },
    orderBy: { tanggal_partus: "asc" },
  });

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  doc.fontSize(16).text("LAPORAN PERSALINAN", { align: "center" });
  doc
    .fontSize(12)
    .text(`Periode: ${month || "-"}/${year || "-"}`, { align: "center" });
  doc.moveDown();

  const table = {
    headers: [
      "No",
      "Tgl",
      "Nama Pasien",
      "Desa",
      "G-P-A",
      "Kondisi Ibu",
      "Kondisi Bayi",
      "Verifier",
    ],
    rows: [],
  };

  data.forEach((item, index) => {
    // Format kondisi ibu
    let ibuCond = [];
    if (item.keadaan_ibu_persalinan?.hap) ibuCond.push("HAP");
    if (item.keadaan_ibu_persalinan?.partus_lama) ibuCond.push("Partus Lama");
    if (item.keadaan_ibu_persalinan?.pre_eklamsi) ibuCond.push("Pre-Eklamsi");
    const ibuStr = ibuCond.length > 0 ? ibuCond.join(", ") : "Sehat";

    // Format kondisi bayi
    let bayiCond = [];
    if (item.keadaan_bayi_persalinan?.asfiksia) bayiCond.push("Asfiksia");
    if (item.keadaan_bayi_persalinan?.cacat_bawaan) bayiCond.push("Cacat");
    const bayiStr = bayiCond.length > 0 ? bayiCond.join(", ") : "Sehat";

    table.rows.push([
      (index + 1).toString(),
      item.tanggal_partus.toLocaleDateString("id-ID"),
      item.pasien.nama,
      item.practice_place?.village?.nama_desa || "-",
      `${item.gravida}-${item.para}-${item.abortus}`,
      ibuStr,
      `${bayiStr} (${item.keadaan_bayi_persalinan?.bb || "-"} gr)`,
      item.verifier?.full_name || "-",
    ]);
  });

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: () => doc.font("Helvetica").fontSize(8),
  });

  doc.end();
  return doc;
};

/**
 * Export KB to PDF
 */
export const exportKeluargaBerencanaToPDF = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) where.practice_place = { village_id: village_id };
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
    where.tanggal_kunjungan = { gte: startDate, lte: endDate };
  }

  const data = await prisma.keluarga_berencana.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      verifier: { select: { full_name: true } },
    },
    orderBy: { tanggal_kunjungan: "asc" },
  });

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  doc.fontSize(16).text("LAPORAN KELUARGA BERENCANA", { align: "center" });
  doc
    .fontSize(12)
    .text(`Periode: ${month || "-"}/${year || "-"}`, { align: "center" });
  doc.moveDown();

  const table = {
    headers: [
      "No",
      "Tgl",
      "Nama Pasien",
      "Desa",
      "Anak (L/P)",
      "Metode KB",
      "Abortus Terancam",
      "Verifier",
    ],
    rows: [],
  };

  data.forEach((item, index) => {
    table.rows.push([
      (index + 1).toString(),
      item.tanggal_kunjungan.toLocaleDateString("id-ID"),
      item.pasien.nama,
      item.practice_place?.village?.nama_desa || "-",
      `${item.jumlah_anak_laki}/${item.jumlah_anak_perempuan}`,
      item.alat_kontrasepsi,
      item.at ? "Ya" : "Tidak",
      item.verifier?.full_name || "-",
    ]);
  });

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: () => doc.font("Helvetica").fontSize(8),
  });

  doc.end();
  return doc;
};

/**
 * Export Imunisasi to PDF
 */
export const exportImunisasiToPDF = async (filters) => {
  const { village_id, month, year } = filters;
  const where = { status_verifikasi: "APPROVED" };

  if (village_id) where.practice_place = { village_id: village_id };
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
    where.tgl_imunisasi = { gte: startDate, lte: endDate };
  }

  const data = await prisma.imunisasi.findMany({
    where,
    include: {
      pasien: true,
      practice_place: { include: { village: true } },
      verifier: { select: { full_name: true } },
    },
    orderBy: { tgl_imunisasi: "asc" },
  });

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  doc.fontSize(16).text("LAPORAN IMUNISASI", { align: "center" });
  doc
    .fontSize(12)
    .text(`Periode: ${month || "-"}/${year || "-"}`, { align: "center" });
  doc.moveDown();

  const table = {
    headers: [
      "No",
      "Tgl",
      "Nama Bayi/Anak",
      "Nama Ortu",
      "Desa",
      "BB (kg)",
      "Suhu",
      "Jenis Imunisasi",
      "Verifier",
    ],
    rows: [],
  };

  data.forEach((item, index) => {
    table.rows.push([
      (index + 1).toString(),
      item.tgl_imunisasi.toLocaleDateString("id-ID"),
      item.pasien.nama,
      item.nama_orangtua,
      item.practice_place?.village?.nama_desa || "-",
      item.berat_badan.toString(),
      item.suhu_badan ? item.suhu_badan.toString() : "-",
      item.jenis_imunisasi,
      item.verifier?.full_name || "-",
    ]);
  });

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: () => doc.font("Helvetica").fontSize(8),
  });

  doc.end();
  return doc;
};
