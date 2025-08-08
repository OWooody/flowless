-- CreateTable
CREATE TABLE "PromoCodeBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalCodes" INTEGER NOT NULL DEFAULT 0,
    "usedCodes" INTEGER NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minOrderValue" DOUBLE PRECISION,
    "maxUses" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCodeBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "orderId" TEXT,
    "discountAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoCodeBatch_userId_idx" ON "PromoCodeBatch"("userId");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_organizationId_idx" ON "PromoCodeBatch"("organizationId");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_name_idx" ON "PromoCodeBatch"("name");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_isActive_idx" ON "PromoCodeBatch"("isActive");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_validFrom_idx" ON "PromoCodeBatch"("validFrom");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_validUntil_idx" ON "PromoCodeBatch"("validUntil");

-- CreateIndex
CREATE INDEX "PromoCodeBatch_createdAt_idx" ON "PromoCodeBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_batchId_idx" ON "PromoCode"("batchId");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isUsed_idx" ON "PromoCode"("isUsed");

-- CreateIndex
CREATE INDEX "PromoCode_usedAt_idx" ON "PromoCode"("usedAt");

-- CreateIndex
CREATE INDEX "PromoCode_usedBy_idx" ON "PromoCode"("usedBy");

-- CreateIndex
CREATE INDEX "PromoCode_createdAt_idx" ON "PromoCode"("createdAt");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PromoCodeBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
