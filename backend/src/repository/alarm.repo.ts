import prisma from "../db/db"


export async function createAlarmRepo(
  userId: number,
  deviceIds: number[],
  state: string,
  scheduledAt: Date,
  recurrenceType: string,
  daysOfWeek?: string[],
) {
  return prisma.alarm.create({
    data: {
      userId,
      deviceIds: JSON.stringify(deviceIds),
      state,
      scheduledAt,
      recurrenceType,
      daysOfWeek: daysOfWeek && daysOfWeek.length > 0 ? JSON.stringify(daysOfWeek) : null,
    },
  })
}

export async function getPendingAlarmsRepo() {
  return prisma.alarm.findMany({
    where: {
      executed: false,
      enabled: true,
      scheduledAt: { lte: new Date() },
    },
  })
}

export async function markAlarmExecutedRepo(id: number) {
  return prisma.alarm.update({
    where: { id },
    data: { executed: true },
  })
}




