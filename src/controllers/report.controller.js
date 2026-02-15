import * as reportService from "../services/report.service.js";

/**
 * Export Pemeriksaan Kehamilan
 */
export const exportPemeriksaanKehamilan = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const workbook =
      await reportService.exportPemeriksaanKehamilanToExcel(filters);

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
    res.status(500).json({
      success: false,
      message: "Gagal mengekspor data ke Excel",
      error: error.message,
    });
  }
};

/**
 * Export Persalinan
 */
export const exportPersalinan = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const workbook = await reportService.exportPersalinanToExcel(filters);

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
    res.status(500).json({
      success: false,
      message: "Gagal mengekspor data Persalinan",
      error: error.message,
    });
  }
};

/**
 * Export KB
 */
export const exportKeluargaBerencana = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const workbook =
      await reportService.exportKeluargaBerencanaToExcel(filters);

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
    res.status(500).json({
      success: false,
      message: "Gagal mengekspor data KB",
      error: error.message,
    });
  }
};

/**
 * Export Imunisasi
 */
export const exportImunisasi = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const workbook = await reportService.exportImunisasiToExcel(filters);

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
    res.status(500).json({
      success: false,
      message: "Gagal mengekspor data Imunisasi",
      error: error.message,
    });
  }
};

/**
 * Export PDF: Pemeriksaan Kehamilan
 */
export const exportPemeriksaanKehamilanPDF = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const doc = await reportService.exportPemeriksaanKehamilanToPDF(filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_kehamilan_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF Laporan Kehamilan",
      error: error.message,
    });
  }
};

/**
 * Export PDF: Persalinan
 */
export const exportPersalinanPDF = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const doc = await reportService.exportPersalinanToPDF(filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_persalinan_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF Laporan Persalinan",
      error: error.message,
    });
  }
};

/**
 * Export PDF: KB
 */
export const exportKeluargaBerencanaPDF = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const doc = await reportService.exportKeluargaBerencanaToPDF(filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_kb_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF Laporan KB",
      error: error.message,
    });
  }
};

/**
 * Export PDF: Imunisasi
 */
export const exportImunisasiPDF = async (req, res) => {
  try {
    const filters = {
      village_id: req.query.village_id,
      month: req.query.month,
      year: req.query.year,
    };

    const doc = await reportService.exportImunisasiToPDF(filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_imunisasi_${filters.month || "all"}_${filters.year || "all"}.pdf`,
    );

    doc.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF Laporan Imunisasi",
      error: error.message,
    });
  }
};
