import type { Employee, Absence } from '@prisma/client';

export function getWorkingDays(year: number, month: number): number {
  let days = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) days++; // Exclude Sunday (0) and Saturday (6)
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getAbsenceWorkingDays(absence: Absence, year: number, month: number): number {
  let days = 0;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // Last day of the month

  // Absences are stored as YYYY-MM-DD strings
  const absStart = new Date(absence.startDate);
  const absEnd = new Date(absence.endDate);

  const start = new Date(Math.max(absStart.getTime(), monthStart.getTime()));
  const end = new Date(Math.min(absEnd.getTime(), monthEnd.getTime()));

  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

type EmployeeWithData = Employee & { absences: Absence[], timeLogs?: any[] };

export function calculatePayrollRun(
  month: number, 
  year: number, 
  type: 'advance' | 'final',
  employees: EmployeeWithData[],
  previousAdvances: Record<string, number> = {}
) {
  const workingDaysInMonth = getWorkingDays(year, month);

  const entries = [];
  let totalGrossRun = 0;
  let totalNetRun = 0;

  for (const emp of employees) {
    // For hourly workers, dailyRate = hourly_rate * 8 (used for sick/vacation pay)
    // For monthly workers, dailyRate = monthly_salary / working_days
    const dailyRate = emp.salaryType === 'hourly' 
      ? emp.salary.toNumber() * 8 
      : emp.salary.toNumber() / workingDaysInMonth;
    
    let personalDays = 0;
    let sickDays = 0;
    let vacationDays = 0;

    for (const abs of emp.absences) {
      if (abs.status !== 'approved') continue;
      
      const absDays = getAbsenceWorkingDays(abs, year, month);
      if (absDays <= 0) continue;

      if (abs.type === 'personal') personalDays += absDays;
      if (abs.type === 'sick') sickDays += absDays;
      if (abs.type === 'vacation') vacationDays += absDays;
    }

    let gross = 0;
    let netAmount = 0;
    let totalDeductions = 0;
    const details = [];

    let baseEarnings = 0;
    let overtimePay = 0;

    if (type === 'advance') {
      const advancePct = emp.advancePct ? emp.advancePct.toNumber() : 40;
      gross = emp.salary.toNumber() * (advancePct / 100);
      netAmount = gross; // Usually no taxes on advance payouts
      details.push({ type: 'advance_payment', label: `Аванс (${advancePct}%)`, amount: gross });
    } else {
      const workedDays = Math.max(0, workingDaysInMonth - personalDays - sickDays - vacationDays);
      const standardHours = workedDays * 8;
      
      const totalLoggedHours = emp.timeLogs?.reduce((acc: number, log: any) => acc + (log.hours || 0), 0) || 0;

      if (emp.salaryType === 'hourly') {
        // For hourly contractors, we just pay exactly for the logged hours
        baseEarnings = totalLoggedHours * emp.salary.toNumber();
        details.push({ type: 'hourly_pay', label: `Оплата по часам (${totalLoggedHours} ч.)`, amount: baseEarnings });
      } else {
        // Standard monthly salary
        baseEarnings = workedDays * dailyRate;
        
        // Overtime check (only if totalLoggedHours exceeds standardHours)
        if (totalLoggedHours > standardHours) {
          const overtimeHours = totalLoggedHours - standardHours;
          const hourlyRate = dailyRate / 8;
          overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x multiplier
          details.push({ type: 'overtime_pay', label: `Сверхурочные (${overtimeHours.toFixed(1)} ч.)`, amount: overtimePay });
        }
      }

      const sickPay = sickDays * dailyRate * 0.8; // Sick leave paid at 80%
      const vacationPay = vacationDays * dailyRate; // Vacation paid at 100%

      gross = baseEarnings + overtimePay + sickPay + vacationPay;
      
      // Taxes
      let ndfl = 0;
      let inps = 0;
      
      if (emp.taxProfile === 'standard' || !emp.taxProfile) {
        ndfl = gross * 0.12; // 12% income tax
        inps = gross * 0.01; // 1% pension fund
      } else if (emp.taxProfile === 'non_resident') {
        ndfl = gross * 0.20; // 20% income tax
      } // 'b2b' implies 0 taxes

      totalDeductions += ndfl + inps;
      
      if (ndfl > 0) details.push({ type: 'ndfl', label: `НДФЛ (${emp.taxProfile === 'non_resident' ? '20' : '12'}%)`, amount: -ndfl });
      if (inps > 0) details.push({ type: 'inps', label: 'ИНПС (1%)', amount: -inps });

      if (sickPay > 0) details.push({ type: 'sick_pay', label: `Больничные (${sickDays} дн.)`, amount: sickPay });
      if (vacationPay > 0) details.push({ type: 'vacation_pay', label: `Отпускные (${vacationDays} дн.)`, amount: vacationPay });
      if (personalDays > 0) {
        const missingAmount = personalDays * dailyRate;
        totalDeductions += missingAmount;
        details.push({ type: 'absence_deduction', label: `Удержание (за свой счет: ${personalDays} дн.)`, amount: -missingAmount });
      }

      // Deduct previously paid advance
      const advancePaid = previousAdvances[emp.id] || 0;
      if (advancePaid > 0) {
        totalDeductions += advancePaid;
        details.push({ type: 'advance_deduction', label: 'Удержание выплаченного аванса', amount: -advancePaid });
      }

      netAmount = gross - totalDeductions;
    }

    totalGrossRun += gross;
    totalNetRun += netAmount;

    entries.push({
      employeeId: emp.id,
      baseSalary: type === 'advance' ? gross : baseEarnings,
      bonus: overtimePay,
      deductions: totalDeductions,
      netAmount,
      details: { create: details }
    });
  }

  return {
    totalGross: totalGrossRun,
    totalNet: totalNetRun,
    entries
  };
}
