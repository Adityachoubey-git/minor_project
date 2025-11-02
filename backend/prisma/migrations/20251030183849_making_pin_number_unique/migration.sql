/*
  Warnings:

  - A unique constraint covering the columns `[PinNumber]` on the table `Devices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Devices_PinNumber_key" ON "Devices"("PinNumber");
