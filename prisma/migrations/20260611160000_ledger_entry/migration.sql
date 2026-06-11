-- double-entry journal (ledger refactor stage 2)
CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "accountRef" TEXT NOT NULL,
  "accountKind" TEXT NOT NULL,
  "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'UZS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId")
    REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");
CREATE INDEX "LedgerEntry_accountRef_idx" ON "LedgerEntry"("accountRef");
