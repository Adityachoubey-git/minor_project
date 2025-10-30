import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";

import { userIdExists } from "../repository/auth.repo";
import ErrorHandler from "./error";
import { AuthUser } from "../types/auth";

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("hey i am cookies",req.cookies);
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 400));
  }
  const SECRET = process.env.JWT_SECRET_KEY || "";
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET) as JwtPayload;
  } catch (error) {
    return next(new ErrorHandler("Token Expired.", 404));
  }

  let user;
  if (typeof decoded !== "string" && decoded.user_id) {
    user = await userIdExists(parseInt(decoded.user_id));
    // console.log(user);
    if (!user) {                                                               
      return next(new ErrorHandler("User not found.", 401));
    }

  

  } else {
    return next(new ErrorHandler("Invalid token.", 400));
  }
  if (!user) {
    return next(new ErrorHandler("User not found.", 401));
  }

  const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
   
    };

  req.user = authUser; 
  next();
}
