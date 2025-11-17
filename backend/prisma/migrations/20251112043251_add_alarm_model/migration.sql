-- CreateTable
CREATE TABLE "Alarm" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceIds" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
