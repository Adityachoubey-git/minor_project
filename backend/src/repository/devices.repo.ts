import prisma from "../db/db";


interface CreateDeviceInput {
  Name: string;
  PinNumber: number;
  allowedDevices: boolean;
  labId: number;
  studentAllowed :boolean
}

// ✅ Create device and connect to a lab
export async function createDeviceRepo(data: CreateDeviceInput) {
  return prisma.devices.create({
    data: {
      Name: data.Name,
      PinNumber: data.PinNumber,
      allowedDevices: data.allowedDevices,
     labId: data.labId,
     studentAllowed:data.studentAllowed
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
    studentAllowed?:boolean;
  }
) {
  const updateData: any = {};

  if (data.Name !== undefined) updateData.Name = data.Name;
  if (data.PinNumber !== undefined) updateData.PinNumber = data.PinNumber;
  if (data.allowedDevices !== undefined) updateData.allowedDevices = data.allowedDevices;
  if (data.studentAllowed !== undefined)  updateData.studentAllowed = data.studentAllowed; 
  if (data.labId !== undefined) updateData.labId=data.labId; 

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
  studentAllowed?:boolean;
}

// ✅ Get Devices with filters + pagination
export async function getDevicesRepo({
  search,
  labId,
  pin,
  allowedDevices,
  skip = 0,
  limit = 10,
  studentAllowed
}: DeviceQuery) {
  
  const whereClause: any = {};

  if (search) {
    whereClause.Name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (pin !== undefined && !isNaN(Number(pin))) {
    whereClause.PinNumber = Number(pin);
  }

  if (allowedDevices !== undefined && !isNaN(Number(allowedDevices))) {
    whereClause.allowedDevices = Boolean(Number(allowedDevices));
  }

  if (studentAllowed !== undefined && !isNaN(Number(studentAllowed))) {
    whereClause.studentAllowed = Boolean(Number(studentAllowed));
  }

  if (labId !== undefined && !isNaN(Number(labId))) {
    whereClause.labId = Number(labId);
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

  // PIN filter (safe number check)
  if (pin !== undefined && !isNaN(Number(pin))) {
    whereClause.PinNumber = Number(pin);
  }

  // allowedDevices filter (convert 0/1 → boolean)
  if (allowedDevices !== undefined && !isNaN(Number(allowedDevices))) {
    whereClause.allowedDevices = Boolean(Number(allowedDevices));
  }

  // labId filter (safe number check)
  if (labId !== undefined && !isNaN(Number(labId))) {
    whereClause.labId = Number(labId);
  }

  return prisma.devices.count({
    where: whereClause,
  });
}

export async function getDevicesByLabIdRepo(labId: number) {
  return prisma.devices.findMany({
    where: { labId },
    include: {
      Lab: true, // optional, remove if you don't need lab data here
    },
    orderBy: {
      id: "asc",
    },
  });
}