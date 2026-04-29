/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash,logIndex]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "logIndex" INTEGER,
ADD COLUMN     "transactionHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_transactionHash_logIndex_key" ON "Event"("transactionHash", "logIndex");
