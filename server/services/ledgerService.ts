import { Prisma } from '@prisma/client';
import { buildEntries, isBalanced, accountKindOf, type TxLike, type LedgerLine } from '../../src/modules/finance/lib/ledger';

// Feature flag: LEDGER_MODE=false disables write-path posting (rollback switch).
export const LEDGER_ON = process.env.LEDGER_MODE !== 'false';

type Db = Prisma.TransactionClient | any;

/** Build + validate + insert journal lines for one transaction. Throws on unbalanced. */
export async function postTransaction(db: Db, tx: {
  id: string; type: string; amount: any;
  accountId?: string | null; categoryId?: string | null;
}, accountType?: string | null): Promise<number> {
  const txLike: TxLike = {
    id: tx.id, type: tx.type, amount: Number(tx.amount),
    accountId: tx.accountId, categoryId: tx.categoryId, accountType,
  };
  const lines: LedgerLine[] = buildEntries(txLike);
  if (!lines.length) return 0; // not postable (transfer/missing refs) — skip, do not fail the API
  if (!isBalanced(lines)) throw new Error(`Ledger invariant violated for tx ${tx.id}: entries do not balance`);
  for (const l of lines) {
    await db.ledgerEntry.create({
      data: {
        transactionId: tx.id, accountRef: l.accountRef, accountKind: l.accountKind,
        debit: l.debit, credit: l.credit,
      },
    });
  }
  return lines.length;
}

/** Remove journal lines for a transaction (delete / before repost). */
export async function unpostTransaction(db: Db, transactionId: string): Promise<void> {
  await db.ledgerEntry.deleteMany({ where: { transactionId } });
}

/** Re-post after an update: unpost + post atomically (caller wraps in $transaction). */
export async function repostTransaction(db: Db, tx: any, accountType?: string | null): Promise<number> {
  await unpostTransaction(db, tx.id);
  return postTransaction(db, tx, accountType);
}

export { accountKindOf };
