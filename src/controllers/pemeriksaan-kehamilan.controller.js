import * as pemeriksaanKehamilanService from "../services/pemeriksaan-kehamilan.service.js";
import prisma from "../../lib/prisma.js";

/**
 * Get all pemeriksaan kehamilan
 */
export const getAllPemeriksaanKehamilan = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      village_id: req.query.village_id,
      practice_id: req.query.practice_id,
      pasien_id: req.query.pasien_id,
      tanggal_start: req.query.tanggal_start,
      tanggal_end: req.query.tanggal_end,
      resti: req.query.resti,
      search: req.query.search,
      status_verifikasi: req.query.status_verifikasi,
      month: req.query.month,
      year: req.query.year,
    };

    const result = await pemeriksaanKehamilanService.getAllPemeriksaanKehamilan(
      filters,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data pemeriksaan kehamilan berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pemeriksaan kehamilan",
      error: error.message,
    });
  }
};

/**
 * Get pemeriksaan kehamilan by ID
 */
export const getPemeriksaanKehamilanById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pemeriksaanKehamilanService.getPemeriksaanKehamilanById(
      id,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data pemeriksaan kehamilan berhasil diambil",
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("tidak ditemukan") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new pemeriksaan kehamilan
 */
export const createPemeriksaanKehamilan = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.position_user;

    // Jika user adalah Bidan Praktik, otomatis ambil practice_id miliknya
    if (userRole === "bidan_praktik") {
      const currentUser = await prisma.user.findUnique({
        where: { user_id: userId },
        include: { practice_place: true },
      });
      const practicePlace = currentUser?.practice_place;

      if (!practicePlace) {
        return res.status(400).json({
          success: false,
          message: "Anda belum memiliki data Tempat Praktik. Hubungi Admin.",
        });
      }

      req.body.practice_id = practicePlace.practice_id;
    }

    const data = await pemeriksaanKehamilanService.createPemeriksaanKehamilan(
      req.body,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: "Data pemeriksaan kehamilan berhasil dibuat",
      data,
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.message.includes("tidak ditemukan") ? 404 : 400);
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update pemeriksaan kehamilan
 */
export const updatePemeriksaanKehamilan = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pemeriksaanKehamilanService.updatePemeriksaanKehamilan(
      id,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data pemeriksaan kehamilan berhasil diupdate",
      data,
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.message.includes("tidak ditemukan") ? 404 : 400);
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete pemeriksaan kehamilan
 */
export const deletePemeriksaanKehamilan = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pemeriksaanKehamilanService.deletePemeriksaanKehamilan(
      id,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.message.includes("tidak ditemukan") ? 404 : 400);
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify / Approve / Reject Pemeriksaan Kehamilan
 */
export const verifyPemeriksaanKehamilan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan } = req.body; // status: 'APPROVED' | 'REJECTED'
    const verifierId = req.user.user_id;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus APPROVED atau REJECTED",
      });
    }

    const data = await pemeriksaanKehamilanService.verifyPemeriksaanKehamilan(
      id,
      { status, alasan },
      req.user,
    );

    res.status(200).json({
      success: true,
      message: `Data pemeriksaan berhasil di-${status.toLowerCase()}`,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("tidak ditemukan") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
