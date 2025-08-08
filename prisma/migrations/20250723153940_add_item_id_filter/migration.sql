-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "filterItemId" TEXT;

-- CreateIndex
CREATE INDEX "Webhook_filterItemId_idx" ON "Webhook"("filterItemId");
