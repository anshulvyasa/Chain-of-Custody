/*
  Warnings:

  - You are about to drop the column `itemId` on the `DocumentVersion` table. All the data in the column will be lost.
  - You are about to drop the `DocumentItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,parentId,caseId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `folderId` to the `DocumentVersion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FolderType" AS ENUM ('NORMAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CaseAdded', 'InvestigatorAddedToCase', 'DocumentHashAdded', 'NewInvestigatorAdded', 'RemoveExistingInvestigator', 'RemoveCompromizedInvestigator');

-- DropForeignKey
ALTER TABLE "DocumentItem" DROP CONSTRAINT "DocumentItem_folderId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentVersion" DROP CONSTRAINT "DocumentVersion_itemId_fkey";

-- AlterTable
ALTER TABLE "DocumentVersion" DROP COLUMN "itemId",
ADD COLUMN     "folderId" TEXT NOT NULL,
ALTER COLUMN "fileUrl" DROP NOT NULL,
ALTER COLUMN "fileType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "type" "FolderType" NOT NULL DEFAULT 'NORMAL';

-- DropTable
DROP TABLE "DocumentItem";

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "caseId" TEXT NOT NULL,
    "initiatorAddress" TEXT NOT NULL,
    "caseTitle" TEXT,
    "involvedInvestigator" TEXT,
    "parentFolderId" TEXT,
    "hash" TEXT,
    "cid" TEXT,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_name_parentId_caseId_key" ON "Folder"("name", "parentId", "caseId");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("caseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_initiatorAddress_fkey" FOREIGN KEY ("initiatorAddress") REFERENCES "Investigator"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_involvedInvestigator_fkey" FOREIGN KEY ("involvedInvestigator") REFERENCES "Investigator"("walletAddress") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
