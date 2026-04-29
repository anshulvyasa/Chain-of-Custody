/*
  Warnings:

  - The values [InvestigatorPathRestricted,InvestigatorPathUnrestricted] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `InvestigatorRestrictedPath` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('CaseAdded', 'InvestigatorAddedToCase', 'InvestigatorRemovedFromCase', 'DocumentHashAdded', 'AccessDocument', 'NewInvestigatorAdded', 'RemoveExistingInvestigator', 'RemoveCompromizedInvestigator', 'InvestigatorPathAllowed', 'InvestigatorPathRevoked', 'InvestigatorPromotedToAdmin', 'InvestigatorPromotedToSpecialAdmin');
ALTER TABLE "Event" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "public"."EventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "InvestigatorRestrictedPath" DROP CONSTRAINT "InvestigatorRestrictedPath_investigatorWallet_fkey";

-- DropTable
DROP TABLE "InvestigatorRestrictedPath";

-- CreateTable
CREATE TABLE "InvestigatorAllowedPath" (
    "id" TEXT NOT NULL,
    "investigatorWallet" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentPath" TEXT NOT NULL,

    CONSTRAINT "InvestigatorAllowedPath_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestigatorAllowedPath_investigatorWallet_caseId_documentP_key" ON "InvestigatorAllowedPath"("investigatorWallet", "caseId", "documentPath");

-- AddForeignKey
ALTER TABLE "InvestigatorAllowedPath" ADD CONSTRAINT "InvestigatorAllowedPath_investigatorWallet_fkey" FOREIGN KEY ("investigatorWallet") REFERENCES "Investigator"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;
