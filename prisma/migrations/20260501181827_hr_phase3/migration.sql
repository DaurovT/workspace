-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "advancePct" DOUBLE PRECISION NOT NULL DEFAULT 40,
ADD COLUMN     "taxProfile" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "PayrollRun" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'final';

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "date" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeLog_userId_date_idx" ON "TimeLog"("userId", "date");
