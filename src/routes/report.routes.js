import express from "express";
import {
  exportPemeriksaanKehamilan,
  exportPersalinan,
  exportKeluargaBerencana,
  exportImunisasi,
  exportPemeriksaanKehamilanPDF,
  exportPersalinanPDF,
  exportKeluargaBerencanaPDF,
  exportImunisasiPDF,
} from "../controllers/report.controller.js";
import {
  authenticateToken,
  authorizePosition,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware Auth
router.use(authenticateToken);

// Hanya Bidan Koordinator dan Admin yang bisa ekspor laporan global
router.get(
  "/reports/pemeriksaan-kehamilan/export",
  authorizePosition("bidan_koordinator", "admin"),
  exportPemeriksaanKehamilan,
);

router.get(
  "/reports/pemeriksaan-kehamilan/export-pdf",
  authorizePosition("bidan_koordinator", "admin"),
  exportPemeriksaanKehamilanPDF,
);

router.get(
  "/reports/persalinan/export",
  authorizePosition("bidan_koordinator", "admin"),
  exportPersalinan,
);

router.get(
  "/reports/keluarga-berencana/export",
  authorizePosition("bidan_koordinator", "admin"),
  exportKeluargaBerencana,
);

router.get(
  "/reports/imunisasi/export",
  authorizePosition("bidan_koordinator", "admin"),
  exportImunisasi,
);

router.get(
  "/reports/persalinan/export-pdf",
  authorizePosition("bidan_koordinator", "admin"),
  exportPersalinanPDF,
);

router.get(
  "/reports/keluarga-berencana/export-pdf",
  authorizePosition("bidan_koordinator", "admin"),
  exportKeluargaBerencanaPDF,
);

router.get(
  "/reports/imunisasi/export-pdf",
  authorizePosition("bidan_koordinator", "admin"),
  exportImunisasiPDF,
);

export default router;
