import * as keluargaBerencanaService from "../services/keluarga-berencana.service.js";
import prisma from "../../lib/prisma.js";

/**
 * Get all keluarga berencana
 */
export const getAllKeluargaBerencana = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      village_id: req.query.village_id,
      practice_id: req.query.practice_id,
      pasien_id: req.query.pasien_id,
      tanggal_start: req.query.tanggal_start,
      tanggal_end: req.query.tanggal_end,
      search: req.query.search,
      status_verifikasi: req.query.status_verifikasi,
      month: req.query.month,
      year: req.query.year,
    };

    const result = await keluargaBerencanaService.getAllKeluargaBerencana(
      filters,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data keluarga berencana berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data keluarga berencana",
      error: error.message,
    });
  }
};

/**
 * Get keluarga berencana by ID
 */
export const getKeluargaBerencanaById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await keluargaBerencanaService.getKeluargaBerencanaById(
      id,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data keluarga berencana berhasil diambil",
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
 * Create new keluarga berencana
 */
export const createKeluargaBerencana = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.position_user;

    // Jika user adalah Bidan Praktik, otomatis ambil practice_id miliknya
    if (userRole === "bidan_praktik") {
      const practicePlace = await prisma.practice_place.findUnique({
        where: { user_id: userId },
      });

      if (!practicePlace) {
        return res.status(400).json({
          success: false,
          message: "Anda belum memiliki data Tempat Praktik. Hubungi Admin.",
        });
      }

      req.body.practice_id = practicePlace.practice_id;
    }

    const data = await keluargaBerencanaService.createKeluargaBerencana(
      req.body,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: "Data keluarga berencana berhasil dibuat",
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

/**
 * Update keluarga berencana
 */
export const updateKeluargaBerencana = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const data = await keluargaBerencanaService.updateKeluargaBerencana(
      id,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Data keluarga berencana berhasil diupdate",
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

/**
 * Delete keluarga berencana
 */
export const deleteKeluargaBerencana = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await keluargaBerencanaService.deleteKeluargaBerencana(
      id,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: result.message,
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
 * Verify / Approve / Reject Keluarga Berencana
 */
export const verifyKeluargaBerencana = async (req, res) => {
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

    const data = await keluargaBerencanaService.verifyKeluargaBerencana(
      id,
      { status, alasan },
      req.user,
    );

    res.status(200).json({
      success: true,
      message: `Data keluarga berencana berhasil di-${status.toLowerCase()}`,
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
