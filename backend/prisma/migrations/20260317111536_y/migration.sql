/*
  Warnings:

  - You are about to drop the `Events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_caseId_fkey";

-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_initiatorAddress_fkey";

-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_involvedInvestigator_fkey";

-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_parentFolderId_fkey";

-- DropTable
DROP TABLE "Events";

-- CreateTable
CREATE TABLE "Event" (
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

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("caseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_initiatorAddress_fkey" FOREIGN KEY ("initiatorAddress") REFERENCES "Investigator"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_involvedInvestigator_fkey" FOREIGN KEY ("involvedInvestigator") REFERENCES "Investigator"("walletAddress") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
