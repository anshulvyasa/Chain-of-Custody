-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_caseId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "authority" TEXT,
ALTER COLUMN "caseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Investigator" ADD COLUMN     "authority" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("caseId") ON DELETE SET NULL ON UPDATE CASCADE;
