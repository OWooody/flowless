-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "userPhone" TEXT;

-- CreateIndex
CREATE INDEX "Event_userPhone_idx" ON "Event"("userPhone");
