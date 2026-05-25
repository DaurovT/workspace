-- AlterTable
ALTER TABLE "AuditLogEntry" ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "oldValue" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "baseAmount" DOUBLE PRECISION,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loanId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowedApps" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "joinedAt" TEXT,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "dealId" TEXT,
    "contractorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "issuedDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceDocument" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FinanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "companyName" TEXT NOT NULL DEFAULT 'WorkSpace Pro',
    "baseCurrency" TEXT NOT NULL DEFAULT 'RUB',
    "pnlMode" TEXT NOT NULL DEFAULT 'direct_indirect',
    "lockDate" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'workspace.local',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tashkent',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "workWeekStart" TEXT NOT NULL DEFAULT 'Понедельник',
    "sessionTimeout" TEXT NOT NULL DEFAULT '480',
    "forceLogoutOnClose" BOOLEAN NOT NULL DEFAULT false,
    "passwordMinLength" TEXT NOT NULL DEFAULT '8',
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT false,
    "twoFactor" BOOLEAN NOT NULL DEFAULT false,
    "ipWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "ipWhitelistText" TEXT NOT NULL DEFAULT '',
    "emailAssign" BOOLEAN NOT NULL DEFAULT true,
    "emailMention" BOOLEAN NOT NULL DEFAULT true,
    "emailDue" BOOLEAN NOT NULL DEFAULT true,
    "pushAll" BOOLEAN NOT NULL DEFAULT true,
    "digestFreq" TEXT NOT NULL DEFAULT 'daily',

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "messages" TEXT NOT NULL,

    CONSTRAINT "CopilotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpmnDiagram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xml" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BpmnDiagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BpmnAiChat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BpmnAiChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcanaProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#654ef1',
    "icon" TEXT NOT NULL DEFAULT '📁',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArcanaProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcanaProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "ArcanaProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcanaTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "assigneeId" TEXT,
    "reporterId" TEXT NOT NULL DEFAULT 'u1',
    "startDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loggedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArcanaTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcanaComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArcanaComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "hireDate" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "salaryType" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "contractorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "terminationDate" TEXT,
    "bankAccount" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalGross" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArcanaProjectMember_projectId_userId_key" ON "ArcanaProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ArcanaTask_projectId_idx" ON "ArcanaTask"("projectId");

-- CreateIndex
CREATE INDEX "ArcanaTask_assigneeId_idx" ON "ArcanaTask"("assigneeId");

-- CreateIndex
CREATE INDEX "ArcanaTask_status_idx" ON "ArcanaTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Absence_employeeId_idx" ON "Absence"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_month_year_key" ON "PayrollRun"("month", "year");

-- CreateIndex
CREATE INDEX "PayrollEntry_payrollRunId_idx" ON "PayrollEntry"("payrollRunId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_projectId_idx" ON "Transaction"("projectId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcanaProjectMember" ADD CONSTRAINT "ArcanaProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ArcanaProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcanaTask" ADD CONSTRAINT "ArcanaTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ArcanaProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcanaComment" ADD CONSTRAINT "ArcanaComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ArcanaTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
