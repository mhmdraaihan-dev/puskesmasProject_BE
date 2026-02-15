import express from "express";
import {
  getAllPersalinan,
  getPersalinanById,
  createPersalinan,
  updatePersalinan,
  deletePersalinan,
  verifyPersalinan,
} from "../controllers/persalinan.controller.js";
import {
  authenticateToken,
  authorizePosition,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPersalinanSchema,
  updatePersalinanSchema,
} from "../validations/persalinan.validation.js";

const router = express.Router();

// CRUD Persalinan
router.post(
  "/persalinan",
  authenticateToken,
  validate(createPersalinanSchema),
  createPersalinan,
);
router.get("/persalinan", authenticateToken, getAllPersalinan);
router.get("/persalinan/:id", authenticateToken, getPersalinanById);
router.put(
  "/persalinan/:id",
  authenticateToken,
  validate(updatePersalinanSchema),
  updatePersalinan,
);
router.delete("/persalinan/:id", authenticateToken, deletePersalinan);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/persalinan/:id/verify",
  authenticateToken,
  authorizePosition("bidan_desa", "bidan_koordinator"),
  verifyPersalinan,
);

export default router;
