import express from "express";
import {
  createVillageController,
  getAllVillagesController,
  getVillageByIdController,
  updateVillageController,
  deleteVillageController,
} from "../controllers/village.controller.js";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

const basePaths = ["/village", "/villages"];

for (const basePath of basePaths) {
  router.post(basePath, authorizeRole("ADMIN"), createVillageController);
  router.get(basePath, getAllVillagesController);
  router.get(`${basePath}/:village_id`, getVillageByIdController);
  router.put(
    `${basePath}/:village_id`,
    authorizeRole("ADMIN"),
    updateVillageController,
  );
  router.delete(
    `${basePath}/:village_id`,
    authorizeRole("ADMIN"),
    deleteVillageController,
  );
}

export default router;
