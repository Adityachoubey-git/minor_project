import { Request, Response, NextFunction } from "express"
import { catchAsyncError } from "../middlewares/catchAsyncError"

import axios from "axios"
import ErrorHandler from "../middlewares/error"
import { createAlarmRepo, getPendingAlarmsRepo, markAlarmExecutedRepo } from "../repository/alarm.repo"
import { updateDeviceStateRepo } from "../repository/relay.repo"
import prisma from "../db/db"

const ESP32_IP = process.env.ESP32_IP || "http://192.168.1.50" // example

// ✅ Create Alarm (user schedules ON/OFF)
export const createAlarmHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { deviceIds, state, date, time } = req.body
    const user = (req as any).user

    if (!user) return next(new ErrorHandler("Unauthorized", 401))
    if (!Array.isArray(deviceIds) || !["on", "off"].includes(state))
      return next(new ErrorHandler("Body → { deviceIds:[1,2], state:'on'|'off', date:'YYYY-MM-DD', time:'HH:mm' }", 400))

    const scheduledAt = new Date(`${date}T${time}:00`)

    if (isNaN(scheduledAt.getTime()))
      return next(new ErrorHandler("Invalid date/time format", 400))

    // 🔒 Role validation
    if (user.role === "STUDENT")
      return next(new ErrorHandler("Students cannot set alarms", 403))

    // Save alarm
    const alarm = await createAlarmRepo(user.id, deviceIds, state, scheduledAt)

    res.status(201).json({
      success: true,
      message: `Alarm scheduled to turn ${state} ${deviceIds.length > 1 ? "devices" : "device"} at ${scheduledAt.toLocaleString()}`,
      alarm,
    })
  }
)

// ✅ Background processor — triggers alarms automatically
export const processAlarmsHandler = catchAsyncError(async (_req, res) => {
  const pending = await getPendingAlarmsRepo()
  const executed: any[] = []

  for (const alarm of pending) {
    const deviceIds: number[] = JSON.parse(alarm.deviceIds)
    const state = alarm.state

    const devices = await prisma.devices.findMany({ where: { id: { in: deviceIds } } })
    for (const dev of devices) {
      try {
        await axios.get(`${ESP32_IP}/setState?pin=${dev.PinNumber}&state=${state}`)
        await updateDeviceStateRepo(dev.id, state === "on")
        await prisma.command.create({
          data: {
            userId: alarm.userId,
            deviceId: dev.id,
            command: state,
            status: "completed",
          },
        })
      } catch (err) {
        await prisma.command.create({
          data: {
            userId: alarm.userId,
            deviceId: dev.id,
            command: state,
            status: "failed",
          },
        })
      }
    }

    await markAlarmExecutedRepo(alarm.id)
    executed.push({ alarmId: alarm.id, devices: deviceIds, state })
  }

  res.status(200).json({
    success: true,
    message: "Processed alarms",
    executedCount: executed.length,
    executed,
  })
})
// ✅ List alarms for Admin/Faculty/Student
export const getAlarmsHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as any).user
    if (!authUser) return next(new ErrorHandler("Unauthorized", 401))

    const { role, id: userId } = authUser
    const { includeExecuted, state } = req.query

    const where: any = {}

    // Role-based access:
    if (role === "ADMIN") {
      // Admin can optionally filter by userId
      if (req.query.userId) {
        where.userId = Number(req.query.userId)
      }
    } else {
      // Faculty/Student see only their alarms
      where.userId = userId
    }

    if (state && (state === "on" || state === "off")) {
      where.state = state
    }

    if (includeExecuted !== "true") {
      where.executed = false          // by default, only upcoming/pending
    }

    const alarms = await prisma.alarm.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    const formatted = alarms.map((a) => ({
      id: a.id,
      userId: a.userId,
      devices: JSON.parse(a.deviceIds) as number[],
      state: a.state,                 // "on" | "off"
      scheduledAt: a.scheduledAt,
      executed: a.executed,
      enabled: a.enabled,
      createdAt: a.createdAt,
      user: a.user,
    }))

    res.status(200).json({
      success: true,
      alarms: formatted,
    })
  },
)
export const getSingleAlarmHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as any).user
    if (!authUser) return next(new ErrorHandler("Unauthorized", 401))

    const alarmId = Number(req.params.id)

    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    if (!alarm) {
      return next(new ErrorHandler("Alarm not found", 404))
    }

    // Access control: non-admin can only see their own alarm
    if (authUser.role !== "ADMIN" && alarm.userId !== authUser.id) {
      return next(new ErrorHandler("Forbidden", 403))
    }

    const formatted = {
      id: alarm.id,
      userId: alarm.userId,
      devices: JSON.parse(alarm.deviceIds) as number[],
      state: alarm.state,
      scheduledAt: alarm.scheduledAt,
      executed: alarm.executed,
      enabled: alarm.enabled,
      createdAt: alarm.createdAt,
      user: alarm.user,
    }

    res.status(200).json({
      success: true,
      alarm: formatted,
    })
  },
)
export const toggleAlarmEnabledHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as any).user
    if (!authUser) return next(new ErrorHandler("Unauthorized", 401))

    const alarmId = Number(req.params.id)
    const { enabled } = req.body

    if (typeof enabled !== "boolean") {
      return next(new ErrorHandler("Body must be { enabled: boolean }", 400))
    }

    const alarm = await prisma.alarm.findUnique({ where: { id: alarmId } })

    if (!alarm) {
      return next(new ErrorHandler("Alarm not found", 404))
    }

    // Only admin or owner can change
    if (authUser.role !== "ADMIN" && alarm.userId !== authUser.id) {
      return next(new ErrorHandler("Forbidden", 403))
    }

    const updated = await prisma.alarm.update({
      where: { id: alarmId },
      data: { enabled },
    })

    res.status(200).json({
      success: true,
      message: `Alarm ${enabled ? "enabled" : "disabled"}`,
      alarm: {
        id: updated.id,
        userId: updated.userId,
        devices: JSON.parse(updated.deviceIds) as number[],
        state: updated.state,
        scheduledAt: updated.scheduledAt,
        executed: updated.executed,
        enabled: updated.enabled,
        createdAt: updated.createdAt,
      },
    })
  },
)
export const deleteAlarmHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as any).user
    if (!authUser) return next(new ErrorHandler("Unauthorized", 401))

    const alarmId = Number(req.params.id)

    const alarm = await prisma.alarm.findUnique({ where: { id: alarmId } })

    if (!alarm) {
      return next(new ErrorHandler("Alarm not found", 404))
    }

    if (authUser.role !== "ADMIN" && alarm.userId !== authUser.id) {
      return next(new ErrorHandler("Forbidden", 403))
    }

    await prisma.alarm.delete({ where: { id: alarmId } })

    res.status(200).json({
      success: true,
      message: "Alarm deleted",
    })
  },
)
