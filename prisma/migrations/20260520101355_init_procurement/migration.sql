-- CreateTable
CREATE TABLE "ProcurementRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT,
    "dateStr" TEXT NOT NULL,
    "initiator" TEXT,
    "department" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "tenderAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tenderId" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "tenderPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "logisticsCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "brokerPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "brokerAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "certification" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customs" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "plannedDate" TEXT,
    "actualDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "number" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "winnerId" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementDocument" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "dateStr" TEXT,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcurementDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcurementItem_requestId_idx" ON "ProcurementItem"("requestId");

-- CreateIndex
CREATE INDEX "ProcurementItem_status_idx" ON "ProcurementItem"("status");

-- CreateIndex
CREATE INDEX "ProcurementDocument_itemId_idx" ON "ProcurementDocument"("itemId");

-- AddForeignKey
ALTER TABLE "ProcurementItem" ADD CONSTRAINT "ProcurementItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProcurementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementItem" ADD CONSTRAINT "ProcurementItem_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementDocument" ADD CONSTRAINT "ProcurementDocument_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ProcurementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
