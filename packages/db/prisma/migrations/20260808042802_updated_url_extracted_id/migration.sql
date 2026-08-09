/*
  Warnings:

  - You are about to drop the column `extractedId` on the `Upvote` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Upvote` table. All the data in the column will be lost.
  - Added the required column `extractedId` to the `Stream` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Stream` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "extractedId" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Upvote" DROP COLUMN "extractedId",
DROP COLUMN "url";
