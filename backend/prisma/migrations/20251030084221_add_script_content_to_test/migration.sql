/*
  Warnings:

  - You are about to drop the column `durationSec` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `targetUrl` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `vus` on the `Test` table. All the data in the column will be lost.
  - Added the required column `scriptContent` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Test" DROP COLUMN "durationSec",
DROP COLUMN "targetUrl",
DROP COLUMN "vus",
ADD COLUMN     "scriptContent" TEXT NOT NULL;
