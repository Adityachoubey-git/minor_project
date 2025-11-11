/*
  Warnings:

  - You are about to drop the `_DevicesToLab` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_DevicesToLab" DROP CONSTRAINT "_DevicesToLab_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DevicesToLab" DROP CONSTRAINT "_DevicesToLab_B_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_login" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."_DevicesToLab";

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
