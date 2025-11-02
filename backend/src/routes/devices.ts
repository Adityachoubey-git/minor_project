import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware";
import { createDeviceHandler, deleteDeviceHandler, editDeviceHandler, getDevicesHandler } from "../controllers/devices.controller";
import { IsAdmin } from "../middlewares/IsAdmin";


const router = express.Router();

// POST /device/create
router.post("/create", isAuthenticated,IsAdmin,createDeviceHandler);

router.put("/deviceEdit/:id", isAuthenticated,IsAdmin, editDeviceHandler);
router.delete("/deviceDelete/:id", isAuthenticated,IsAdmin, deleteDeviceHandler);
router.get("/get",isAuthenticated, getDevicesHandler);



export default router;
