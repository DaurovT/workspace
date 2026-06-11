-- CreateTable ShiftSchedule
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workDays" INTEGER NOT NULL DEFAULT 5,
    "restDays" INTEGER NOT NULL DEFAULT 2,
    "hoursPerDay" DECIMAL(65,30) NOT NULL DEFAULT 8,
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "cycleStart" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkCalendarDay
CREATE TABLE "WorkCalendarDay" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "monthDay" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkCalendarDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCalendarDay_date_key" ON "WorkCalendarDay"("date");
CREATE INDEX "WorkCalendarDay_date_idx" ON "WorkCalendarDay"("date");

-- AlterTable Employee
ALTER TABLE "Employee" ADD COLUMN "shiftScheduleId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "shiftCycleStart" TEXT;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_shiftScheduleId_fkey" 
    FOREIGN KEY ("shiftScheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
