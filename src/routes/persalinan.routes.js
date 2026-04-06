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
  authorizePelayananMutation,
  authorizePelayananVerification,
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
  authorizePelayananMutation,
  validate(createPersalinanSchema),
  createPersalinan,
);
router.get("/persalinan", authenticateToken, getAllPersalinan);
router.get("/persalinan/:id", authenticateToken, getPersalinanById);
router.put(
  "/persalinan/:id",
  authenticateToken,
  authorizePelayananMutation,
  validate(updatePersalinanSchema),
  updatePersalinan,
);
router.delete(
  "/persalinan/:id",
  authenticateToken,
  authorizePelayananMutation,
  deletePersalinan,
);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/persalinan/:id/verify",
  authenticateToken,
  authorizePelayananVerification,
  verifyPersalinan,
);

export default router;
