/*
  Warnings:

  - You are about to drop the column `contentId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `conversionType` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `elementCategory` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `elementId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `elementText` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `elementType` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `funnelStep` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pageType` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Event_contentId_idx";

-- DropIndex
DROP INDEX "Event_conversionType_idx";

-- DropIndex
DROP INDEX "Event_funnelStep_idx";

-- DropIndex
DROP INDEX "Event_pageType_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "contentId",
DROP COLUMN "conversionType",
DROP COLUMN "currency",
DROP COLUMN "duration",
DROP COLUMN "elementCategory",
DROP COLUMN "elementId",
DROP COLUMN "elementText",
DROP COLUMN "elementType",
DROP COLUMN "funnelStep",
DROP COLUMN "pageType",
DROP COLUMN "status";
