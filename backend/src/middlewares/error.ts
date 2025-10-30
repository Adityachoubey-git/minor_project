import type { NextFunction, Request, Response } from "express";

class ErrorHandler extends Error {
    statusCode: number;
    path?: string;

    constructor(message:string, statusCode:number, path?: string){
        super(message)
        this.statusCode = statusCode
        this.path = path
    }
}
  
export const errorMiddleware = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error.";

    if (err.name === "CastError") {
        const message = `Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, Try again.`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is expired, Try again.`;
        err = new ErrorHandler(message, 400);
    }

    if (err.statusCode === 11000) {
        const message = `Duplicate key Entered`;
        err = new ErrorHandler(message, 400);
    }
    
    console.log(err.message);
    

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
  
export default ErrorHandler;