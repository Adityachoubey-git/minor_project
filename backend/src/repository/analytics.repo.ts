// src/repository/analytics.repo.ts
import prisma from "../db/db"

export async function getCompletedCommandsInRange(start: Date, end: Date) {
  return prisma.command.findMany({
    where: {
      status: "completed",
      requestedAt: {
        gte: start,
        lt: end,
      },
    },
  })
}

// You can add other small helpers if you want.
// But functionally, what you have in the controller is perfectly OK.
