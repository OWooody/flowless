-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "filterItemCategory" TEXT,
ADD COLUMN     "filterItemName" TEXT,
ADD COLUMN     "filterValue" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Webhook_filterItemName_idx" ON "Webhook"("filterItemName");

-- CreateIndex
CREATE INDEX "Webhook_filterItemCategory_idx" ON "Webhook"("filterItemCategory");
