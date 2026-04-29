-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'InvestigatorPathRestricted';
ALTER TYPE "EventType" ADD VALUE 'InvestigatorPathUnrestricted';

-- CreateTable
CREATE TABLE "InvestigatorRestrictedPath" (
    "id" TEXT NOT NULL,
    "investigatorWallet" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentPath" TEXT NOT NULL,

    CONSTRAINT "InvestigatorRestrictedPath_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestigatorRestrictedPath_investigatorWallet_caseId_docume_key" ON "InvestigatorRestrictedPath"("investigatorWallet", "caseId", "documentPath");

-- AddForeignKey
ALTER TABLE "InvestigatorRestrictedPath" ADD CONSTRAINT "InvestigatorRestrictedPath_investigatorWallet_fkey" FOREIGN KEY ("investigatorWallet") REFERENCES "Investigator"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;
