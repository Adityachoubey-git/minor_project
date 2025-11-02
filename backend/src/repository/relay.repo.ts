import prisma from "../db/db";


// 🔹 update device value in DB
export async function updateDeviceStateRepo(id: number, value: boolean) {
  return prisma.devices.update({
    where: { id },
    data: { value },
  });
}

// 🔹 device command history
export async function getDeviceHistoryRepo(deviceId: number) {
  return prisma.command.findMany({
    where: { deviceId },
    orderBy: { requestedAt: "desc" },
    include: {
      Device: { select: { Name: true, PinNumber: true } },
      devices: true,
    },
  });
}

// 🔹 user command history
export async function getUserHistoryRepo(userId: number) {
  return prisma.command.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    include: {
      Device: { select: { Name: true, PinNumber: true } },
    },
  });
}

// 🔹 all commands
export async function getAllCommandsRepo() {
  return prisma.command.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      Device: { select: { Name: true, PinNumber: true } },
      devices: { select: { Name: true } },
    },
  });
}
