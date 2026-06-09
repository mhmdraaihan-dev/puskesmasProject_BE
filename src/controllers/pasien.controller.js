import * as pasienService from "../services/pasien.service.js";
import prisma from "../../lib/prisma.js";

/**
 * Get all pasien
 */
export const getAllPasien = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    };

    const result = await pasienService.getAllPasien(filters, req.user);

    res.status(200).json({
      success: true,
      message: "Data pasien berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pasien",
      error: error.message,
    });
  }
};

/**
 * Get pasien by ID
 */
export const getPasienById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pasienService.getPasienById(id, req.user);

    res.status(200).json({
      success: true,
      message: "Data pasien berhasil diambil",
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
 * Create new pasien
 */
export const createPasien = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.position_user;

    // Jika user adalah Bidan Praktik, otomatis ambil village_id dari tempat praktiknya
    if (userRole === "bidan_praktik") {
      const currentUser = await prisma.user.findUnique({
        where: { user_id: userId },
        include: { practice_place: true },
      });
      const practicePlace = currentUser?.practice_place;

      if (practicePlace) {
        req.body.village_id = practicePlace.village_id;
      }
    } else if (userRole === "bidan_desa") {
      // Jika Bidan Desa, ambil village_id dari profil user
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });
      if (user) {
        req.body.village_id = user.village_id;
      }
    }

    const data = await pasienService.createPasien(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Pasien berhasil dibuat",
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("sudah terdaftar") ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update pasien
 */
export const updatePasien = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pasienService.updatePasien(id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Pasien berhasil diupdate",
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
 * Delete pasien
 */
export const deletePasien = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pasienService.deletePasien(id, req.user);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.message.includes("tidak ditemukan") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
