/*
  Warnings:

  - You are about to drop the `AnalyticsCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnalyticsQuery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BusinessMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CampaignDelivery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCodeBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPhone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSegment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsAppProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsAppTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PromoCode" DROP CONSTRAINT "PromoCode_batchId_fkey";

-- DropForeignKey
ALTER TABLE "WhatsAppTemplate" DROP CONSTRAINT "WhatsAppTemplate_providerId_fkey";

-- DropTable
DROP TABLE "AnalyticsCache";

-- DropTable
DROP TABLE "AnalyticsQuery";

-- DropTable
DROP TABLE "BusinessMetric";

-- DropTable
DROP TABLE "CampaignDelivery";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventDefinition";

-- DropTable
DROP TABLE "KnowledgeEntry";

-- DropTable
DROP TABLE "NotificationCampaign";

-- DropTable
DROP TABLE "PromoCode";

-- DropTable
DROP TABLE "PromoCodeBatch";

-- DropTable
DROP TABLE "PushSubscription";

-- DropTable
DROP TABLE "UserPhone";

-- DropTable
DROP TABLE "UserSegment";

-- DropTable
DROP TABLE "WhatsAppProvider";

-- DropTable
DROP TABLE "WhatsAppTemplate";
