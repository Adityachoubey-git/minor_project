import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../middlewares/error";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { countLabsRepo, createLabRepo, deleteLabRepo, findLabById, findLabByName, getLabsRepo, updateLabRepo } from "../repository/lab.repo";


export const createLabHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;

      // ✅ Validate input
      if (!name) {
        return next(new ErrorHandler("Lab name is required", 400));
      }

      // ✅ Extract user and check role
     const role = req.user?.role;
console.log("User role:", role);
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can create labs", 403));
      }

      // ✅ Check if lab exists
      const existing = await findLabByName(name);
      if (existing) {
        return next(new ErrorHandler("Lab already exists", 400));
      }

      // ✅ Create new lab via repository
      const lab = await createLabRepo(name);

      res.status(201).json({
        success: true,
        message: "Lab created successfully",
        lab,
      });
    } catch (err) {
      console.error("Error creating lab:", err);
      next(new ErrorHandler("Something went wrong while creating lab", 500));
    }
  }
);




export const editLabHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!id) {
        return next(new ErrorHandler("Lab ID is required", 400));
      }

      if (!name) {
        return next(new ErrorHandler("Lab name is required", 400));
      }

      // ✅ Extract user info
const role = req.user?.role;
console.log("User role:", role);

      // ✅ Role check
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can edit labs", 403));
      }

      // ✅ Check if lab exists
      const existingLab = await findLabById(Number(id));
      if (!existingLab) {
        return next(new ErrorHandler("Lab not found", 404));
      }

      // ✅ Check if new name already exists (optional uniqueness check)
      const duplicateLab = await findLabByName(name);
      if (duplicateLab && duplicateLab.id !== existingLab.id) {
        return next(new ErrorHandler("Another lab with this name already exists", 400));
      }

      // ✅ Update lab
      const updatedLab = await updateLabRepo(Number(id), name);

      res.status(200).json({
        success: true,
        message: "Lab updated successfully",
        lab: updatedLab,
      });
    } catch (err) {
      console.error("Error editing lab:", err);
      next(new ErrorHandler("Something went wrong while updating lab", 500));
    }
  }
);


export const deleteLabHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new ErrorHandler("Lab ID is required", 400));
      }

      // ✅ Extract user info
      const role = req.user?.role;
console.log("User role:", role);

      // ✅ Role check — only ADMIN
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can delete labs", 403));
      }

      // ✅ Check if lab exists
      const existingLab = await findLabById(Number(id));
      if (!existingLab) {
        return next(new ErrorHandler("Lab not found", 404));
      }

      // ✅ Delete the lab
      await deleteLabRepo(Number(id));

      res.status(200).json({
        success: true,
        message: "Lab deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting lab:", err);
      next(new ErrorHandler("Something went wrong while deleting lab", 500));
    }
  }
);



export const getLabsHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔹 Query params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const skip = (page - 1) * limit;

      // 🔹 Fetch labs with filters + pagination
      const labs = await getLabsRepo(search, skip, limit);
      const totalLabs = await countLabsRepo(search);

      res.status(200).json({
        success: true,
        page,
        limit,
        totalLabs,
        totalPages: Math.ceil(totalLabs / limit),
        labs,
      });
    } catch (err) {
      console.error("Error fetching labs:", err);
      next(new ErrorHandler("Something went wrong while fetching labs", 500));
    }
  }
);
