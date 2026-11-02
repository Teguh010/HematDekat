-- AlterTable
ALTER TABLE "PriceReport" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;
