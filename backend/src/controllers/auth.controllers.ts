import bcrypt from "bcryptjs";

import { NextFunction,Request,Response } from "express";

import ErrorHandler from "../middlewares/error";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import prisma from "../db/db";
import { createAdmin, createUser, findAdmin, userEmailExists } from "../repository/auth.repo";
import { sendToken } from "../utils/SendToken";
import { generateEmailTemplate } from "../utils/EmailTemplate";
import { sendEmail } from "../utils/SendEmail";



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
  try {
    await sendEmail(email, subject, message);
    console.log("mail sent ")
  } catch (err) {
    console.log("Email could not be sent", err);

    return new ErrorHandler("Email could not be sent", 500);
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
