-- CreateTable
CREATE TABLE "EventDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "properties" JSONB,
    "examples" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "examples" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDefinition_name_idx" ON "EventDefinition"("name");

-- CreateIndex
CREATE INDEX "EventDefinition_category_idx" ON "EventDefinition"("category");

-- CreateIndex
CREATE INDEX "EventDefinition_userId_idx" ON "EventDefinition"("userId");

-- CreateIndex
CREATE INDEX "EventDefinition_organizationId_idx" ON "EventDefinition"("organizationId");

-- CreateIndex
CREATE INDEX "EventDefinition_isActive_idx" ON "EventDefinition"("isActive");

-- CreateIndex
CREATE INDEX "EventDefinition_createdAt_idx" ON "EventDefinition"("createdAt");

-- CreateIndex
CREATE INDEX "BusinessMetric_name_idx" ON "BusinessMetric"("name");

-- CreateIndex
CREATE INDEX "BusinessMetric_category_idx" ON "BusinessMetric"("category");

-- CreateIndex
CREATE INDEX "BusinessMetric_userId_idx" ON "BusinessMetric"("userId");

-- CreateIndex
CREATE INDEX "BusinessMetric_organizationId_idx" ON "BusinessMetric"("organizationId");

-- CreateIndex
CREATE INDEX "BusinessMetric_isActive_idx" ON "BusinessMetric"("isActive");

-- CreateIndex
CREATE INDEX "BusinessMetric_createdAt_idx" ON "BusinessMetric"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_title_idx" ON "KnowledgeEntry"("title");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_tags_idx" ON "KnowledgeEntry"("tags");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_category_idx" ON "KnowledgeEntry"("category");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_userId_idx" ON "KnowledgeEntry"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_organizationId_idx" ON "KnowledgeEntry"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_isActive_idx" ON "KnowledgeEntry"("isActive");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_createdAt_idx" ON "KnowledgeEntry"("createdAt");
