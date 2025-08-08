/*
  Warnings:

  - You are about to drop the column `metadata` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Session_endTime_idx";

-- DropIndex
DROP INDEX "Session_startTime_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "metadata",
ADD COLUMN     "action" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'engagement',
ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "conversionType" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "elementCategory" TEXT,
ADD COLUMN     "elementId" TEXT,
ADD COLUMN     "elementText" TEXT,
ADD COLUMN     "elementType" TEXT,
ADD COLUMN     "funnelStep" TEXT,
ADD COLUMN     "itemCategory" TEXT,
ADD COLUMN     "itemId" TEXT,
ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "pageTitle" TEXT,
ADD COLUMN     "pageType" TEXT,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "userPlan" TEXT,
ADD COLUMN     "userRole" TEXT,
ADD COLUMN     "value" DOUBLE PRECISION,
ALTER COLUMN "properties" DROP NOT NULL,
ALTER COLUMN "properties" DROP DEFAULT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "organizationId" DROP NOT NULL,
ALTER COLUMN "organizationId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "properties" JSONB,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_organizationId_idx" ON "UserProfile"("organizationId");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_pageType_idx" ON "Event"("pageType");

-- CreateIndex
CREATE INDEX "Event_contentId_idx" ON "Event"("contentId");

-- CreateIndex
CREATE INDEX "Event_action_idx" ON "Event"("action");

-- CreateIndex
CREATE INDEX "Event_conversionType_idx" ON "Event"("conversionType");

-- CreateIndex
CREATE INDEX "Event_funnelStep_idx" ON "Event"("funnelStep");

-- CreateIndex
CREATE INDEX "Event_itemId_idx" ON "Event"("itemId");

-- CreateIndex
CREATE INDEX "Event_itemCategory_idx" ON "Event"("itemCategory");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_organizationId_idx" ON "Session"("organizationId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
