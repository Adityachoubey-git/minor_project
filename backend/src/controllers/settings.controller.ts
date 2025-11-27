import prisma from "../db/db";
import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../middlewares/error";
import { controlDevicesHandler } from "./relay.controller";

export const updateGoodFeaturesHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { deviceId, gmEnabled, gnEnabled } = req.body;

    if (!deviceId) return next(new ErrorHandler("deviceId required", 400));

    const device = await prisma.devices.findUnique({
      where: { id: deviceId },
    });

    if (!device) return next(new ErrorHandler("Device not found", 404));

    const updated = await prisma.devices.update({
      where: { id: deviceId },
      data: {
        gmEnabled: gmEnabled ?? device.gmEnabled,
        gnEnabled: gnEnabled ?? device.gnEnabled,
      },
    });
          res.status(200).json({
      success: true,
      message: "Device settings updated",
      device: updated,
    });
    return ;
  }
);
export const getDevicesForGoodFeatureHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const labId = req.query.labId ? Number(req.query.labId) : undefined;

    const devices = await prisma.devices.findMany({
      where: labId ? { labId } : undefined,
      orderBy: { id: "asc" },
    });
 res.status(200).json({
      success: true,
      devices,
    });
    return;
  }
);
export const goodMorningHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { labId } = req.body;
    const user = req.user;
       if (!user) return next(new ErrorHandler("Unauthorized", 401));


    // ⭐ Fetch only devices that:
    //  gmEnabled = true
    //  allowedDevices = true
    //  studentAllowed = true (if current user is student)
    const filters: any = {
      gmEnabled: true,
      allowedDevices: true,
    };

    if (labId) filters.labId = Number(labId);

    const devices = await prisma.devices.findMany({
      where: filters,
    });

    // Student restriction:
    const filteredDevices = devices.filter((d) => {
      if (user.role === "STUDENT" && !d.studentAllowed) return false;
      return true;
    });

    if (!filteredDevices.length)
      return next(new ErrorHandler("No allowed devices for Good Morning", 404));

    // Extract device IDs
    const deviceIds = filteredDevices.map((d) => d.id);

    // Reuse your main handler:
    req.body.deviceIds = deviceIds;
    req.body.state = "on";

    return controlDevicesHandler(req, res, next);
  }
);
export const goodNightHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { labId } = req.body;
    const user = req.user;
   if (!user) return next(new ErrorHandler("Unauthorized", 401));

    const filters: any = {
      gnEnabled: true,
      allowedDevices: true,
    };

    if (labId) filters.labId = Number(labId);

    const devices = await prisma.devices.findMany({
      where: filters,
    });

    // Student restriction
    const filteredDevices = devices.filter((d) => {
    
 
      if (user.role === "STUDENT" && !d.studentAllowed) return false;
      return true;
    });

    if (!filteredDevices.length)
      return next(new ErrorHandler("No allowed devices for Good Night", 404));

    const deviceIds = filteredDevices.map((d) => d.id);

    req.body.deviceIds = deviceIds;
    req.body.state = "off";

    return controlDevicesHandler(req, res, next);
  }
);
