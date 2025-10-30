import "express";

import express from "express";
import "dotenv/config";
import { emailVerifyOTP, handleRegister, login, logout, SeedAdmin } from "../controllers/auth.controllers";
import { isAuthenticated } from "../middlewares/authMiddleware";
const router =express.Router();


//register and verify
router.post("/signup",handleRegister);
router.post("/otp-verification-email", emailVerifyOTP);


//login
router.post("/login",login);


//logout
router.post("/logout",isAuthenticated,logout)


//feed admin
router.post("/feedadmin", SeedAdmin);


export default  router;