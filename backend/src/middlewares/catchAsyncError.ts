import type { Request, Response, NextFunction } from "express";

export const catchAsyncError = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {

    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
