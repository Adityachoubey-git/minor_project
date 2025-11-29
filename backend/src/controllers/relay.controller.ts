import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../middlewares/error";
import axios from "axios";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import prisma from "../db/db";
import { getAllCommandsRepo, getDeviceHistoryRepo, getUserHistoryRepo, updateDeviceStateRepo } from "../repository/relay.repo";


const ESP32_IP = process.env.ESP32_IP // ⬅️ change per lab if needed

// ===============================================================
// 🔹 1️⃣ Get current live state from ESP32
// ===============================================================
export const getLiveDeviceStateHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { pins } = req.body;
    if (!Array.isArray(pins) || pins.length === 0) {
      return next(new ErrorHandler("Provide pin numbers as [16,17,...]", 400));
    }

    const results: any[] = [];

    for (const pin of pins) {
      try {
        const resp = await axios.get(`${ESP32_IP}/getState?pin=${pin}`, { timeout: 5000 });
        results.push(resp.data);
      } catch (err: any) {
        console.error(`Error fetching state for pin ${pin}:`, err.message);
        results.push({ pin, error: "unreachable" });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      states: results,
    });
  }
);

// ===============================================================
// 🔹 2️⃣ Turn ON/OFF single or multiple devices
// ===============================================================
export const controlDevicesHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { deviceIds, state } = req.body;
    if (!Array.isArray(deviceIds) || !["on", "off"].includes(state)) {
      return next(new ErrorHandler("Body → { deviceIds:[1,2], state:'on'|'off' }", 400));
    }

    const user = req.user;
    if (!user) return next(new ErrorHandler("Unauthorized", 401));

    const devices = await prisma.devices.findMany({ where: { id: { in: deviceIds } } });
    if (!devices.length) return next(new ErrorHandler("Devices not found", 404));

    const updatedStates: any[] = [];

    for (const dev of devices) {
      // 🔒 Role validation
      if (user.role === "STUDENT" && !dev.studentAllowed ) {
        return next(new ErrorHandler(`Students cannot control ${dev.Name} device`, 403));
      }
      if (user.role === "FACULTY" && !dev.allowedDevices) {
        return next(new ErrorHandler(`Device ${dev.Name} not allowed`, 403));
      }

      try {
        const espResp = await axios.get(
          `${ESP32_IP}/setState?pin=${dev.PinNumber}&state=${state}`,
          { timeout: 5000 }
        );

        // 🔹 Update DB state
        await updateDeviceStateRepo(dev.id, state === "on");

        // 🔹 Log command
        await prisma.command.create({
          data: {
            userId: user.id,
            deviceId: dev.id,
            command: state,
            status: "completed",
          },
        });

        updatedStates.push({ device: dev.Name, response: espResp.data });
      } catch (err: any) {
        await prisma.command.create({
          data: {
            userId: user.id,
            deviceId: dev.id,
            command: state,
            status: "failed",
          },
        });
        updatedStates.push({ device: dev.Name, error: "unreachable" });
      }
    }

    res.status(200).json({
      success: true,
      message: `Devices ${state === "on" ? "turned ON" : "turned OFF"}`,
      results: updatedStates,
    });
  }
);

// ===============================================================
// 🔹 3️⃣ Command history by device
// ===============================================================
export const getDeviceCommandHistoryHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const deviceId = Number(req.params.id);
    if (isNaN(deviceId)) return next(new ErrorHandler("Invalid device ID", 400));

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await getDeviceHistoryRepo(deviceId, page, limit);

    res.status(200).json({ success: true, ...result });
  }
);


// ===============================================================
// 🔹 4️⃣ Command history by user
// ===============================================================
export const getUserCommandHistoryHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return next(new ErrorHandler("Invalid user ID", 400));

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await getUserHistoryRepo(userId, page, limit);

    res.status(200).json({ success: true, ...result });
  }
);
// ===============================================================
// 🔹 5️⃣ All commands (Admin dashboard)
// ===============================================================
export const getAllCommandsHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (role === "STUDENT")
      return next(new ErrorHandler("students cannot view all command logs", 403));

    const {
      page,
      limit,
      search,
      status,
      commandType,
      userId,
      deviceId,
      labId,
      startDate,
      endDate,
    } = req.query;

    const result = await getAllCommandsRepo({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search as string,
      status,
      commandType,
      userId,
      deviceId,
      labId,
      startDate,
      endDate,
    });

    res.status(200).json({ success: true, ...result });
  }
);


