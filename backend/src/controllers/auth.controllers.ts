import bcrypt from "bcryptjs";

import { NextFunction,Request,Response } from "express";

import ErrorHandler from "../middlewares/error";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import prisma from "../db/db";
import { createAdmin, createUser, findAdmin, findUserByEmail, isUserEmailVerified, saveEmailVerificationCode, updateNewPassword, updateTokenandExpiry, userEmailExists } from "../repository/auth.repo";
import { sendToken } from "../utils/SendToken";
import { generateEmailTemplate } from "../utils/EmailTemplate";
import { sendEmail } from "../utils/SendEmail";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
dotenv.config();
const frontendURL = process.env.FRONTEND_BASE_URL;



//Generating Verification code 
const generateVerificationCode = () => {
  return Math.floor(10000 + Math.random() * 90000); // 5 digit random number
};

//sending email Verification Code
const sendEmailVerificationCode = async (
  email: string,
  verificationCode: string
) => {
  console.log("Sending Mail", verificationCode);

  const message = generateEmailTemplate(verificationCode);
  const subject = "Verification Code";
  console.log("otp",verificationCode);
  try {
    await sendEmail(email, subject, message);
    console.log("mail sent ")
  } // inside sendEmailVerificationCode
catch (err) {
  console.log("Email could not be sent", err)
  throw new ErrorHandler("Email could not be sent", 500)
}
};


//hash pass
export const hashpass = async (password: string) => {
  const pass = await bcrypt.hash(password, 10);
  return pass;
};

//compare password
const comparePassword = async (password: string, hash: string) => {
  const pass = await bcrypt.compare(password, hash);
  return pass;
};

//email verify otp
export const emailVerifyOTP = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { otp, user_id } = req.body;

    if (!otp || !user_id) {
      return next(new ErrorHandler("Please provide OTP and user ID.", 400));
    }

    try {
      // Fetch user from DB
      const user = await prisma.user.findUnique({
        where: { id: parseInt(user_id) },
      });

      if (!user) {
        return next(new ErrorHandler("User not found.", 404));
      }

      if (user.role === "ADMIN") {
        return next(new ErrorHandler("OTP verification not required for admin.", 400));
      }

      if (user.emailverified) {
  res.status(200).json({ success: true, message: "Email already verified." });
  return; 
}

      if (user.emailverificationCode !== otp) {
        console.log("Expected:", user.emailverificationCode, "Received:", otp);
        return next(new ErrorHandler("Invalid OTP.", 400));
      }

      // Check expiration safely
      if (!user.verificationCodeExpire) {
        return next(new ErrorHandler("OTP expiration not set.", 400));
      }

      const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();
      if (Date.now() > verificationCodeExpire) {
        return next(new ErrorHandler("OTP expired.", 400));
      }

      //Update user as verified 
      await prisma.user.update({
        where: { id: parseInt(user_id) },
        data: {
          emailverified: true,
          emailverificationCode: null,     
          verificationCodeExpire: null,
          
        },
      });

      // Send JWT token
      sendToken(user, 200, "Email Account Verified.", res);
      
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler("Internal Server Error.", 500));
    }
  }
);



//Register User Handler
export const handleRegister = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {

      try {
      const {
        name,
        email:emailP,
        password,
        role,
        Idnumber
   
       
      } = req.body;

      const email = emailP.toLowerCase();
      
      if (
        !name ||
        !email ||
        !password||
        !Idnumber||
        !role
     
      ) {
        next(new ErrorHandler("Please provide all the required fields", 400));
        return;
      }
      const exUser = await userEmailExists(email);
      if (exUser) {
        next(new ErrorHandler("User already exists", 400));
        return;
      }

      const hashedPassword = await hashpass(password);
      const emailverificationCode = generateVerificationCode().toString();
      const verificationCodeExpire = Date.now() + 24 * 60 * 60 * 1000;

      const user = await createUser(
                      name,
                      email,
                      Idnumber,
                      role,
                      hashedPassword,
                      emailverificationCode,
                      verificationCodeExpire.toString()

      );

      await sendEmailVerificationCode(email, emailverificationCode);
      console.log("email verification code",emailverificationCode);
     
      res.status(201).json({
        success: true,
        message: "User Registered  successfully",
        user,
      });
    } catch (err) {
      console.log(err);
      next(new ErrorHandler("Something went wrong", 500));
      return;
    }
  
  })





//login user
export const login = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return next(new ErrorHandler("email and password are required.", 400));
    }
    const isUserExist = await userEmailExists(email);

    if (!isUserExist) {
      return next(new ErrorHandler("invalid email or password", 400));
    }

    const isPasswordMatched = await comparePassword(
      password,
      isUserExist.password
    );
    if (!isPasswordMatched) {
      return next(new ErrorHandler("invalid email or password", 400));
    }

    if (isUserExist.emailverified != true) {
      res.status(401).json({
        success: false,
        message: "OTP verification required. Please verify your account.",
        user_id: isUserExist.id,
        email: isUserExist.email,
       
        emailVerified: false,
      });
      return;
    }

    sendToken(isUserExist, 200, "User logged in successfully.", res);
  }
);
//feed admin 
export const SeedAdmin = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, email,password ,IdNumber} = req.body;
        if (!name || !email || !IdNumber ) {
            res.status(400).json({ error: 'fields are required' });
            return;
        }

        try {
            const adminExist = await findAdmin();
            if (adminExist.length > 0) {
                res.status(400).json({ error: 'Admin already exist' });
                return;
            }
            const newAdmin = await createAdmin( name, email,password,IdNumber);
            res.status(201).json(newAdmin);
        } catch (error) {
            console.log(error);
            return next(new ErrorHandler("Internal Server Error.", 500));
        }
    })

//logout
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});
export const handleGetUserProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return next(new ErrorHandler("User not found.", 401));
      }

      // This new query explicitly selects all the fields your frontend needs, including rfid.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          IDnumber: true,
          role: true,
         
          
          verificationCodeExpire: true,
          emailverificationCode: true,
          emailverified: true,
          
          }},
         
          // Add other profiles if needed by your UserContext
        
      );

     
      
      // We manually combine the nested profile into a single 'profile' object
      // to match what your frontend's useUser context expects.

      const responseUser = {
        ...user,
        
      };

      res.status(200).json({
        success: true,
        user: responseUser,
      });
    } catch (error) {
      return next(new ErrorHandler("Internal Server Error.", 500));
    }
  }
)

export const handleForgotPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
      if (!email) {
        return next(new ErrorHandler("Please provide email", 400));
      }

      const user = await userEmailExists(email);
      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000);

      await updateTokenandExpiry(email, {
        resetToken: token,
        resetTokenExpiry: expiry,
      });


const resetLink = `${frontendURL}/reset-password?token=${token}&email=${email}`;
      console.log(resetLink);

      const subject = "Password Reset Request";
      const message = `Click <a href="${resetLink}">here</a> to reset your password.`;

      await sendEmail(email, subject, message);

      res.json({ message: "Password reset link sent if that email exists." });
    } catch (error) {
      return next(new ErrorHandler("Internal Server Error.", 500));
    }
  }
);
export const hanldeResetPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, token, newPassword } = req.body;

    try {
      if (!email || !token || !newPassword) {
        return next(new ErrorHandler("Please provide email", 400));
      }

      const user = await userEmailExists(email);
      if (!user || user.resetToken !== token || !user.resetTokenExpiry) {
        return next(new ErrorHandler("Invalid or expired token.", 400));
      }

      if (user.resetTokenExpiry < new Date()) {
        return next(new ErrorHandler("Invalid or expired token.", 400));
      }

      const hashedPassword = await hashpass(newPassword);

      await updateNewPassword(user.email, hashedPassword);

      res
        .status(200)
        .json({ message: "Password has been reset successfully." });
    } catch (error) {
      return next(new ErrorHandler("Internal Server Error.", 500));
    }
  }
);

export const resendEmailOTP = catchAsyncError(
 async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body

    if (!email) {
      return next(new ErrorHandler("Email is required.", 400))
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return next(new ErrorHandler("User not found.", 404))
    }

    if (user.role === "ADMIN") {
      return next(new ErrorHandler("OTP verification not required for admin.", 400))
    }

    if (isUserEmailVerified(user)) {
      res.status(200).json({
        success: true,
        message: "Email already verified.",
      })
      return ;
    }

    // Optional: throttle resends (e.g., one every 60 seconds)
    // If you want throttling, uncomment this block:
    /*
    if (user.verificationCodeExpire) {
      const lastExpire = new Date(user.verificationCodeExpire).getTime()
      const now = Date.now()
      const RESEND_COOLDOWN_MS = 60 * 1000
      // If old code still valid and just sent recently, you can block or reuse.
      if (lastExpire - now > 23 * 60 * 60 * 1000 && now + RESEND_COOLDOWN_MS < lastExpire) {
        return next(new ErrorHandler("Please wait before requesting another code.", 429))
      }
    }
    */

    // Generate a new code and extend expiry
    const code = generateVerificationCode().toString()
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await saveEmailVerificationCode(user.id, code, expireAt)

    // Send mail (throw on failure so catchAsyncError handles it)
    await sendEmailVerificationCode(user.email, code)
       res.status(200).json({
      success: true,
      message: "Verification code resent to your email.",
    })
    return ;
  }
)

