import express from "express";
import {
  getAllKeluargaBerencana,
  getKeluargaBerencanaById,
  createKeluargaBerencana,
  updateKeluargaBerencana,
  deleteKeluargaBerencana,
  verifyKeluargaBerencana,
} from "../controllers/keluarga-berencana.controller.js";
import {
  authenticateToken,
  authorizePelayananMutation,
  authorizePelayananVerification,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createKeluargaBerencanaSchema,
  updateKeluargaBerencanaSchema,
} from "../validations/keluarga-berencana.validation.js";

const router = express.Router();

// CRUD Keluarga Berencana
router.post(
  "/keluarga-berencana",
  authenticateToken,
  authorizePelayananMutation,
  validate(createKeluargaBerencanaSchema),
  createKeluargaBerencana,
);
router.get("/keluarga-berencana", authenticateToken, getAllKeluargaBerencana);
router.get(
  "/keluarga-berencana/:id",
  authenticateToken,
  getKeluargaBerencanaById,
);
router.put(
  "/keluarga-berencana/:id",
  authenticateToken,
  authorizePelayananMutation,
  validate(updateKeluargaBerencanaSchema),
  updateKeluargaBerencana,
);
router.delete(
  "/keluarga-berencana/:id",
  authenticateToken,
  authorizePelayananMutation,
  deleteKeluargaBerencana,
);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/keluarga-berencana/:id/verify",
  authenticateToken,
  authorizePelayananVerification,
  verifyKeluargaBerencana,
);

export default router;
