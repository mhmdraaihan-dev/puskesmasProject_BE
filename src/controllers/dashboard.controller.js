import {
  getPendingTasks,
  getBidanDesaHistory,
  getKoordinatorApprovedFeed,
  getDashboardStats,
} from "../services/dashboard.service.js";

// GET Dashboard Tasks (Verification List)
export const getPendingTasksController = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await getPendingTasks(userId, {
      limit: req.query.limit,
      module: req.query.module,
    });
    res.status(200).json({
      success: true,
      message: "Data tugas pending berhasil diambil",
      data: result.data,
      summary: result.summary,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBidanDesaHistoryController = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await getBidanDesaHistory(userId, {
      limit: req.query.limit,
      module: req.query.module,
      status: req.query.status,
    });

    res.status(200).json({
      success: true,
      message: "Data riwayat bidan desa berhasil diambil",
      data: result.data,
      summary: result.summary,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getKoordinatorApprovedFeedController = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await getKoordinatorApprovedFeed(userId, {
      limit: req.query.limit,
      module: req.query.module,
      village_id: req.query.village_id,
    });

    res.status(200).json({
      success: true,
      message: "Data approved feed koordinator berhasil diambil",
      data: result.data,
      summary: result.summary,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET Dashboard Stats (Accumulated Data)
export const getDashboardStatsController = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const stats = await getDashboardStats(userId);
    res.status(200).json({
      success: true,
      message: "Statistik dashboard berhasil diambil",
      data: stats,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
