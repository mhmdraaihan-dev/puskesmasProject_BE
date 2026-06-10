import express from "express";
import {
  loginController,
  getProfileController,
  logoutController,
  updateProfileController,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", loginController);

// Protected routes (perlu autentikasi)
router.post("/logout", authenticateToken, logoutController);
router.get("/profile", authenticateToken, getProfileController);
router.put("/profile", authenticateToken, updateProfileController);

export default router;
