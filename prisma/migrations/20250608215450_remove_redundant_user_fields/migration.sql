/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `userPlan` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `userRole` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Event_organizationId_idx";

-- DropIndex
DROP INDEX "Event_userId_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "organizationId",
DROP COLUMN "userId",
DROP COLUMN "userPlan",
DROP COLUMN "userRole";
