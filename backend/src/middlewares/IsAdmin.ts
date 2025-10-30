import { Request, Response, NextFunction } from "express";
import ErrorHandler from "./error";


export async function IsAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if(!req.user){
        return next(new ErrorHandler("User not found.", 404));
    }



    if(req.user?.role === "ADMIN"){
    
    next();
    }else{
        return next(new ErrorHandler("Invalid.", 404));
    }

}