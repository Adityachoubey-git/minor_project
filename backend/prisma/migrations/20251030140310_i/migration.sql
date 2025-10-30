-- AlterTable
ALTER TABLE "user" ADD COLUMN     "accountVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailverificationCode" TEXT,
ADD COLUMN     "emailverified" BOOLEAN NOT NULL DEFAULT false;
