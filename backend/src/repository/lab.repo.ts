import prisma from "../db/db";



// ✅ Create lab
export async function createLabRepo(name: string) {
  return prisma.lab.create({
    data: {
      name,
    },
  });
}

// ✅ Find lab by name
export async function findLabByName(name: string) {
  return prisma.lab.findFirst({
    where: { name },
  });
}

// ✅ Find lab by ID
export async function findLabById(id: number) {
  return prisma.lab.findUnique({
    where: { id },
  });
}

// ✅ Update lab
export async function updateLabRepo(id: number, name: string) {
  return prisma.lab.update({
    where: { id },
    data: {
      name,
    },
  });
}
// ✅ Delete lab by ID
export async function deleteLabRepo(id: number) {
  return prisma.lab.delete({
    where: { id },
  });
}
// ✅ Get labs with optional search and pagination
export async function getLabsRepo(search: string, skip: number, limit: number) {
  return prisma.lab.findMany({
    where: {
      name: {
        contains: search,
        mode: "insensitive", // case-insensitive search
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ✅ Count labs for pagination
export async function countLabsRepo(search: string) {
  return prisma.lab.count({
    where: {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
  });
}
