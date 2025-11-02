// routes/labRoutes.ts
import express from "express";
 
import { isAuthenticated } from "../middlewares/authMiddleware";
import { IsAdmin } from "../middlewares/IsAdmin";
import { createLabHandler, deleteLabHandler, editLabHandler, getLabsHandler } from "../controllers/lab.controller";


const router = express.Router();

router.post("/create", isAuthenticated,IsAdmin, createLabHandler);
router.put("/labEdit/:id", isAuthenticated,IsAdmin, editLabHandler);
router.delete("/delete/:id", isAuthenticated,IsAdmin, deleteLabHandler);
router.get("/get",isAuthenticated, getLabsHandler);


export default router;
