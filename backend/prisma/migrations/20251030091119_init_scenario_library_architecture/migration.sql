/*
  Warnings:

  - You are about to drop the column `scriptContent` on the `Test` table. All the data in the column will be lost.
  - Added the required column `options` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Test" DROP COLUMN "scriptContent",
ADD COLUMN     "options" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scriptFragment" TEXT NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TestScenarios" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TestScenarios_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_name_key" ON "Scenario"("name");

-- CreateIndex
CREATE INDEX "_TestScenarios_B_index" ON "_TestScenarios"("B");

-- AddForeignKey
ALTER TABLE "_TestScenarios" ADD CONSTRAINT "_TestScenarios_A_fkey" FOREIGN KEY ("A") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestScenarios" ADD CONSTRAINT "_TestScenarios_B_fkey" FOREIGN KEY ("B") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
