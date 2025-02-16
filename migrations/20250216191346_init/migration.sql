-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);
