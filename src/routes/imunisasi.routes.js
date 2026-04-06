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
  authorizePelayananMutation,
  authorizePelayananVerification,
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
  authorizePelayananMutation,
  validate(createImunisasiSchema),
  createImunisasi,
);
router.get("/imunisasi", authenticateToken, getAllImunisasi);
router.get("/imunisasi/:id", authenticateToken, getImunisasiById);
router.put(
  "/imunisasi/:id",
  authenticateToken,
  authorizePelayananMutation,
  validate(updateImunisasiSchema),
  updateImunisasi,
);
router.delete(
  "/imunisasi/:id",
  authenticateToken,
  authorizePelayananMutation,
  deleteImunisasi,
);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/imunisasi/:id/verify",
  authenticateToken,
  authorizePelayananVerification,
  verifyImunisasi,
);

export default router;
