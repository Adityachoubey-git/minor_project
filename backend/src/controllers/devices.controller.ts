import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../middlewares/error";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { findLabById } from "../repository/lab.repo";
import { countDevicesRepo, createDeviceRepo, deleteDeviceRepo, findDeviceById, findDeviceByPin, getDevicesRepo, updateDeviceRepo } from "../repository/devices.repo";


export const createDeviceHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { Name, PinNumber, allowedDevices, labId } = req.body;

      // ✅ Input validation
      if (!Name || PinNumber === undefined || labId === undefined) {
        return next(new ErrorHandler("Name, PinNumber, and labId are required", 400));
      }

      // ✅ Extract user info
   const role = req.user?.role;
console.log("User role:", role);
      // ✅ Role check — only ADMIN
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can create devices", 403));
      }

      // ✅ Check if Lab exists
      const lab = await findLabById(Number(labId));
      if (!lab) {
        return next(new ErrorHandler("Lab not found", 404));
      }

      // ✅ Check if PinNumber already exists
      const existingDevice = await findDeviceByPin(Number(PinNumber));
      if (existingDevice) {
        return next(new ErrorHandler("A device with this PinNumber already exists", 400));
      }

      // ✅ Create Device
      const device = await createDeviceRepo({
        Name,
        PinNumber: Number(PinNumber),
        allowedDevices: allowedDevices ?? true,
        labId: Number(labId),
      });

      res.status(201).json({
        success: true,
        message: "Device created successfully",
        device,
      });
    } catch (err) {
      console.error("Error creating device:", err);
      next(new ErrorHandler("Something went wrong while creating device", 500));
    }
  }
);



export const editDeviceHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { Name, PinNumber, allowedDevices, labId } = req.body;

      // ✅ Validate input
      if (!id) return next(new ErrorHandler("Device ID is required", 400));

      // ✅ Extract user info
    const role = req.user?.role;
console.log("User role:", role);

      // ✅ Only ADMIN can edit devices
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can edit devices", 403));
      }

      // ✅ Check if device exists
      const existingDevice = await findDeviceById(Number(id));
      if (!existingDevice) {
        return next(new ErrorHandler("Device not found", 404));
      }

      // ✅ If new PinNumber is provided, ensure it’s unique
      if (PinNumber !== undefined) {
        const deviceWithSamePin = await findDeviceByPin(Number(PinNumber));
        if (deviceWithSamePin && deviceWithSamePin.id !== Number(id)) {
          return next(
            new ErrorHandler("Another device with this PinNumber already exists", 400)
          );
        }
      }

      // ✅ Optional: check if Lab exists before connecting
      if (labId) {
        const lab = await findLabById(Number(labId));
        if (!lab) {
          return next(new ErrorHandler("Provided labId not found", 404));
        }
      }

      // ✅ Update device
      const updatedDevice = await updateDeviceRepo(Number(id), {
        Name,
        PinNumber,
        allowedDevices,
        labId,
      });

      res.status(200).json({
        success: true,
        message: "Device updated successfully",
        device: updatedDevice,
      });
    } catch (err) {
      console.error("Error editing device:", err);
      next(new ErrorHandler("Something went wrong while updating device", 500));
    }
  }
);




export const deleteDeviceHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new ErrorHandler("Device ID is required", 400));
      }

      // ✅ Extract user info
     const role = req.user?.role;
console.log("User role:", role);

      // ✅ Role check — only ADMIN can delete
      if (role !== "ADMIN") {
        return next(new ErrorHandler("Only admins can delete devices", 403));
      }

      // ✅ Check if device exists
      const existingDevice = await findDeviceById(Number(id));
      if (!existingDevice) {
        return next(new ErrorHandler("Device not found", 404));
      }

      // ✅ Delete device
      await deleteDeviceRepo(Number(id));

      res.status(200).json({
        success: true,
        message: "Device deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting device:", err);
      next(new ErrorHandler("Something went wrong while deleting device", 500));
    }
  }
);


export const getDevicesHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔹 Query params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const labId = req.query.labId ? Number(req.query.labId) : undefined;
      const pin = req.query.pin ? Number(req.query.pin) : undefined;
      const allowedDevices =
        req.query.allowedDevices !== undefined
          ? req.query.allowedDevices === "true"
          : undefined;

      const skip = (page - 1) * limit;

      // 🔹 Get filtered devices
      const devices = await getDevicesRepo({
        search,
        labId,
        pin,
        allowedDevices,
        skip,
        limit,
      });

      const totalDevices = await countDevicesRepo({
        search,
        labId,
        pin,
        allowedDevices,
      });

      res.status(200).json({
        success: true,
        page,
        limit,
        totalDevices,
        totalPages: Math.ceil(totalDevices / limit),
        devices,
      });
    } catch (err) {
      console.error("Error fetching devices:", err);
      next(new ErrorHandler("Something went wrong while fetching devices", 500));
    }
  }
);
