import * as reportService from "../services/report.service.js";

const getCurrentYear = () => new Date().getFullYear().toString();

const respondReportError = (res, error, fallbackMessage) => {
  res.status(error.statusCode || 500).json({
    success: false,
    message: fallbackMessage,
    error: error.message,
  });
};

const buildReportFilters = (req) => {
  const month = req.query.month ?? req.query.bulan;
  const yearInput = req.query.year ?? req.query.tahun;
  const year = month ? yearInput ?? getCurrentYear() : yearInput;

  return {
    village_id: req.query.village_id,
    month,
    year,
  };
};

/**
 * Export Pemeriksaan Kehamilan
 */
export const exportPemeriksaanKehamilan = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const workbook =
      await reportService.exportPemeriksaanKehamilanToExcel(filters, req.user);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        `laporan_kehamilan_${filters.month || "all"}_${filters.year || "all"}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    respondReportError(res, error, "Gagal mengekspor data ke Excel");
  }
};

/**
 * Export Persalinan
 */
export const exportPersalinan = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const workbook = await reportService.exportPersalinanToExcel(
      filters,
      req.user,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        `laporan_persalinan_${filters.month || "all"}_${filters.year || "all"}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    respondReportError(res, error, "Gagal mengekspor data Persalinan");
  }
};

/**
 * Export KB
 */
export const exportKeluargaBerencana = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const workbook =
      await reportService.exportKeluargaBerencanaToExcel(filters, req.user);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        `laporan_kb_${filters.month || "all"}_${filters.year || "all"}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    respondReportError(res, error, "Gagal mengekspor data KB");
  }
};

/**
 * Export Imunisasi
 */
export const exportImunisasi = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const workbook = await reportService.exportImunisasiToExcel(
      filters,
      req.user,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        `laporan_imunisasi_${filters.month || "all"}_${filters.year || "all"}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    respondReportError(res, error, "Gagal mengekspor data Imunisasi");
  }
};

/**
 * Export PDF: Pemeriksaan Kehamilan
 */
export const exportPemeriksaanKehamilanPDF = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const doc = await reportService.exportPemeriksaanKehamilanToPDF(
      filters,
      req.user,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_kehamilan_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    respondReportError(res, error, "Gagal membuat PDF Laporan Kehamilan");
  }
};

/**
 * Export PDF: Persalinan
 */
export const exportPersalinanPDF = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const doc = await reportService.exportPersalinanToPDF(filters, req.user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_persalinan_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    respondReportError(res, error, "Gagal membuat PDF Laporan Persalinan");
  }
};

/**
 * Export PDF: KB
 */
export const exportKeluargaBerencanaPDF = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const doc = await reportService.exportKeluargaBerencanaToPDF(
      filters,
      req.user,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_kb_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    respondReportError(res, error, "Gagal membuat PDF Laporan KB");
  }
};

/**
 * Export PDF: Imunisasi
 */
export const exportImunisasiPDF = async (req, res) => {
  try {
    const filters = buildReportFilters(req);

    const doc = await reportService.exportImunisasiToPDF(filters, req.user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_imunisasi_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    respondReportError(res, error, "Gagal membuat PDF Laporan Imunisasi");
  }
};
