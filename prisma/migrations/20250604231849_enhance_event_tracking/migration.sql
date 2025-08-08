-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pageUrl" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "properties" SET DEFAULT '{}',
ALTER COLUMN "organizationId" SET DEFAULT 'personal';

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_name_idx" ON "Event"("name");

-- CreateIndex
CREATE INDEX "Event_sessionId_idx" ON "Event"("sessionId");
