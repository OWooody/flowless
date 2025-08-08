/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sessionId_fkey";

-- DropIndex
DROP INDEX "Event_sessionId_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "sessionId";

-- DropTable
DROP TABLE "Session";
