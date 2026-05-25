
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const employees = await prisma.employee.findMany({ 
    where: { status: 'active' },
    include: {
      absences: {
        where: {
          status: 'approved',
          startDate: { startsWith: '2026-05' }
        }
      }
    }
  });
  console.log('Employees & Absences:', JSON.stringify(employees, null, 2));

  // let's manually run the calculation logic to see what it produces
  const entries = [];
  let totalGrossRun = 0;
  let totalNetRun = 0;

  for (const emp of employees) {
    const workingDaysInMonth = 22;
    let missingDays = 0;
    
    for (const abs of emp.absences) {
      const start = new Date(abs.startDate);
      const end = new Date(abs.endDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (abs.type === 'personal') {
         missingDays += duration;
      }
      if (abs.type === 'sick') {
         missingDays += (duration * 0.2); 
      }
    }

    const dailyRate = emp.salary / workingDaysInMonth;
    const adjustedSalary = Math.max(0, emp.salary - (dailyRate * missingDays));
    const bonus = 0;
    const gross = adjustedSalary + bonus;
    const ndfl = gross * 0.12;
    const inps = gross * 0.01;
    const deductions = ndfl + inps;
    const netAmount = gross - deductions;

    const details = [
      { type: 'ndfl', label: 'НДФЛ (12%)', amount: -ndfl },
      { type: 'inps', label: 'ИНПС (1%)', amount: -inps }
    ];

    if (missingDays > 0) {
      const missingAmount = emp.salary - adjustedSalary;
       details.push({ type: 'absence', label: 'Удержание за отсутствие', amount: -missingAmount });
    }

    totalGrossRun += gross;
    totalNetRun += netAmount;

    entries.push({
      employeeId: emp.id,
      baseSalary: emp.salary,
      bonus,
      deductions,
      netAmount,
      details: { create: details }
    });
  }
  
  console.log('Resulting Entries:', JSON.stringify(entries, null, 2));
}
test().finally(() => prisma.$disconnect());

