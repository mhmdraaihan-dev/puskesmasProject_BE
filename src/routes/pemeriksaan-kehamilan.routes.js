import express from "express";
import {
  getAllPemeriksaanKehamilan,
  getPemeriksaanKehamilanById,
  createPemeriksaanKehamilan,
  updatePemeriksaanKehamilan,
  deletePemeriksaanKehamilan,
  verifyPemeriksaanKehamilan,
} from "../controllers/pemeriksaan-kehamilan.controller.js";
import {
  authenticateToken,
  authorizePelayananMutation,
  authorizePelayananVerification,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPemeriksaanKehamilanSchema,
  updatePemeriksaanKehamilanSchema,
} from "../validations/pemeriksaan-kehamilan.validation.js";

const router = express.Router();

// CRUD Pemeriksaan Kehamilan
// Bidan praktik hanya bisa akses data mereka sendiri (logic di controller)
router.post(
  "/pemeriksaan-kehamilan",
  authenticateToken,
  authorizePelayananMutation,
  validate(createPemeriksaanKehamilanSchema),
  createPemeriksaanKehamilan,
);
router.get(
  "/pemeriksaan-kehamilan",
  authenticateToken,
  getAllPemeriksaanKehamilan,
);
router.get(
  "/pemeriksaan-kehamilan/:id",
  authenticateToken,
  getPemeriksaanKehamilanById,
);
router.put(
  "/pemeriksaan-kehamilan/:id",
  authenticateToken,
  authorizePelayananMutation,
  validate(updatePemeriksaanKehamilanSchema),
  updatePemeriksaanKehamilan,
);
router.delete(
  "/pemeriksaan-kehamilan/:id",
  authenticateToken,
  authorizePelayananMutation,
  deletePemeriksaanKehamilan,
);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/pemeriksaan-kehamilan/:id/verify",
  authenticateToken,
  authorizePelayananVerification,
  verifyPemeriksaanKehamilan,
);

export default router;
