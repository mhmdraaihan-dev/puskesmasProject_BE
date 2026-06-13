import {
  createHealthDataService,
  getAllHealthDataService,
  getHealthDataByIdService,
  updateHealthDataService,
  reviseHealthDataService,
  deleteHealthDataService,
  approveHealthDataService,
  rejectHealthDataService,
  getPendingHealthDataService,
  getRejectedHealthDataService,
} from "../services/healthData.service.js";
import { normalizePelayananListFilters } from "../utils/pelayanan-filter.util.js";

export const createHealthDataController = async (req, res) => {
  try {
    // user_id sudah dijamin ada dari middleware authenticateToken
    const user_id = req.user.user_id;

    const newHealthData = await createHealthDataService(req.body, user_id);
    res.status(201).json({
      success: true,
      message: "Data kesehatan berhasil dibuat",
      data: newHealthData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const filters = {
      status_verifikasi: req.query.status_verifikasi,
      jenis_data: req.query.jenis_data,
    };

    const healthData = await getAllHealthDataService(user_id, filters);
    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHealthDataByIdController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;

    const healthData = await getHealthDataByIdService(data_id, user_id);
    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;

    const updatedData = await updateHealthDataService(
      data_id,
      req.body,
      user_id,
    );
    res.status(200).json({
      success: true,
      message: "Data kesehatan berhasil diupdate",
      data: updatedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reviseHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;

    const revisedData = await reviseHealthDataService(
      data_id,
      req.body,
      user_id,
    );
    res.status(200).json({
      success: true,
      message: "Data kesehatan berhasil direvisi dan kembali ke status PENDING",
      data: revisedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;

    const result = await deleteHealthDataService(data_id, user_id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;

    const approvedData = await approveHealthDataService(data_id, user_id);
    res.status(200).json({
      success: true,
      message: "Data kesehatan berhasil disetujui",
      data: approvedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { data_id } = req.params;
    const { alasan_penolakan } = req.body;

    const rejectedData = await rejectHealthDataService(
      data_id,
      alasan_penolakan,
      user_id,
    );
    res.status(200).json({
      success: true,
      message: "Data kesehatan berhasil ditolak",
      data: rejectedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const pendingData = await getPendingHealthDataService(user_id);
    res.status(200).json({
      success: true,
      data: pendingData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRejectedHealthDataController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const filters = normalizePelayananListFilters(req.query, {
      module: req.query.module,
    });

    const rejectedData = await getRejectedHealthDataService(user_id, filters);
    res.status(200).json({
      success: true,
      data: rejectedData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
