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
  authorizePosition,
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
  validate(updateKeluargaBerencanaSchema),
  updateKeluargaBerencana,
);
router.delete(
  "/keluarga-berencana/:id",
  authenticateToken,
  deleteKeluargaBerencana,
);

// VERIFICATION: Only Bidan Desa / Koordinator
router.patch(
  "/keluarga-berencana/:id/verify",
  authenticateToken,
  authorizePosition("bidan_desa", "bidan_koordinator"),
  verifyKeluargaBerencana,
);

export default router;
