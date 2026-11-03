-- CreateEnum
CREATE TYPE "PointEventType" AS ENUM ('PRICE_REPORT_APPROVED', 'PROMO_APPROVED', 'REPORT_CONFIRMED', 'VOTE_GIVEN', 'REVOKED');

-- CreateTable
CREATE TABLE "PointEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointEventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointEvent_userId_createdAt_idx" ON "PointEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PointEvent_type_sourceId_key" ON "PointEvent"("type", "sourceId");
