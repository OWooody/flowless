-- AlterTable
ALTER TABLE "WorkflowExecution" ADD COLUMN     "databaseQueriesCount" INTEGER,
ADD COLUMN     "errorDetails" JSONB,
ADD COLUMN     "memoryUsageMb" INTEGER,
ADD COLUMN     "totalDurationMs" INTEGER,
ADD COLUMN     "triggerEvent" JSONB;

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMs" INTEGER,
    "inputData" JSONB,
    "outputData" JSONB,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowStep_executionId_idx" ON "WorkflowStep"("executionId");

-- CreateIndex
CREATE INDEX "WorkflowStep_stepOrder_idx" ON "WorkflowStep"("stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowStep_stepType_idx" ON "WorkflowStep"("stepType");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- CreateIndex
CREATE INDEX "WorkflowStep_startTime_idx" ON "WorkflowStep"("startTime");

-- CreateIndex
CREATE INDEX "WorkflowExecution_completedAt_idx" ON "WorkflowExecution"("completedAt");

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
