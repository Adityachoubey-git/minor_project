-- AlterTable
ALTER TABLE "Alarm" ADD COLUMN     "daysOfWeek" TEXT,
ADD COLUMN     "recurrenceType" TEXT NOT NULL DEFAULT 'once';
