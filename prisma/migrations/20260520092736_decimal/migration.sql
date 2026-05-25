/*
  Warnings:

  - You are about to alter the column `balance` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `estimatedHours` on the `ArcanaTask` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `loggedHours` on the `ArcanaTask` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `initialCost` on the `Asset` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `salvageValue` on the `Asset` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `BudgetLine` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `paidAmount` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `shippedAmount` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `salary` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `advancePct` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `rate` on the `ExchangeRate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalAmount` on the `FinanceDocument` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `vatAmount` on the `FinanceDocument` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `targetAmount` on the `Fund` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `currentBalance` on the `Fund` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `paidAmount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `vatAmount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `principalAmount` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `interestRate` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `PaymentRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `PayrollDetail` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `baseSalary` on the `PayrollEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `bonus` on the `PayrollEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `deductions` on the `PayrollEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `netAmount` on the `PayrollEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalGross` on the `PayrollRun` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `totalNet` on the `PayrollRun` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `PlannedOperation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `vatRate` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `costPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `stockBalance` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `budget` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Purchase` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `paidAmount` on the `Purchase` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `SalaryHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `hours` on the `TimeLog` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `baseAmount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `exchangeRate` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[month,year,type]` on the table `PayrollRun` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PayrollRun_month_year_key";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ArcanaTask" ALTER COLUMN "estimatedHours" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "loggedHours" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "initialCost" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "salvageValue" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "BudgetLine" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Deal" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "shippedAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "salary" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "advancePct" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ExchangeRate" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "FinanceDocument" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "vatAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Fund" ALTER COLUMN "targetAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "vatAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Loan" ALTER COLUMN "principalAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PaymentRequest" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PayrollDetail" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PayrollEntry" ALTER COLUMN "baseSalary" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "bonus" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "deductions" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PayrollRun" ALTER COLUMN "totalGross" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalNet" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PlannedOperation" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "vatRate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "stockBalance" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SalaryHistory" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "TimeLog" ALTER COLUMN "hours" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "baseAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "exchangeRate" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_month_year_type_key" ON "PayrollRun"("month", "year", "type");

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ArcanaTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
