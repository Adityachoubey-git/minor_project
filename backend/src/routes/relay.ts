import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import { controlDevicesHandler, getAllCommandsHandler, getDeviceCommandHistoryHandler, getLiveDeviceStateHandler, getUserCommandHistoryHandler } from "../controllers/relay.controller";



const router = express.Router();

// 🔹 Get current live state from ESP32
router.post("/live-state", isAuthenticated, getLiveDeviceStateHandler);

// 🔹 Turn ON/OFF one or more devices
router.post("/control", isAuthenticated, controlDevicesHandler);

// 🔹 Get command history for one device
router.get("/history/device/:id", isAuthenticated, getDeviceCommandHistoryHandler);

// 🔹 Get command history for one user
router.get("/history/user/:id", isAuthenticated, getUserCommandHistoryHandler);

// 🔹 Admin-only – all commands
router.get("/history/all", isAuthenticated, getAllCommandsHandler);

router.get("/state", (req, res) => {
  res.json({ relay: { pin: 16, state: true } }); // example payload
});

export default router;
