import type { Employee, Absence } from '@prisma/client';

// ─── Государственные праздники Узбекистана (фиксированные) ──────────────────
const UZ_FIXED_HOLIDAYS = [
  '01-01','01-02','03-08','03-21','03-22','03-23',
  '05-09','09-01','10-01','11-18','12-08',
];

/** Получить Set нерабочих дат {'YYYY-MM-DD'} для заданного года */
export function buildOffDaySet(year: number, extraOffDays: string[] = []): Set<string> {
  const set = new Set<string>();
  // Фиксированные праздники UZ
  UZ_FIXED_HOLIDAYS.forEach(md => set.add(`${year}-${md}`));
  // Кастомные доп. нерабочие дни
  extraOffDays.forEach(d => set.add(d));
  return set;
}

/** Проверить — является ли дата рабочей для данного графика */
export function isWorkingDay(
  dateStr: string,               // YYYY-MM-DD
  offDays: Set<string>,
  schedule?: ShiftScheduleInput | null,
): boolean {
  if (offDays.has(dateStr)) return false;

  const date = new Date(dateStr + 'T00:00:00');
  const dow = date.getDay(); // 0=Вс, 6=Сб

  if (!schedule) {
    // Default: 5/2 (пн-пт)
    return dow !== 0 && dow !== 6;
  }

  switch (schedule.type) {
    case '5_2':
      return dow !== 0 && dow !== 6;

    case '6_1':
      return dow !== 0; // пн-сб

    case '2_2':
    case 'custom': {
      if (!schedule.cycleStart) {
        // Без опорной даты — считаем как 5/2
        return dow !== 0 && dow !== 6;
      }
      const cycleStart = new Date(schedule.cycleStart + 'T00:00:00');
      const diffDays = Math.floor((date.getTime() - cycleStart.getTime()) / 86400000);
      const cycleLen = schedule.workDays + schedule.restDays;
      const posInCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen;
      return posInCycle < schedule.workDays;
    }

    default:
      return dow !== 0 && dow !== 6;
  }
}

export interface ShiftScheduleInput {
  type: string;
  workDays: number;
  restDays: number;
  hoursPerDay: number;
  cycleStart?: string | null;
}

/** Рабочие дни в месяце с учётом графика и праздников */
export function getWorkingDays(
  year: number,
  month: number,
  offDays: Set<string>,
  schedule?: ShiftScheduleInput | null,
): number {
  let days = 0;
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const ds = d.toISOString().slice(0, 10);
    if (isWorkingDay(ds, offDays, schedule)) days++;
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Рабочие дни в периоде отсутствия — пересечение с рабочим месяцем */
export function getAbsenceWorkingDays(
  absence: Absence,
  year: number,
  month: number,
  offDays: Set<string>,
  schedule?: ShiftScheduleInput | null,
): number {
  let days = 0;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month, 0);
  const absStart   = new Date(absence.startDate);
  const absEnd     = new Date(absence.endDate);

  const start = new Date(Math.max(absStart.getTime(), monthStart.getTime()));
  const end   = new Date(Math.min(absEnd.getTime(), monthEnd.getTime()));

  const cur = new Date(start);
  while (cur <= end) {
    const ds = cur.toISOString().slice(0, 10);
    if (isWorkingDay(ds, offDays, schedule)) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

type EmployeeWithData = Employee & {
  absences: Absence[];
  timeLogs?: any[];
  shiftSchedule?: ShiftScheduleInput | null;
};

export function calculatePayrollRun(
  month: number,
  year: number,
  type: 'advance' | 'final',
  employees: EmployeeWithData[],
  previousAdvances: Record<string, number> = {},
  extraOffDays: string[] = [],
) {
  const offDays = buildOffDaySet(year, extraOffDays);

  const entries = [];
  let totalGrossRun = 0;
  let totalNetRun   = 0;

  for (const emp of employees) {
    const schedule = (emp as any).shiftSchedule ?? null;
    const workingDaysInMonth = getWorkingDays(year, month, offDays, schedule);

    const hoursPerDay = schedule?.hoursPerDay ? Number(schedule.hoursPerDay) : 8;
    const dailyRate = emp.salaryType === 'hourly'
      ? emp.salary.toNumber() * hoursPerDay
      : emp.salary.toNumber() / workingDaysInMonth;

    let personalDays = 0;
    let sickDays     = 0;
    let vacationDays = 0;

    for (const abs of emp.absences) {
      if (abs.status !== 'approved') continue;
      const absDays = getAbsenceWorkingDays(abs, year, month, offDays, schedule);
      if (absDays <= 0) continue;
      if (abs.type === 'personal')  personalDays += absDays;
      if (abs.type === 'sick')      sickDays     += absDays;
      if (abs.type === 'vacation')  vacationDays += absDays;
    }

    let gross = 0;
    let netAmount = 0;
    let totalDeductions = 0;
    const details: any[] = [];
    let baseEarnings = 0;
    let overtimePay  = 0;

    if (type === 'advance') {
      const advancePct = emp.advancePct ? emp.advancePct.toNumber() : 40;
      gross = emp.salary.toNumber() * (advancePct / 100);
      netAmount = gross;
      details.push({ type: 'advance_payment', label: `Аванс (${advancePct}%)`, amount: gross });
    } else {
      const workedDays   = Math.max(0, workingDaysInMonth - personalDays - sickDays - vacationDays);
      const standardHours = workedDays * hoursPerDay;
      const totalLoggedHours = emp.timeLogs?.reduce((a: number, l: any) => a + Number(l.hours || 0), 0) ?? 0;

      if (emp.salaryType === 'hourly') {
        baseEarnings = totalLoggedHours * emp.salary.toNumber();
        details.push({ type: 'hourly_pay', label: `Оплата по часам (${totalLoggedHours} ч.)`, amount: baseEarnings });
      } else {
        baseEarnings = workedDays * dailyRate;
        if (totalLoggedHours > standardHours) {
          const overtimeHours = totalLoggedHours - standardHours;
          overtimePay = overtimeHours * (dailyRate / hoursPerDay) * 1.5;
          details.push({ type: 'overtime_pay', label: `Сверхурочные (${overtimeHours.toFixed(1)} ч.)`, amount: overtimePay });
        }
      }

      const sickPay    = sickDays    * dailyRate * 0.8;
      const vacationPay = vacationDays * dailyRate;
      gross = baseEarnings + overtimePay + sickPay + vacationPay;

      let ndfl = 0, inps = 0;
      if (!emp.taxProfile || emp.taxProfile === 'standard') {
        ndfl = gross * 0.12;
        inps = gross * 0.01;
      } else if (emp.taxProfile === 'non_resident') {
        ndfl = gross * 0.20;
      }
      totalDeductions += ndfl + inps;

      if (ndfl > 0)      details.push({ type: 'ndfl',     label: `НДФЛ (${emp.taxProfile === 'non_resident' ? 20 : 12}%)`, amount: -ndfl });
      if (inps > 0)      details.push({ type: 'inps',     label: 'ИНПС (1%)',                                               amount: -inps });
      if (sickPay > 0)   details.push({ type: 'sick_pay', label: `Больничные (${sickDays} дн.)`,                           amount: sickPay });
      if (vacationPay>0) details.push({ type: 'vacation_pay', label: `Отпускные (${vacationDays} дн.)`,                    amount: vacationPay });
      if (personalDays > 0) {
        const miss = personalDays * dailyRate;
        totalDeductions += miss;
        details.push({ type: 'absence_deduction', label: `Удержание (за свой счет: ${personalDays} дн.)`, amount: -miss });
      }

      const advancePaid = previousAdvances[emp.id] || 0;
      if (advancePaid > 0) {
        totalDeductions += advancePaid;
        details.push({ type: 'advance_deduction', label: 'Удержание выплаченного аванса', amount: -advancePaid });
      }

      netAmount = gross - totalDeductions;
    }

    totalGrossRun += gross;
    totalNetRun   += netAmount;

    entries.push({
      employeeId: emp.id,
      baseSalary:  type === 'advance' ? gross : baseEarnings,
      bonus:       overtimePay,
      deductions:  totalDeductions,
      netAmount,
      details: { create: details },
    });
  }

  return { totalGross: totalGrossRun, totalNet: totalNetRun, entries };
}
