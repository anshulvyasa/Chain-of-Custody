/*
  Warnings:

  - You are about to drop the column `parentFolderId` on the `Event` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_parentFolderId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "parentFolderId",
ADD COLUMN     "documentPath" TEXT;
