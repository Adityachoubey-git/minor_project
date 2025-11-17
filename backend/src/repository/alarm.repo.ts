import prisma from "../db/db"


export async function createAlarmRepo(userId: number, deviceIds: number[], state: string, scheduledAt: Date) {
  return prisma.alarm.create({
    data: {
      userId,
      deviceIds: JSON.stringify(deviceIds),
      state,
      scheduledAt,
    },
  })
}

export async function getPendingAlarmsRepo() {
  return prisma.alarm.findMany({
    where: { executed: false, scheduledAt: { lte: new Date() } },
  })
}

export async function markAlarmExecutedRepo(id: number) {
  return prisma.alarm.update({
    where: { id },
    data: { executed: true },
  })
}
