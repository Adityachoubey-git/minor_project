/*
  Warnings:

  - Added the required column `labId` to the `Devices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Devices" ADD COLUMN     "labId" INTEGER NOT NULL,
ADD COLUMN     "value" BOOLEAN NOT NULL DEFAULT false;
