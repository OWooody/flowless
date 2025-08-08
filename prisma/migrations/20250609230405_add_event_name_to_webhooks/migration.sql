/*
  Warnings:

  - You are about to drop the column `pageUrl` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "pageUrl";

-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "eventName" TEXT;

-- CreateIndex
CREATE INDEX "Webhook_eventName_idx" ON "Webhook"("eventName");
