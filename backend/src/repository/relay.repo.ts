import prisma from "../db/db";


// 🔹 update device value in DB
export async function updateDeviceStateRepo(id: number, value: boolean) {
  return prisma.devices.update({
    where: { id },
    data: { value },
  });
}

export async function getDeviceHistoryRepo(
  deviceId: number,
  page = 1,
  limit = 15
) {
  const skip = (page - 1) * limit;

  const where = { deviceId };

  const [data, total] = await Promise.all([
    prisma.command.findMany({
      where,
      skip,
      take: limit,
      orderBy: { requestedAt: "desc" },
      include: {
        Device: { select: { Name: true, PinNumber: true, labId: true } },
        devices: { select: { Name: true, PinNumber: true } },
        user: true,
      },
    }),
    prisma.command.count({ where }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  };
}

// 🔹 User-wise command history (with user + device)
export async function getUserHistoryRepo(
  userId: number,
  page = 1,
  limit = 15
) {
  const skip = (page - 1) * limit;

  const where = { userId };

  const [data, total] = await Promise.all([
    prisma.command.findMany({
      where,
      skip,
      take: limit,
      orderBy: { requestedAt: "desc" },
      include: {
        Device: { select: { Name: true, PinNumber: true, labId: true } },
        user:true,
        devices: { select: { Name: true, PinNumber: true } },
      },
    }),
    prisma.command.count({ where }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  };
}
// 🔹 all commands
export async function getAllCommandsRepo({
  page = 1,
  limit = 10,
  search = "",
  status,
  commandType,
  userId,
  deviceId,
  labId,
  startDate,
  endDate,
}: any) {

  const skip = (page - 1) * limit;

  const where: any = {};

  // --- SEARCH (device name, user name, command, status) ---
  if (search) {
    where.OR = [
      { command: { contains: search, mode: "insensitive" } },
      { status: { contains: search, mode: "insensitive" } },
      {
        Device: {
          Name: { contains: search, mode: "insensitive" }
        }
      },
      {
        user: {
          name: { contains: search, mode: "insensitive" }
        }
      }
    ];
  }

  // --- FILTERS ---
  if (status) where.status = status;
  if (commandType) where.command = commandType;
  if (userId) where.userId = Number(userId);
  if (deviceId) where.deviceId = Number(deviceId);
  if (labId) where.Device = { labId: Number(labId) };

  if (startDate || endDate) {
    where.requestedAt = {};
    if (startDate) where.requestedAt.gte = new Date(startDate);
    if (endDate) where.requestedAt.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prisma.command.findMany({
      where,
      skip,
      take: limit,
      orderBy: { requestedAt: "desc" },
      include: {
        Device: { select: { Name: true, PinNumber: true, labId: true } },
        devices: { select: { Name: true } },
        user:true,
      },
    }),

    prisma.command.count({ where }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  };
}
