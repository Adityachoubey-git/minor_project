import express from "express"
import { isAuthenticated } from "../middlewares/authMiddleware"
import { createAlarmHandler, deleteAlarmHandler, getAlarmsHandler, getSingleAlarmHandler, processAlarmsHandler, toggleAlarmEnabledHandler } from "../controllers/alram.controllers"


const router = express.Router()

// User creates an alarm
router.post("/create", isAuthenticated, createAlarmHandler)

// Admin cron or manual trigger
router.post("/process", processAlarmsHandler)
// List alarms
router.get("/list", isAuthenticated, getAlarmsHandler)

// Get single alarm
router.get("/:id", isAuthenticated, getSingleAlarmHandler)

// Toggle alarm enabled/disabled
router.patch("/:id/enabled", isAuthenticated, toggleAlarmEnabledHandler)

// Optional: delete alarm
router.delete("/:id", isAuthenticated, deleteAlarmHandler)

export default router
