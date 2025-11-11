import "express";

import express from "express";
import "dotenv/config";
import { emailVerifyOTP, handleForgotPassword, handleGetUserProfile, handleRegister, hanldeResetPassword, login, logout, resendEmailOTP, SeedAdmin } from "../controllers/auth.controllers";
import { isAuthenticated } from "../middlewares/authMiddleware";
const router =express.Router();


//register and verify
router.post("/signup",handleRegister);
router.post("/otp-verification-email", emailVerifyOTP);
router.post("/forgot-password",handleForgotPassword);
router.post("/reset-password",hanldeResetPassword);
router.post("/resend-otp", resendEmailOTP)         

router.get('/get_user_profile',isAuthenticated,handleGetUserProfile);
//login
router.post("/login",login);


//logout
router.post("/logout",isAuthenticated,logout)


//feed admin
router.post("/feedadmin", SeedAdmin);



export default  router;