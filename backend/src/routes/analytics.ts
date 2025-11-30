import { Router } from "express"
import { isAuthenticated } from "../middlewares/authMiddleware"
import { getUsageAnalyticsHandler } from "../controllers/analytic.controller"


const router = Router()

router.get("/usage", isAuthenticated, getUsageAnalyticsHandler)

export default router
