import express from "express";
import {
  getAllImunisasi,
  getImunisasiById,
  createImunisasi,
  updateImunisasi,
  deleteImunisasi,
  verifyImunisasi,
} from "../controllers/imunisasi.controller.js";
import {
  authenticateToken,
  authorizePosition,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createImunisasiSchema,
  updateImunisasiSchema,
} from "../validations/imunisasi.validation.js";

const router = express.Router();

// CRUD Imunisasi
router.post(
  "/imunisasi",
  authenticateToken,
  validate(createImunisasiSchema),
  createImunisasi,
);
router.get("/imunisasi", authenticateToken, getAllImunisasi);
router.get("/imunisasi/:id", authenticateToken, getImunisasiById);
router.put(
  "/imunisasi/:id",
  authenticateToken,
  validate(updateImunisasiSchema),
  updateImunisasi,
);
router.delete("/imunisasi/:id", authenticateToken, deleteImunisasi);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/imunisasi/:id/verify",
  authenticateToken,
  authorizePosition("bidan_desa", "bidan_koordinator"),
  verifyImunisasi,
);

export default router;
