import prisma from "../db/db";


interface CreateDeviceInput {
  Name: string;
  PinNumber: number;
  allowedDevices: boolean;
  labId: number;
}

// ✅ Create device and connect to a lab
export async function createDeviceRepo(data: CreateDeviceInput) {
  return prisma.devices.create({
    data: {
      Name: data.Name,
      PinNumber: data.PinNumber,
      allowedDevices: data.allowedDevices,
     labId: data.labId,
    },
    include: {
      Lab: true,
    },
  });
}

// ✅ Find device by PinNumber (for uniqueness check)
export async function findDeviceByPin(PinNumber: number) {
  return prisma.devices.findFirst({
    where: {
      PinNumber,
    },
  });
}

// ✅ Find device by ID
export async function findDeviceById(id: number) {
  return prisma.devices.findUnique({
    where: { id },
    include: { Lab: true },
  });
}

// ✅ Update device
export async function updateDeviceRepo(
  id: number,
  data: {
    Name?: string;
    PinNumber?: number;
    allowedDevices?: boolean;
    labId?: number;
  }
) {
  const updateData: any = {};

  if (data.Name !== undefined) updateData.Name = data.Name;
  if (data.PinNumber !== undefined) updateData.PinNumber = data.PinNumber;
  if (data.allowedDevices !== undefined) updateData.allowedDevices = data.allowedDevices;
  if (data.labId !== undefined) {
    updateData.Lab = {
      set: [{ id: data.labId }], // replaces existing lab association
    };
  }

  return prisma.devices.update({
    where: { id },
    data: updateData,
    include: {
      Lab: true,
    },
  });
}

// ✅ Delete device by ID
export async function deleteDeviceRepo(id: number) {
  return prisma.devices.delete({
    where: { id },
  });
}
interface DeviceQuery {
  search?: string;
  labId?: number;
  pin?: number;
  allowedDevices?: boolean;
  skip?: number;
  limit?: number;
}

// ✅ Get Devices with filters + pagination
export async function getDevicesRepo({
  search,
  labId,
  pin,
  allowedDevices,
  skip = 0,
  limit = 10,
}: DeviceQuery) {
  const whereClause: any = {};

  if (search) {
    whereClause.Name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (pin !== undefined) {
    whereClause.PinNumber = pin;
  }

  if (allowedDevices !== undefined) {
    whereClause.allowedDevices = allowedDevices;
  }

  if (labId !== undefined) {
    whereClause.Lab = {
      some: { id: labId },
    };
  }

  return prisma.devices.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Lab: true,
    },
  });
}

// ✅ Count total for pagination
export async function countDevicesRepo({
  search,
  labId,
  pin,
  allowedDevices,
}: Omit<DeviceQuery, "skip" | "limit">) {
  const whereClause: any = {};

  if (search) {
    whereClause.Name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (pin !== undefined) {
    whereClause.PinNumber = pin;
  }

  if (allowedDevices !== undefined) {
    whereClause.allowedDevices = allowedDevices;
  }

  if (labId !== undefined) {
    whereClause.Lab = {
      some: { id: labId },
    };
  }

  return prisma.devices.count({
    where: whereClause,
  });
}

