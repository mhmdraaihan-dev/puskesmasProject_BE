import {
  getPendingTasks,
  getDashboardStats,
} from "../services/dashboard.service.js";

// GET Dashboard Tasks (Verification List)
export const getPendingTasksController = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tasks = await getPendingTasks(userId);
    res.status(200).json({
      success: true,
      message: "Data tugas pending berhasil diambil",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
