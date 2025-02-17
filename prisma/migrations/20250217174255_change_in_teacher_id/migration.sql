/*
  Warnings:

  - You are about to drop the column `groupName` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `teacherName` on the `Assignment` table. All the data in the column will be lost.
  - Added the required column `groupId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Assignment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "groupName",
DROP COLUMN "teacherName",
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
