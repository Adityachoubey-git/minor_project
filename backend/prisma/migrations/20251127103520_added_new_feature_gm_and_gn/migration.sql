-- AlterTable
ALTER TABLE "Devices" ADD COLUMN     "gmEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gnEnabled" BOOLEAN NOT NULL DEFAULT true;
