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
