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
  authorizeRoleOrPosition,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware Auth
router.use(authenticateToken);

// Hanya Bidan Koordinator dan Admin yang bisa ekspor laporan global
router.get(
  "/reports/pemeriksaan-kehamilan/export",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportPemeriksaanKehamilan,
);

router.get(
  "/reports/pemeriksaan-kehamilan/export-pdf",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportPemeriksaanKehamilanPDF,
);

router.get(
  "/reports/persalinan/export",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportPersalinan,
);

router.get(
  "/reports/keluarga-berencana/export",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportKeluargaBerencana,
);

router.get(
  "/reports/imunisasi/export",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportImunisasi,
);

router.get(
  "/reports/persalinan/export-pdf",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportPersalinanPDF,
);

router.get(
  "/reports/keluarga-berencana/export-pdf",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportKeluargaBerencanaPDF,
);

router.get(
  "/reports/imunisasi/export-pdf",
  authorizeRoleOrPosition({
    roles: ["ADMIN"],
    positions: ["bidan_koordinator", "bidan_desa"],
  }),
  exportImunisasiPDF,
);

export default router;
