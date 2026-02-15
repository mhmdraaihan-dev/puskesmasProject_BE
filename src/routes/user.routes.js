import { Router } from "express";
import {
  createUserController,
  getUserController,
  getUserByIdController,
  updateUserStatusController,
  updateUserController,
  changePasswordController,
  resetPasswordByAdminController,
} from "../controllers/user.controller.js";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Semua endpoint user perlu Login
router.use(authenticateToken);

// 1. GET Users: Boleh semua user login (untuk dropdown/list)
router.get("/users", getUserController);

// GET User by ID: Boleh user login (bisa cek profile sendiri)
router.get("/users/:user_id", getUserByIdController);

// 2. Change Own Password: Boleh user ybs (TODO: Tambah validasi ID user = ID login di controller/middleware)
// Saat ini kita izinkan authenticated user akses, nanti logic controller yang handle security
router.patch("/users/:user_id/password", changePasswordController);

// 3. Update Own Profile: Boleh user ybs
router.put("/users/:user_id", updateUserController);

// --- ADMIN ONLY ROUTES ---

// Create User
router.post("/users", authorizeRole("ADMIN"), createUserController);

// Update Status (Activate/Deactivate)
router.patch(
  "/users/:user_id/status",
  authorizeRole("ADMIN"),
  updateUserStatusController,
);

// Reset Password by Admin
router.post(
  "/users/:user_id/reset-password",
  authorizeRole("ADMIN"),
  resetPasswordByAdminController,
);

export default router;
