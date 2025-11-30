import e, { Request, Response, NextFunction } from "express"
import { catchAsyncError } from "../middlewares/catchAsyncError"
import ErrorHandler from "../middlewares/error"
import prisma from "../db/db"

type RangeType = "day" | "week" | "month" | "year"

function getDateRange(
  range: RangeType | undefined,
  from?: string,
  to?: string,
): { start: Date; end: Date; label: string } {
  // manual range
  if (from && to) {
    const start = new Date(from)
    const end = new Date(to)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid from/to date")
    }
    return { start, end, label: `Custom ${from} → ${to}` }
  }

  const now = new Date()
  const r: RangeType = range || "day"

  if (r === "day") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    return { start, end, label: "Today" }
  }

  if (r === "week") {
    const end = new Date(now)
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    return { start, end, label: "Last 7 days" }
  }

  if (r === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
    return { start, end, label: "This month" }
  }

  // financial year April–March
  const month = now.getMonth() // 0-11
  let fyStartYear = now.getFullYear()
  if (month < 3) {
    // Jan, Feb, Mar → previous FY
    fyStartYear = now.getFullYear() - 1
  }
  const start = new Date(fyStartYear, 3, 1, 0, 0, 0, 0) // 1 April
  const end = new Date(fyStartYear + 1, 3, 1, 0, 0, 0, 0) // next 1 April
  return { start, end, label: `FY ${fyStartYear}-${fyStartYear + 1}` }
}

function msToHours(ms: number): number {
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100
}

export const getUsageAnalyticsHandler = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as any).user
    if (!authUser) return next(new ErrorHandler("Unauthorized", 401))
          if (authUser.role !== "ADMIN") {
      return next(new ErrorHandler("Forbidden", 403))
    }


    const range = (req.query.range as RangeType | undefined) || "day"
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    let dateRange
    try {
      dateRange = getDateRange(range, from, to)
    } catch (e: any) {
      return next(new ErrorHandler(e.message || "Invalid date range", 400))
    }

    const { start, end, label } = dateRange

    const whereBase: any = {
      status: "completed",
      requestedAt: {
        gte: start,
        lt: end,
      },
    }

    // ---------- BY USER ----------
    const byUser = await prisma.command.groupBy({
      by: ["userId"],
      where: whereBase,
      _count: { _all: true },
    })

    const userIds = byUser.map((x) => x.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true ,IDnumber:true, email:true},
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const usageByUser = byUser.map((row) => {
      const u = userMap.get(row.userId)
      return {
        userId: row.userId,
        name: u?.name || "Unknown",
        role: u?.role || "STUDENT",
            idNumber: u?.IDnumber || "",   
        email: u?.email || "",
        commandCount: row._count._all,
      }
    })

    // ---------- BY ROLE ----------
    const usageByRoleMap: Record<string, number> = {}
    for (const u of usageByUser) {
      const key = u.role
      usageByRoleMap[key] = (usageByRoleMap[key] || 0) + u.commandCount
    }
    const usageByRole = Object.entries(usageByRoleMap).map(([role, commandCount]) => ({
      role,
      commandCount,
    }))

    // ---------- BY DEVICE ----------
    const byDevice = await prisma.command.groupBy({
      by: ["deviceId"],
      where: {
        ...whereBase,
        deviceId: { not: null },
      },
      _count: { _all: true },
    })

    const deviceIds = byDevice
      .map((x) => x.deviceId)
      .filter((id): id is number => id !== null)

    const devices = await prisma.devices.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true, Name: true, PinNumber: true, labId: true },
    })
    const deviceMap = new Map(devices.map((d) => [d.id, d]))

    const usageByDevice = byDevice
      .filter((row) => row.deviceId !== null)
      .map((row) => {
        const d = row.deviceId !== null ? deviceMap.get(row.deviceId) : null
        return {
          deviceId: row.deviceId!,
          name: d?.Name || `Device #${row.deviceId}`,
          pin: d?.PinNumber || null,
          commandCount: row._count._all,
        }
      })

    // ---------- LAB-LEVEL ANALYTICS ----------
    const labIds = devices.map((d) => d.labId)
    const labs = await prisma.lab.findMany({
      where: { id: { in: labIds } },
      select: { id: true, name: true },
    })
    const labMap = new Map(labs.map((l) => [l.id, l]))

    const usageByLabMap: Record<number, number> = {}

    for (const row of byDevice) {
      if (row.deviceId == null) continue
      const dev = deviceMap.get(row.deviceId)
      if (!dev) continue
      const labId = dev.labId
      usageByLabMap[labId] = (usageByLabMap[labId] || 0) + row._count._all
    }

    const usageByLab = Object.entries(usageByLabMap).map(([labIdStr, commandCount]) => {
      const labId = Number(labIdStr)
      const lab = labMap.get(labId)
      return {
        labId,
        labName: lab?.name || `Lab #${labId}`,
        commandCount: commandCount as number,
      }
    })

    // ---------- USER + DEVICE MATRIX ----------
    const byUserDevice = await prisma.command.groupBy({
      by: ["userId", "deviceId"],
      where: {
        ...whereBase,
        deviceId: { not: null },
      },
      _count: { _all: true },
    })

    const deviceUsageByUser = byUserDevice
      .filter((row) => row.deviceId !== null)
      .map((row) => {
        const u = userMap.get(row.userId)
        const d = deviceMap.get(row.deviceId!)
        return {
          userId: row.userId,
          userName: u?.name || "Unknown",
          role: u?.role || "STUDENT",
          idNumber: u?.IDnumber || "",   
          email: u?.email || "",
          deviceId: row.deviceId!,
          deviceName: d?.Name || `Device #${row.deviceId}`,
          commandCount: row._count._all,
        }
      })

    // ---------- DEVICE ON DURATION ----------
    const commandsForDuration = await prisma.command.findMany({
      where: {
        ...whereBase,
        deviceId: { not: null },
        command: { in: ["on", "off"] },
      },
      select: {
        deviceId: true,
        command: true,
        requestedAt: true,
      },
      orderBy: [{ deviceId: "asc" }, { requestedAt: "asc" }],
    })

    const lastOnMap = new Map<number, Date>()
    const durationMsMap = new Map<number, number>()

    for (const c of commandsForDuration) {
      if (!c.deviceId) continue
      const devId = c.deviceId
      if (c.command === "on") {
        lastOnMap.set(devId, c.requestedAt)
      } else if (c.command === "off") {
        const startOn = lastOnMap.get(devId)
        if (startOn) {
          const diff = c.requestedAt.getTime() - startOn.getTime()
          if (diff > 0) {
            durationMsMap.set(devId, (durationMsMap.get(devId) || 0) + diff)
          }
          lastOnMap.delete(devId)
        }
      }
    }

    // still ON at end of window
    for (const [devId, startOn] of lastOnMap.entries()) {
      const diff = end.getTime() - startOn.getTime()
      if (diff > 0) {
        durationMsMap.set(devId, (durationMsMap.get(devId) || 0) + diff)
      }
    }

    const deviceOnDurationHours = Array.from(durationMsMap.entries()).map(
      ([deviceId, ms]) => {
        const d = deviceMap.get(deviceId)
        return {
          deviceId,
          deviceName: d?.Name || `Device #${deviceId}`,
          hoursOn: msToHours(ms),
        }
      },
    )

    // ---------- TIME-OF-DAY HEATMAP ----------
    const commandsForHeatmap = await prisma.command.findMany({
      where: whereBase,
      select: {
        requestedAt: true,
      },
    })

    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour, // 0–23
      commandCount: 0,
    }))

    for (const c of commandsForHeatmap) {
      const h = c.requestedAt.getHours()
      if (h >= 0 && h < 24) {
        buckets[h].commandCount++
      }
    }

    const timeOfDayHeatmap = buckets

    // ---------- SUMMARY ----------
    const totalCommands = usageByUser.reduce(
      (sum, u) => sum + u.commandCount,
      0,
    )
    const uniqueUsers = usageByUser.length
    const uniqueDevices = usageByDevice.length

    res.status(200).json({
      success: true,
      range: {
        type: range,
        label,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalCommands,
        uniqueUsers,
        uniqueDevices,
      },
      usageByUser,           // who uses most
      usageByRole,           // by role
      usageByDevice,         // which device used most
      usageByLab,            // which lab used most  🔥
      deviceOnDurationHours, // ON hours per device
      deviceUsageByUser,     // which user uses which device more
      timeOfDayHeatmap,      // commands per hour-of-day 🔥
    })
  },
)
