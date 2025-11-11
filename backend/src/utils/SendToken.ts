import jwt from "jsonwebtoken";
import { Response } from "express";

export const sendToken = (
  user: any,
  statusCode: number,
  message: string,
  res: Response
) => {
  const generateToken = () => {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not defined in environment variables");
    }

    // Sign the token with only the fields you need
    return jwt.sign(
      { user_id: user.id, role: user.role }, 
      JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );
  };

  const token = generateToken();
 

  // Send token as cookie (if your app uses cookies)
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  


  res.status(statusCode).json({
    success: true,
    message,

  });
};
