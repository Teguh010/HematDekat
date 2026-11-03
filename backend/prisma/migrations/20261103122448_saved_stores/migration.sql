-- CreateTable
CREATE TABLE "SavedStore" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedStore_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateIndex
CREATE INDEX "SavedStore_storeId_idx" ON "SavedStore"("storeId");

-- AddForeignKey
ALTER TABLE "SavedStore" ADD CONSTRAINT "SavedStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedStore" ADD CONSTRAINT "SavedStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
