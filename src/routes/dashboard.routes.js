import express from "express";
import {
  getPendingTasksController,
  getDashboardStatsController,
} from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware Auth
router.use(authenticateToken);

// GET /api/dashboard/pending-tasks
router.get("/dashboard/pending-tasks", getPendingTasksController);

// GET /api/dashboard/stats
router.get("/dashboard/stats", getDashboardStatsController);

export default router;
