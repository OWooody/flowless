-- CreateTable
CREATE TABLE "WhatsAppProvider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentials" JSONB NOT NULL,
    "config" JSONB,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT false,
    "optInDate" TIMESTAMP(3),
    "optOutDate" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppProvider_organizationId_idx" ON "WhatsAppProvider"("organizationId");

-- CreateIndex
CREATE INDEX "WhatsAppProvider_providerName_idx" ON "WhatsAppProvider"("providerName");

-- CreateIndex
CREATE INDEX "WhatsAppProvider_isActive_idx" ON "WhatsAppProvider"("isActive");

-- CreateIndex
CREATE INDEX "WhatsAppProvider_createdAt_idx" ON "WhatsAppProvider"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_providerId_idx" ON "WhatsAppTemplate"("providerId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_organizationId_idx" ON "WhatsAppTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_templateName_idx" ON "WhatsAppTemplate"("templateName");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_category_idx" ON "WhatsAppTemplate"("category");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_language_idx" ON "WhatsAppTemplate"("language");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_isActive_idx" ON "WhatsAppTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_createdAt_idx" ON "WhatsAppTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "UserPhone_userId_idx" ON "UserPhone"("userId");

-- CreateIndex
CREATE INDEX "UserPhone_organizationId_idx" ON "UserPhone"("organizationId");

-- CreateIndex
CREATE INDEX "UserPhone_phoneNumber_idx" ON "UserPhone"("phoneNumber");

-- CreateIndex
CREATE INDEX "UserPhone_countryCode_idx" ON "UserPhone"("countryCode");

-- CreateIndex
CREATE INDEX "UserPhone_isVerified_idx" ON "UserPhone"("isVerified");

-- CreateIndex
CREATE INDEX "UserPhone_isOptedIn_idx" ON "UserPhone"("isOptedIn");

-- CreateIndex
CREATE INDEX "UserPhone_createdAt_idx" ON "UserPhone"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPhone_userId_phoneNumber_key" ON "UserPhone"("userId", "phoneNumber");

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "WhatsAppProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
