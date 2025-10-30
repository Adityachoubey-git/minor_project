
import 'dotenv/config';
import {PrismaClient}  from '@prisma/client';


let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, always use a single instance
  prisma = new PrismaClient();
} else {
  // In dev with hot-reload (Nodemon/Next.js), avoid multiple clients
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;
