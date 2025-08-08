-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "planId" TEXT;

-- CreateIndex
CREATE INDEX "Event_planId_idx" ON "Event"("planId");
