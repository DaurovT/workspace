-- CreateTable OrgPosition
CREATE TABLE "OrgPosition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "section" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "staffLimit" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgPosition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrgPosition_code_key" ON "OrgPosition"("code");
ALTER TABLE "OrgPosition" ADD CONSTRAINT "OrgPosition_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "OrgPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Employee - make userId nullable, drop old FK, add new fields
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_userId_fkey";
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_shiftScheduleId_fkey";
ALTER TABLE "Employee" ALTER COLUMN "userId" DROP NOT NULL;

-- Add orgPositionId
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "orgPositionId" TEXT;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_orgPositionId_fkey"
  FOREIGN KEY ("orgPositionId") REFERENCES "OrgPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add personal data fields
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "hasSystemAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "middleName" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "nationality" TEXT DEFAULT 'Узбекистан';
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passportSeries" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passportNumber" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passportIssuedBy" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passportIssuedDate" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passportExpiry" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "inn" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "pinfl" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "medicalBookDate" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "medicalBookExpiry" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "uniformSize" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "education" TEXT;

-- Add inline schedule fields (replace shiftScheduleId)
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleType" TEXT NOT NULL DEFAULT '5_2';
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleWorkDays" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleRestDays" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleHours" DECIMAL NOT NULL DEFAULT 8;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleStart" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleEnd" TEXT NOT NULL DEFAULT '17:00';
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "scheduleCycleDate" TEXT;

-- Re-add nullable userId FK
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
