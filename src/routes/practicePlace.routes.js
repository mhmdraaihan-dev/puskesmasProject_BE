import express from "express";
import {
  createPracticePlaceController,
  getAllPracticePlacesController,
  getPracticePlacesByVillageController,
  getPracticePlaceByIdController,
  updatePracticePlaceController,
  deletePracticePlaceController,
} from "../controllers/practicePlace.controller.js";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

const basePaths = ["/practice-place", "/practice-places"];

for (const basePath of basePaths) {
  router.post(basePath, authorizeRole("ADMIN"), createPracticePlaceController);
  router.get(basePath, getAllPracticePlacesController);
  router.get(
    `${basePath}/village/:village_id`,
    getPracticePlacesByVillageController,
  );
  router.get(`${basePath}/:practice_id`, getPracticePlaceByIdController);
  router.put(
    `${basePath}/:practice_id`,
    authorizeRole("ADMIN"),
    updatePracticePlaceController,
  );
  router.delete(
    `${basePath}/:practice_id`,
    authorizeRole("ADMIN"),
    deletePracticePlaceController,
  );
}

export default router;
