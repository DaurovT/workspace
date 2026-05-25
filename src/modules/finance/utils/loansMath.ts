import { differenceInMonths, parseISO } from 'date-fns';
import type { Loan, Transaction } from '../financeStore';

export interface LoanAmortization {
  monthlyPayment: number;
  remainingPrincipal: number;
  accumulatedInterest: number;
  accumulatedPrincipalPaid: number;
  currentInterestPayment: number;
  currentPrincipalPayment: number;
  progressPercent: number;
  monthsRemaining: number;
  isPaidOff: boolean;
}

export function calculateLoan(loan: Loan, transactions: Transaction[] = []): LoanAmortization {
  const n = loan.termMonths;
  const r = (loan.interestRate / 100) / 12; // Monthly interest rate

  // Calculate monthly annuity payment
  let monthlyPayment = 0;
  if (r === 0) {
    monthlyPayment = loan.principalAmount / n;
  } else {
    monthlyPayment = loan.principalAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  // Find all transactions that actually paid off the principal
  // Assuming 'transfer' or 'expense' transactions linked to this loanId
  // For exact accounting, we would check how much of the transaction was body vs interest.
  // In our simplified transaction model, we'll assume any expense linked to the loan pays it off.
  // Wait, real accounting needs split. Since our Transactions don't have a specific "principal vs interest" field,
  // we will deduct principal based on the total payments made vs the expected schedule, 
  // or we just calculate theoretically if there are no explicit payment transactions yet.

  // To not break the existing UI while introducing transactions, we will first check
  // if there are any transactions. If not, we fall back to time-based (legacy).
  const loanTxs = transactions.filter(t => t.loanId === loan.id && t.type === 'expense');

  let accumulatedPrincipalPaid = 0;
  let accumulatedInterest = 0;
  let remainingPrincipal = loan.principalAmount;

  if (loanTxs.length > 0) {
    const totalPaidAmount = loanTxs.reduce((sum, tx) => sum + tx.amount, 0);

    let expectedInterest = 0;
    let tempPrincipal = loan.principalAmount;
    
    const today = new Date();
    const parsedDate = parseISO(loan.startDate);
    const monthsElapsed = Math.max(0, differenceInMonths(today, parsedDate));
    const currentMonthIndex = Math.min(monthsElapsed, n);
    
    for (let i = 0; i < currentMonthIndex; i++) {
      expectedInterest += tempPrincipal * r;
      tempPrincipal -= (monthlyPayment - (tempPrincipal * r));
    }
    
    accumulatedInterest = expectedInterest;
    accumulatedPrincipalPaid = Math.max(0, totalPaidAmount - accumulatedInterest);
    remainingPrincipal = Math.max(0, loan.principalAmount - accumulatedPrincipalPaid);
    
    let currentInterestPayment = 0;
    let currentPrincipalPayment = 0;
    
    if (remainingPrincipal > 0 && currentMonthIndex < n) {
      currentInterestPayment = remainingPrincipal * r;
      currentPrincipalPayment = monthlyPayment - currentInterestPayment;
    }

    return {
      monthlyPayment,
      remainingPrincipal,
      accumulatedInterest,
      accumulatedPrincipalPaid,
      currentInterestPayment,
      currentPrincipalPayment,
      progressPercent: Math.min(100, Math.max(0, (accumulatedPrincipalPaid / loan.principalAmount) * 100)),
      monthsRemaining: Math.max(0, n - currentMonthIndex),
      isPaidOff: remainingPrincipal <= 0
    };
  }

  // Legacy Time-based calculation (protected)
  const today = new Date();
  const parsedDate = parseISO(loan.startDate);
  const monthsElapsed = Math.max(0, differenceInMonths(today, parsedDate));

  const currentMonthIndex = Math.min(monthsElapsed, n);

  if (r === 0) {
    accumulatedPrincipalPaid = currentMonthIndex * monthlyPayment;
    remainingPrincipal = Math.max(0, loan.principalAmount - accumulatedPrincipalPaid);
    accumulatedInterest = 0;
  } else {
    for (let i = 0; i < currentMonthIndex; i++) {
      const interestPayment = remainingPrincipal * r;
      const principalPayment = monthlyPayment - interestPayment;
      remainingPrincipal -= principalPayment;
      accumulatedInterest += interestPayment;
      accumulatedPrincipalPaid += principalPayment;
    }
  }

  let currentInterestPayment = 0;
  let currentPrincipalPayment = 0;
  
  if (currentMonthIndex < n) {
    currentInterestPayment = remainingPrincipal * r;
    currentPrincipalPayment = monthlyPayment - currentInterestPayment;
  }

  const progressPercent = Math.min(100, Math.max(0, (accumulatedPrincipalPaid / loan.principalAmount) * 100));

  return {
    monthlyPayment,
    remainingPrincipal,
    accumulatedInterest,
    accumulatedPrincipalPaid,
    currentInterestPayment,
    currentPrincipalPayment,
    progressPercent,
    monthsRemaining: Math.max(0, n - currentMonthIndex),
    isPaidOff: currentMonthIndex >= n
  };
}
