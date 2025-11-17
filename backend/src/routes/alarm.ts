import express from "express"
import { isAuthenticated } from "../middlewares/authMiddleware"
import { createAlarmHandler, processAlarmsHandler } from "../controllers/alram.controllers"


const router = express.Router()

// User creates an alarm
router.post("/create", isAuthenticated, createAlarmHandler)

// Admin cron or manual trigger
router.post("/process", processAlarmsHandler)

export default router
