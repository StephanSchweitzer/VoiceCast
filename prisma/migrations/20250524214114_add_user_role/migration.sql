-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "Voice" ADD COLUMN     "duration" DOUBLE PRECISION;
