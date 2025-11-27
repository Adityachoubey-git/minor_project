import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import { IsAdmin } from "../middlewares/IsAdmin";
import { getDevicesForGoodFeatureHandler, goodMorningHandler, goodNightHandler, updateGoodFeaturesHandler } from "../controllers/settings.controller";
const router = express.Router()
router.post("/features/good-morning", isAuthenticated, goodMorningHandler);
router.post("/features/good-night", isAuthenticated, goodNightHandler);

router.post(
  "/devices/settings/update-good-features",
  isAuthenticated,
  IsAdmin,
  updateGoodFeaturesHandler
);

router.get(
  "/devices/gm-gn/list",
  isAuthenticated,
  IsAdmin,
  getDevicesForGoodFeatureHandler
);
export default router;