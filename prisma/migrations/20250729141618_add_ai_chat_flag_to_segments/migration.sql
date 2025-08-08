-- AlterTable
ALTER TABLE "UserSegment" ADD COLUMN     "createdFromAiChat" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "UserSegment_createdFromAiChat_idx" ON "UserSegment"("createdFromAiChat");
